import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { BookingDocumentClient, ConditionalPut } from './dynamoRepository.ts';
import { DynamoGuestBookingRepository } from './dynamoRepository.ts';
import { createMyBookingsHandler } from './handler.ts';
import { buildInvoiceBookingDraft, createAuthenticatedInvoiceOrchestrator, InvoiceOrchestrationError, InvoiceProviderFailure } from './invoiceOrchestration.ts';
import { prepareBookingCore, validateBookingPreparationRequest } from '../simplotel/bookingPreparation.ts';
import type { SimplotelAvailabilityResponse } from '../simplotel/bookingPreparation.ts';

globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
type Item = ConditionalPut['Item'];
class MemoryDocuments implements BookingDocumentClient {
  items = new Map<string, Item>();
  failNext: 'before' | 'after' | undefined;
  id(table: string, key: { pk: string; sk: string }) { return JSON.stringify([table, key.pk, key.sk]); }
  async get(input: Parameters<BookingDocumentClient['get']>[0]) {
    assert.equal(input.ConsistentRead, true);
    const Item = this.items.get(this.id(input.TableName, input.Key));
    return Item ? { Item: structuredClone(Item) } : {};
  }
  async query(input: Parameters<BookingDocumentClient['query']>[0]) {
    assert.equal(input.ConsistentRead, true);
    const Items = [...this.items.values()].filter(item => item.pk === input.ExpressionAttributeValues[':pk'] && item.sk.startsWith('SUBMISSION#'));
    return { Items: structuredClone(Items) };
  }
  async transactWrite(input: Parameters<BookingDocumentClient['transactWrite']>[0]) {
    const failure = this.failNext; this.failNext = undefined;
    if (failure === 'before') throw new Error('Mock database unavailable');
    for (const { Put: put } of input.TransactItems) {
      const old = this.items.get(this.id(put.TableName, put.Item));
      const ok = put.ConditionExpression === 'attribute_not_exists(pk)' ? !old :
        put.ConditionExpression === '#record.#version = :version' ? old?.record?.version === put.ExpressionAttributeValues?.[':version'] :
        put.ConditionExpression === 'attribute_not_exists(pk) OR #target = :target' ? !old || old.target === put.ExpressionAttributeValues?.[':target'] : false;
      if (!ok) throw Object.assign(new Error('Mock condition failed'), { name: 'TransactionCanceledException', CancellationReasons: [{ Code: 'ConditionalCheckFailed' }] });
    }
    for (const { Put: put } of input.TransactItems) this.items.set(this.id(put.TableName, put.Item), structuredClone(put.Item));
    if (failure === 'after') throw new Error('Mock acknowledgement lost');
  }
}
const ownerA = { issuer: 'https://cognito.test/pool', sub: 'TEST-GUEST-A' };
const ownerB = { ...ownerA, sub: 'TEST-GUEST-B' };
const ids = { bookingId: 'TEST-BOOKING-1', quoteId: 'TEST-QUOTE-1', invoiceId: 101 };
const baseBody = {
  submissionId: 'test-submission-0001', checkIn: '2099-01-01', checkOut: '2099-01-03', adults: 2, children: 0, childAge: [], rooms: 1,
  selection: { roomTypeId: 103939, ratePlanId: 11976, occupancyId: 'TEST-OCCUPANCY', totalPrice: '200.00', totalTaxesAndFees: '24.00', totalAmount: 224,
    ratePlan: { rate_plan_id: 11976, name: 'Test Rate', penalty: { name: 'Test policy', rules: [] } },
    occupancy: { id: 'TEST-OCCUPANCY', adults: '2', children: '0', total_price: '200.00', total_taxes_and_fees: '24.00',
      prices: [{ date: '2099-01-01', total_price: '100.00' }, { date: '2099-01-02', total_price: '100.00' }], addons: [] } },
  customerDetail: { name: 'Fictional Guest', email: 'booking-data@example.test', phone: '+910000000000', bookingForSelf: true },
};
const availability: SimplotelAvailabilityResponse = { rooms: [{ room_type: 103939, name: 'Test Room', availability: 2,
  rate_plans: [{ ...baseBody.selection.ratePlan, occupancies: [baseBody.selection.occupancy] }] }] };
function setup(provider: (calls: number) => Promise<typeof ids> = async () => ids) {
  const db = new MemoryDocuments();
  const repository = new DynamoGuestBookingRepository(db, 'local-test-bookings', () => '2026-09-04T00:00:00.000Z');
  let calls = 0;
  const create = (owner = ownerA) => createAuthenticatedInvoiceOrchestrator({
    authenticate: async () => owner,
    repository,
    validateAndPrepare: async body => {
      const request = validateBookingPreparationRequest(body);
      return { request, prepared: prepareBookingCore(request, availability, 7849) };
    },
    submitInvoice: () => provider(++calls),
    reportFailure: () => {},
  });
  return { db, repository, create, calls: () => calls };
}
const request = () => new Request('http://localhost/mock', { headers: { Authorization: 'Bearer MOCKED-NOT-A-TOKEN' } });
const expectCode = async (promise: Promise<unknown>, code: InvoiceOrchestrationError['code']) =>
  assert.rejects(promise, error => error instanceof InvoiceOrchestrationError && error.code === code);

