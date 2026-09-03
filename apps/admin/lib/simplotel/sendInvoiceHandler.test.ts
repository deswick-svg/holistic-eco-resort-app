import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { GuestHistoryAuthError } from '../guestHistory/cognito.ts';
import { BookingStorageConflict } from '../guestHistory/dynamoRepository.ts';
import type { PersistentBookingRecord, ProcessingState } from '../guestHistory/persistentModel.ts';
import { createSendInvoiceHandler } from './sendInvoiceHandler.ts';
import { POST as defaultPost } from '../../app/api/simplotel/booking/send-invoice/route.ts';
import type { SimplotelAvailabilityResponse } from './bookingPreparation.ts';

globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
const owner = { issuer: 'https://cognito.test/pool', sub: 'TEST-GUEST-A' };
const ids = { bookingId: 'TEST-BOOKING', quoteId: 'TEST-QUOTE', invoiceId: 42 };
const body = { submissionId: 'test-route-submit-0001', checkIn: '2099-01-01', checkOut: '2099-01-02', adults: 2, children: 0, childAge: [], rooms: 1,
  selection: { roomTypeId: 103939, ratePlanId: 11976, occupancyId: 'TEST-OCC', totalPrice: '100.00', totalTaxesAndFees: '12.00', totalAmount: 112,
    ratePlan: { rate_plan_id: 11976, name: 'Test Rate', penalty: { name: 'Test policy' } },
    occupancy: { id: 'TEST-OCC', adults: '2', children: '0', total_price: '100.00', total_taxes_and_fees: '12.00',
      prices: [{ date: '2099-01-01', total_price: '100.00' }], addons: [] } },
  customerDetail: { name: 'Fictional Guest', email: 'booking@example.test', phone: '+910000000000', bookingForSelf: true } };
const availability: SimplotelAvailabilityResponse = { rooms: [{ room_type: 103939, name: 'Test Room', availability: 1,
  rate_plans: [{ ...body.selection.ratePlan, occupancies: [body.selection.occupancy] }] }] };

class MemoryLifecycleRepository {
  records = new Map<string, PersistentBookingRecord>();
  events: string[] = [];
  key(identity: typeof owner, submission: string) { return `${identity.issuer}|${identity.sub}|7849|${submission}`; }
  async begin(identity: typeof owner, property: number, submission: string, draft: Parameters<MemoryLifecycleRepository['make']>[0]) {
    assert.equal(property, 7849); const key = this.key(identity, submission); const old = this.records.get(key);
    const fingerprint = createHash('sha256').update(JSON.stringify([identity, property, draft])).digest('hex');
    if (old) { if (old.requestFingerprint !== fingerprint) throw new BookingStorageConflict(); return structuredClone(old); }
    const record = this.make(draft, identity, property, submission, fingerprint); this.records.set(key, record); this.events.push('prepared'); return structuredClone(record);
  }
  make(draft: Omit<PersistentBookingRecord, 'owner' | 'propertyId' | 'recordId' | 'schemaVersion' | 'submissionKey' | 'requestFingerprint' | 'processingState' | 'version' | 'createdAt' | 'updatedAt'>,
    identity: typeof owner, property: number, submission: string, fingerprint: string): PersistentBookingRecord {
    return { ...structuredClone(draft), owner: identity, propertyId: property, recordId: `TEST-${identity.sub}`, schemaVersion: 1,
      submissionKey: submission, requestFingerprint: fingerprint, processingState: 'prepared', version: 1,
      createdAt: '2026-09-04T00:00:00.000Z', updatedAt: '2026-09-04T00:00:00.000Z' };
  }
  async getOwned(identity: typeof owner, _property: number, submission: string) { return structuredClone(this.records.get(this.key(identity, submission))); }
  async advance(identity: typeof owner, _property: number, submission: string, version: number, state: ProcessingState,
    providerIds?: { bookingId: string; quoteId: string; invoiceId: number }) {
    const key = this.key(identity, submission); const old = this.records.get(key);
    if (!old || old.version !== version) throw new BookingStorageConflict();
    const next = { ...old, processingState: state, version: version + 1,
      ...(providerIds ? { simplotelIdentifiers: providerIds, summary: { ...old.summary, referenceId: providerIds.bookingId } } : {}) };
    this.records.set(key, next); this.events.push(state); return structuredClone(next);
  }
}
function request(requestBody: unknown = body) {
  return new Request('http://localhost/api/simplotel/booking/send-invoice', { method: 'POST',
    headers: { Authorization: 'Bearer MOCKED-ACCESS-TOKEN' }, body: JSON.stringify(requestBody) });
}
function setup(overrides: Partial<Parameters<typeof createSendInvoiceHandler>[0]> = {}) {
  const repository = new MemoryLifecycleRepository(); let providerCalls = 0; let authCalls = 0;
  const handler = createSendInvoiceHandler({ enabled: () => true, authorizeTest: () => {},
    inventoryHold: () => ({ enabled: true, value: 30, unit: 'MINUTES' }), accessToken: () => 'mock-server-token',
    authenticate: async () => { authCalls++; return owner; }, repository,
    revalidate: async () => { repository.events.push('revalidated'); return availability; },
    submitInvoice: async () => { providerCalls++; assert.equal(repository.events.at(-1), 'dispatching'); repository.events.push('provider'); return ids; },
    ...overrides });
  return { handler, repository, providerCalls: () => providerCalls, authCalls: () => authCalls };
}

