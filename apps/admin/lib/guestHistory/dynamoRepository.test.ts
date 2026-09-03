import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { BookingStorageConflict, DynamoGuestBookingRepository } from './dynamoRepository.ts';
import type { BookingDocumentClient, ConditionalPut } from './dynamoRepository.ts';
import type { BookingDraft } from './persistentModel.ts';
import { createMyBookingsHandler } from './handler.ts';

globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
type Item = ConditionalPut['Item'];
// TEST ONLY. Shared fake storage survives adapter replacement, not process exit.
// It models atomic DynamoDB conditional transactions; it is not production storage.
class LocalDocuments implements BookingDocumentClient {
  items = new Map<string, Item>();
  pageSize = 1;
  fail: 'before' | 'after' | undefined;
  id(table: string, key: { pk: string; sk: string }) { return JSON.stringify([table, key.pk, key.sk]); }
  async get(input: Parameters<BookingDocumentClient['get']>[0]) {
    assert.equal(input.ConsistentRead, true);
    const Item = this.items.get(this.id(input.TableName, input.Key));
    return { ...(Item ? { Item: structuredClone(Item) } : {}) };
  }
  async query(input: Parameters<BookingDocumentClient['query']>[0]) {
    assert.equal(input.ConsistentRead, true);
    assert.equal(input.KeyConditionExpression, '#pk = :pk AND begins_with(#sk, :prefix)');
    const all = [...this.items.entries()].filter(([key, item]) => key === this.id(input.TableName, item) &&
      item.pk === input.ExpressionAttributeValues[':pk'] && item.sk.startsWith(input.ExpressionAttributeValues[':prefix']))
      .map(([, item]) => item).sort((a, b) => a.sk.localeCompare(b.sk));
    const start = input.ExclusiveStartKey ? all.findIndex(i => i.sk === input.ExclusiveStartKey!.sk) + 1 : 0;
    const Items = all.slice(start, start + Math.min(this.pageSize, input.Limit));
    const last = Items.at(-1);
    return structuredClone({ Items, ...(last && start + Items.length < all.length ? { LastEvaluatedKey: { pk: last.pk, sk: last.sk } } : {}) });
  }
  async transactWrite(input: Parameters<BookingDocumentClient['transactWrite']>[0]) {
    const fail = this.fail; this.fail = undefined;
    if (fail === 'before') throw new Error('Local transport unavailable');
    // Validate every condition before changing anything: all-or-nothing.
    for (const { Put: put } of input.TransactItems) {
      const old = this.items.get(this.id(put.TableName, put.Item));
      let ok = false;
      switch (put.ConditionExpression) {
        case 'attribute_not_exists(pk)': ok = !old; break;
        case '#record.#version = :version': ok = !!old && old.record?.version === put.ExpressionAttributeValues?.[':version']; break;
        case 'attribute_not_exists(pk) OR #target = :target': ok = !old || old.target === put.ExpressionAttributeValues?.[':target']; break;
        default: throw new Error('Unsupported test condition');
      }
      if (!ok) throw Object.assign(new Error('Conditional test failure'), {
        name: 'TransactionCanceledException', CancellationReasons: [{ Code: 'ConditionalCheckFailed' }],
      });
    }
    for (const { Put: put } of input.TransactItems) this.items.set(this.id(put.TableName, put.Item), structuredClone(put.Item));
    if (fail === 'after') throw new Error('Local response lost after commit');
  }
}
const owner = { issuer: 'https://issuer.test/pool', sub: 'fictional-guest-a' };
const other = { ...owner, sub: 'fictional-guest-b' };
const key = 'test-submission-0001';
const ids = { bookingId: 'TEST-BOOKING', quoteId: 'TEST-QUOTE', invoiceId: 1 };
const money = (amount: string) => ({ amount, currency: 'INR' });
function draft(): BookingDraft {
  return { provenance: 'test_fixture', summary: { referenceId: 'TEST-ONLY', guestName: 'Fictional Guest', roomType: 'Test Room',
    checkInDate: '2099-01-01', checkOutDate: '2099-01-02', adults: 2, children: 0,
    bookingStatus: 'pending', paymentStatus: 'pending', stayState: 'upcoming', total: money('112.00') },
  rooms: [{ roomTypeId: 'TEST-ROOM', roomName: 'Test Room', ratePlanId: 'TEST-RATE', ratePlanName: 'Test Rate', adults: 2, children: 0,
    dailyPrices: [{ date: '2099-01-01', price: money('100.00'), taxes: [{ name: 'Test tax', amount: money('12.00') }] }],
    addons: [], penalties: [{ description: 'Test only policy', amount: money('0.00') }] }],
  totals: { subtotal: money('100.00'), taxes: money('12.00'), total: money('112.00') } };
}
function setup() {
  const db = new LocalDocuments();
  const repo = () => new DynamoGuestBookingRepository(db, 'local-test-bookings', () => '2026-09-03T00:00:00.000Z');
  return { db, repo };
}
test('owner, issuer and property are isolated; queries paginate and handler projects safely', async () => {
  const { repo } = setup(); const r = repo();
  await r.begin(owner, 7849, key, draft());
  const past = draft(); past.summary.checkInDate = '2000-01-01'; past.summary.checkOutDate = '2000-01-02';
  past.summary.stayState = 'past'; past.rooms[0].dailyPrices[0].date = '2000-01-01';
  await r.begin(owner, 7849, 'test-submission-0002', past);
  await r.begin(other, 7849, key, draft());
  await r.begin(owner, 99, key, draft());
  await r.begin({ ...owner, issuer: 'https://other.test/pool' }, 7849, key, draft());
  assert.equal((await r.listOwned(owner, 7849)).length, 2);
  assert.equal((await r.listOwned(other, 7849)).length, 1);
  assert.equal((await r.listOwned(owner, 99)).length, 1);
  assert.equal(await r.getOwned({ ...owner, sub: 'absent' }, 7849, key), undefined);
  const response = await createMyBookingsHandler({ authenticate: async () => owner, repository: r })(new Request('http://localhost/api/my-bookings'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { bookings: [draft().summary, past.summary] });
});
test('concurrent duplicate begins are idempotent across adapter instances; changed snapshot conflicts', async () => {
  const { repo } = setup();
  const results = await Promise.all(Array.from({ length: 8 }, () => repo().begin(owner, 7849, key, draft())));
  assert.equal(new Set(results.map(r => r.recordId)).size, 1);
  assert.equal(results[0].requestFingerprint.length, 64);
  const changed = draft(); changed.rooms[0].ratePlanId = 'DIFFERENT';
  await assert.rejects(repo().begin(owner, 7849, key, changed), BookingStorageConflict);
  assert.equal((await repo().listOwned(owner, 7849)).length, 1);
});
test('only one concurrent dispatch claim succeeds; invoice stays pending, never confirmed/paid', async () => {
  const { repo } = setup(); const r = repo();
  await r.begin(owner, 7849, key, draft());
  const claims = await Promise.allSettled([r.advance(owner, 7849, key, 1, 'dispatching'), repo().advance(owner, 7849, key, 1, 'dispatching')]);
  assert.equal(claims.filter(c => c.status === 'fulfilled').length, 1);
  const invoice = await r.advance(owner, 7849, key, 2, 'invoice_created', ids);
  assert.equal(invoice.version, 3);
  assert.equal(invoice.summary.bookingStatus, 'pending');
  assert.equal(invoice.summary.paymentStatus, 'pending');
  assert.deepEqual(invoice.simplotelIdentifiers, ids);
  await assert.rejects(r.advance(owner, 7849, key, 2, 'invoice_created', ids), BookingStorageConflict);
});
test('lost database acknowledgement recovers by reading; interrupted dispatch cannot be replayed', async () => {
  const { db, repo } = setup(); db.fail = 'after';
  await assert.rejects(repo().begin(owner, 7849, key, draft()), /response lost/);
  const recovered = await repo().begin(owner, 7849, key, draft());
  assert.equal(recovered.version, 1);
  db.fail = 'after';
  await assert.rejects(repo().advance(owner, 7849, key, 1, 'dispatching'), /response lost/);
  assert.equal((await repo().getOwned(owner, 7849, key))?.processingState, 'dispatching');
  await assert.rejects(repo().advance(owner, 7849, key, 1, 'dispatching'), BookingStorageConflict);
  await repo().advance(owner, 7849, key, 2, 'uncertain');
  await assert.rejects(repo().advance(owner, 7849, key, 3, 'prepared'), BookingStorageConflict);
  assert.equal((await repo().begin(owner, 7849, key, draft())).processingState, 'uncertain');
  db.fail = 'after';
  await assert.rejects(repo().advance(owner, 7849, key, 3, 'invoice_created', ids), /response lost/);
  assert.equal((await repo().getOwned(owner, 7849, key))?.processingState, 'invoice_created');
});
test('external booking ID ownership cannot be reassigned; transaction rollback is atomic', async () => {
  const { repo } = setup(); const r = repo();
  for (const identity of [owner, other]) {
    await r.begin(identity, 7849, key, draft()); await r.advance(identity, 7849, key, 1, 'dispatching');
  }
  await r.advance(owner, 7849, key, 2, 'invoice_created', ids);
  await assert.rejects(r.advance(other, 7849, key, 2, 'invoice_created', ids), BookingStorageConflict);
  assert.equal((await r.getOwned(other, 7849, key))?.version, 2);
  await r.begin(owner, 99, key, draft()); await r.advance(owner, 99, key, 1, 'dispatching');
  await r.advance(owner, 99, key, 2, 'invoice_created', ids); // Different property namespace.
});
test('unknown/sensitive fields, invalid dates and identifiers rejected before writes', async () => {
  const { db, repo } = setup();
  for (const mutate of [
    (d: BookingDraft) => Object.assign(d, { accessToken: 'TEST-ONLY-NOT-A-TOKEN' }),
    (d: BookingDraft) => Object.assign(d.rooms[0], { password: 'TEST-ONLY-NOT-A-PASSWORD' }),
    (d: BookingDraft) => { d.summary.checkInDate = '2099-02-30'; },
    (d: BookingDraft) => { d.summary.checkInDate = '01-01-2099'; },
    (d: BookingDraft) => { d.summary.bookingStatus = 'confirmed'; },
  ]) {
    const d = draft(); mutate(d); await assert.rejects(repo().begin(owner, 7849, key, d));
  }
  assert.equal(db.items.size, 0);
  await repo().begin(owner, 7849, key, draft()); await repo().advance(owner, 7849, key, 1, 'dispatching');
  await assert.rejects(repo().advance(owner, 7849, key, 2, 'invoice_created', { ...ids, invoiceId: 0 }));
});
test('transport failures fail closed; defensive reads reject overbroad or corrupted storage', async () => {
  const { db, repo } = setup(); db.fail = 'before';
  await assert.rejects(repo().begin(owner, 7849, key, draft()), /unavailable/);
  assert.equal(db.items.size, 0);
  await repo().begin(owner, 7849, key, draft());
  const item = [...db.items.values()][0]; item.record!.owner = other;
  await assert.rejects(repo().listOwned(owner, 7849), /ownership/);
});
test('production route remains empty; adapter has no default AWS transport or execution wiring', () => {
  const route = readFileSync(new URL('../../app/api/my-bookings/route.ts', import.meta.url), 'utf8');
  assert.match(route, /repository: emptyGuestBookingRepository/);
  assert.doesNotMatch(route, /DynamoGuestBookingRepository/);
  const source = readFileSync(new URL('./dynamoRepository.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /fetch\(|process\.env|@aws-sdk|send-invoice|endpoint:|console\./);
});