test('same submission key is owner-scoped; booking email never determines ownership', async () => {
  const s = setup(async calls => ({ ...ids, bookingId: `TEST-BOOKING-${calls}`, invoiceId: 100 + calls }));
  assert.deepEqual(await s.create(ownerA)(request(), baseBody), { ...ids, bookingId: 'TEST-BOOKING-1', invoiceId: 101 });
  assert.deepEqual(await s.create(ownerB)(request(), baseBody), { ...ids, bookingId: 'TEST-BOOKING-2', invoiceId: 102 });
  assert.equal(s.calls(), 2);
  assert.equal((await s.repository.listOwned(ownerA, 7849)).length, 1);
  assert.equal((await s.repository.listOwned(ownerB, 7849)).length, 1);
});

test('identical repeat is recovered; changed guest or selection conflicts without another provider call', async () => {
  const s = setup(); const run = s.create();
  assert.deepEqual(await run(request(), baseBody), ids);
  assert.deepEqual(await run(request(), structuredClone(baseBody)), ids);
  const changed = structuredClone(baseBody); changed.customerDetail.email = 'different-booking-data@example.test';
  await expectCode(run(request(), changed), 'CONFLICT');
  assert.equal(s.calls(), 1);
  const stored = await s.repository.getOwned(ownerA, 7849, baseBody.submissionId);
  assert.equal(stored?.summary.referenceId, ids.bookingId);
});

test('live DD-MM-YYYY daily prices are normalized before durable begin and provider dispatch', async () => {
  const liveBody = structuredClone(baseBody);
  liveBody.checkIn = '2026-10-05'; liveBody.checkOut = '2026-10-06';
  liveBody.selection.occupancy.prices = [{ date: '05-10-2026', total_price: '200.00' }];
  const liveAvailability: SimplotelAvailabilityResponse = { rooms: [{ room_type: 103939, name: 'Test Room', availability: 1,
    rate_plans: [{ ...liveBody.selection.ratePlan, occupancies: [liveBody.selection.occupancy] }] }] };
  const db = new MemoryDocuments();
  const repository = new DynamoGuestBookingRepository(db, 'local-test-bookings', () => '2026-09-04T00:00:00.000Z');
  let providerCalls = 0;
  const run = createAuthenticatedInvoiceOrchestrator({ authenticate: async () => ownerA, repository,
    validateAndPrepare: async raw => { const request = validateBookingPreparationRequest(raw);
      return { request, prepared: prepareBookingCore(request, liveAvailability, 7849) }; },
    submitInvoice: async () => { providerCalls++; return ids; }, reportFailure: () => {} });
  assert.deepEqual(await run(request(), liveBody), ids);
  const stored = await repository.getOwned(ownerA, 7849, liveBody.submissionId);
  assert.equal(stored?.rooms[0]?.dailyPrices[0]?.date, '2026-10-05');
  assert.equal(stored?.processingState, 'invoice_created');
  assert.equal(providerCalls, 1);
});

test('only one concurrent dispatch claim can invoke provider', async () => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const s = setup(async () => { await gate; return ids; }); const run = s.create();
  const first = run(request(), baseBody);
  while (s.calls() === 0) await new Promise(resolve => setImmediate(resolve));
  await expectCode(run(request(), baseBody), 'OUTCOME_UNCERTAIN');
  release(); assert.deepEqual(await first, ids); assert.equal(s.calls(), 1);
});

test('definite rejection becomes terminal and is never retried', async () => {
  const s = setup(async () => { throw new InvoiceProviderFailure('rejected'); }); const run = s.create();
  await expectCode(run(request(), baseBody), 'PROVIDER_REJECTED');
  assert.equal((await s.repository.getOwned(ownerA, 7849, baseBody.submissionId))?.processingState, 'provider_rejected');
  await expectCode(run(request(), baseBody), 'PROVIDER_REJECTED'); assert.equal(s.calls(), 1);
});

test('timeout/unknown result becomes uncertain and cannot automatically retry', async () => {
  const s = setup(async () => { throw new InvoiceProviderFailure('uncertain'); }); const run = s.create();
  await expectCode(run(request(), baseBody), 'OUTCOME_UNCERTAIN');
  assert.equal((await s.repository.getOwned(ownerA, 7849, baseBody.submissionId))?.processingState, 'uncertain');
  await expectCode(run(request(), baseBody), 'OUTCOME_UNCERTAIN'); assert.equal(s.calls(), 1);
});