test('disabled and unauthenticated requests cannot reach storage or provider', async () => {
  const disabled = setup({ enabled: () => false });
  assert.equal((await disabled.handler(request())).status, 403); assert.equal(disabled.authCalls(), 0); assert.deepEqual(disabled.repository.events, []);
  const unauthenticated = setup({ authenticate: async () => { throw new GuestHistoryAuthError(401); } });
  assert.equal((await unauthenticated.handler(request())).status, 401); assert.deepEqual(unauthenticated.repository.events, []);
});

test('default route remains externally disabled without the execution flag', async () => {
  const old = process.env.SIMPLOTEL_BOOKING_ENABLED;
  try {
    delete process.env.SIMPLOTEL_BOOKING_ENABLED;
    const response = await defaultPost(request());
    assert.equal(response.status, 403);
    assert.equal((await response.json() as { error: { code: string } }).error.code, 'EXECUTION_DISABLED');
  } finally {
    if (old === undefined) delete process.env.SIMPLOTEL_BOOKING_ENABLED; else process.env.SIMPLOTEL_BOOKING_ENABLED = old;
  }
});

test('authenticated route persists owner and claims dispatch before provider; repeat is idempotent', async () => {
  const s = setup(); const response = await s.handler(request());
  assert.equal(response.status, 200); assert.deepEqual(await response.json(), { booking_id: ids.bookingId, quote_id: ids.quoteId,
    invoice_id: ids.invoiceId, status: 'PAYMENT_LINK_CREATED', bookingStatus: 'UNCONFIRMED', paymentStatus: 'PAYMENT_PENDING' });
  assert.deepEqual(s.repository.events, ['revalidated', 'prepared', 'dispatching', 'provider', 'invoice_created']);
  const stored = await s.repository.getOwned(owner, 7849, body.submissionId);
  assert.deepEqual(stored?.owner, owner); assert.deepEqual(stored?.simplotelIdentifiers, ids);
  assert.equal(stored?.summary.bookingStatus, 'pending'); assert.equal(stored?.summary.paymentStatus, 'pending');
  assert.equal((await s.handler(request())).status, 200); assert.equal(s.providerCalls(), 1);
});

test('route rejects conflicting and identity-like client data', async () => {
  const s = setup(); assert.equal((await s.handler(request())).status, 200);
  const changed = structuredClone(body); changed.customerDetail.email = 'changed@example.test';
  assert.equal((await s.handler(request(changed))).status, 409); assert.equal(s.providerCalls(), 1);
  assert.equal((await setup().handler(request({ ...body, sub: 'attacker' }))).status, 400);
});

test('default route wiring uses guarded auth/Dynamo/provider adapters and mobile sends only Cognito bearer auth', () => {
  const route = readFileSync(new URL('../../app/api/simplotel/booking/send-invoice/route.ts', import.meta.url), 'utf8');
  assert.match(route, /authenticate: authenticateGuest/); assert.match(route, /repository: guestHistoryWriteRepository/);
  assert.match(route, /enabled: isFullOnlinePaymentEnabled/); assert.match(route, /authorizeTest: requireInvoiceTestAuthorization/);
  assert.match(route, /endpoint: 'send-invoice'/); assert.doesNotMatch(route, /endpoint: 'book'/);
  const mobile = readFileSync(new URL('../../../mobile/src/services/simplotel.ts', import.meta.url), 'utf8');
  assert.match(mobile, /fetchAuthSession/); assert.match(mobile, /Authorization: `Bearer \$\{accessToken\.toString\(\)\}`/);
  assert.doesNotMatch(mobile, /X-Simplotel-Test-Authorization|SIMPLOTEL_INVOICE_TEST_SECRET/);
});