test('missing provider identifiers are treated as uncertain without retry', async () => {
  const s = setup(async () => ({ bookingId: '', quoteId: '', invoiceId: 0 }));
  await expectCode(s.create()(request(), baseBody), 'OUTCOME_UNCERTAIN');
  assert.equal((await s.repository.getOwned(ownerA, 7849, baseBody.submissionId))?.processingState, 'uncertain');
  await expectCode(s.create()(request(), baseBody), 'OUTCOME_UNCERTAIN'); assert.equal(s.calls(), 1);
});

test('successful provider result survives lost DynamoDB acknowledgement via consistent read', async () => {
  const holder: { db?: MemoryDocuments } = {};
  const s = setup(async () => { holder.db!.failNext = 'after'; return ids; }); holder.db = s.db;
  assert.deepEqual(await s.create()(request(), baseBody), ids);
  assert.equal((await s.repository.getOwned(ownerA, 7849, baseBody.submissionId))?.processingState, 'invoice_created');
  assert.equal(s.calls(), 1);
});

test('provider success with failed final write is uncertain and is not resubmitted', async () => {
  const holder: { db?: MemoryDocuments } = {};
  const s = setup(async () => { holder.db!.failNext = 'before'; return ids; }); holder.db = s.db; const run = s.create();
  await expectCode(run(request(), baseBody), 'OUTCOME_UNCERTAIN');
  assert.equal((await s.repository.getOwned(ownerA, 7849, baseBody.submissionId))?.processingState, 'uncertain');
  await expectCode(run(request(), baseBody), 'OUTCOME_UNCERTAIN'); assert.equal(s.calls(), 1);
});

test('provider booking ownership conflict cannot reassign the external booking', async () => {
  const s = setup();
  await s.create(ownerA)(request(), baseBody);
  await expectCode(s.create(ownerB)(request(), baseBody), 'OUTCOME_UNCERTAIN');
  assert.equal((await s.repository.getOwned(ownerB, 7849, baseBody.submissionId))?.processingState, 'uncertain');
});

test('identity-like and unknown client fields are rejected before preparation or provider dispatch', async () => {
  for (const field of ['sub', 'ownerId', 'pk', 'sk', 'propertyId', 'issuer']) {
    const s = setup(); await expectCode(s.create()(request(), { ...baseBody, [field]: 'attacker-value' }), 'INVALID_REQUEST');
    assert.equal(s.calls(), 0); assert.equal(s.db.items.size, 0);
  }
});

test('My Stays hides prepared, rejected and uncertain durable attempts', async () => {
  const s = setup();
  for (const [suffix, state] of [['prepared', undefined], ['rejected', 'rejected'], ['uncertain', 'uncertain'], ['success', 'success']] as const) {
    const body = { ...structuredClone(baseBody), submissionId: `test-submission-${suffix}-0001` };
    if (!state) {
      const validated = validateBookingPreparationRequest(body);
      await s.repository.begin(ownerA, 7849, body.submissionId,
        buildInvoiceBookingDraft(prepareBookingCore(validated, availability, 7849), validated));
    }
    else {
      // Use the shared repository so the history handler sees each lifecycle state.
      const run = createAuthenticatedInvoiceOrchestrator({ authenticate: async () => ownerA, repository: s.repository,
        validateAndPrepare: async raw => { const r = validateBookingPreparationRequest(raw); return { request: r, prepared: prepareBookingCore(r, availability, 7849) }; },
        submitInvoice: async () => { if (state !== 'success') throw new InvoiceProviderFailure(state); return { ...ids, bookingId: `TEST-${suffix}` }; } });
      try { await run(request(), body); } catch { /* expected */ }
    }
  }
  const response = await createMyBookingsHandler({ authenticate: async () => ownerA, repository: s.repository })(new Request('http://localhost/api/my-bookings'));
  const body = await response.json() as { bookings: { referenceId: string }[] };
  assert.equal(response.status, 200); assert.deepEqual(body.bookings.map(x => x.referenceId), ['TEST-success']);
});

test('orchestration has no default transport and route wiring remains in the guarded handler', () => {
  const source = readFileSync(new URL('./invoiceOrchestration.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /process\.env|createGuestHistoryDynamoTransport|postToSimplotel|SIMPLOTEL_ACCESS_TOKEN/);
  const route = readFileSync(new URL('../../app/api/simplotel/booking/send-invoice/route.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(route, /invoiceOrchestration|createAuthenticatedInvoiceOrchestrator|DynamoGuestBookingRepository/);
  assert.match(route, /createSendInvoiceHandler/);
});
