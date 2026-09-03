import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createGuestHistoryDynamoTransport, readGuestHistoryDynamoConfig } from './dynamoTransport.ts';
import { BookingStorageConflict } from './dynamoRepository.ts';
import type { BookingDraft } from './persistentModel.ts';

globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
type AV = { S?: string; N?: string; M?: Record<string, AV>; L?: AV[] };
type WireItem = Record<string, AV>;
type Put = { TableName: string; Item: WireItem; ConditionExpression: string; ExpressionAttributeValues?: WireItem; ExpressionAttributeNames?: Record<string, string> };
type Wire = { TransactItems?: { Put: Put }[]; Key?: WireItem; TableName?: string; ConsistentRead?: boolean;
  ExpressionAttributeValues?: WireItem; KeyConditionExpression?: string; ExclusiveStartKey?: WireItem; Limit?: number };
// TEST ONLY: exercises the REAL SDK serializer/deserializer through an in-process
// request handler. This is not a DynamoDB server or proof of live service behaviour.
class WireDatabase {
  items = new Map<string, WireItem>();
  calls: { operation: string; body: Wire }[] = [];
  loseNextWrite = false;
  throttleNextWrite = false;
  id(item: WireItem) { return JSON.stringify([item.pk, item.sk]); }
  async handle(request: { headers: Record<string, string>; body?: unknown }) {
    const operation = request.headers['x-amz-target'].split('.').at(-1)!;
    const body = JSON.parse(request.body instanceof Uint8Array
      ? Buffer.from(request.body.buffer, request.body.byteOffset, request.body.byteLength).toString('utf8')
      : String(request.body)) as Wire;
    // Never retain or print Authorization/signing headers, even from test SDK.
    this.calls.push({ operation, body });
    const response = (data: unknown, statusCode = 200) => ({ response: {
      statusCode, headers: { 'content-type': 'application/x-amz-json-1.0' }, body: Buffer.from(JSON.stringify(data)),
    } });
    if (operation === 'TransactWriteItems') {
      if (this.throttleNextWrite) {
        this.throttleNextWrite = false;
        return response({ __type: 'ProvisionedThroughputExceededException', message: 'Local test throttle' }, 400);
      }
      const writes = body.TransactItems!;
      const reasons = writes.map(({ Put: p }) => {
        const old = this.items.get(this.id(p.Item));
        let ok: boolean;
        if (p.ConditionExpression === 'attribute_not_exists(pk)') ok = !old;
        else if (p.ConditionExpression === '#record.#version = :version') {
          assert.deepEqual(p.ExpressionAttributeNames, { '#record': 'record', '#version': 'version' });
          ok = !!old && old.record.M!.version.N === p.ExpressionAttributeValues![':version'].N;
        } else {
          assert.equal(p.ConditionExpression, 'attribute_not_exists(pk) OR #target = :target');
          ok = !old || old.target.S === p.ExpressionAttributeValues![':target'].S;
        }
        return { Code: ok ? 'None' : 'ConditionalCheckFailed' };
      });
      if (reasons.some(r => r.Code !== 'None')) return response({ __type: 'TransactionCanceledException', message: 'Local condition failed', CancellationReasons: reasons }, 400);
      for (const { Put: p } of writes) this.items.set(this.id(p.Item), structuredClone(p.Item));
      if (this.loseNextWrite) { this.loseNextWrite = false; throw Object.assign(new Error('Local response lost'), { name: 'TimeoutError' }); }
      return response({});
    }
    assert.equal(body.ConsistentRead, true);
    if (operation === 'GetItem') return response({ Item: this.items.get(this.id(body.Key!)) });
    assert.equal(operation, 'Query');
    assert.equal(body.KeyConditionExpression, '#pk = :pk AND begins_with(#sk, :prefix)');
    assert.equal(body.Limit, 100);
    const entries = [...this.items.values()].filter(i => i.pk.S === body.ExpressionAttributeValues![':pk'].S &&
      i.sk.S!.startsWith(body.ExpressionAttributeValues![':prefix'].S!)).sort((a, b) => a.sk.S!.localeCompare(b.sk.S!));
    const offset = body.ExclusiveStartKey ? entries.findIndex(i => this.id(i) === this.id(body.ExclusiveStartKey!)) + 1 : 0;
    const item = entries[offset];
    return response({ Items: item ? [item] : [], LastEvaluatedKey: item && offset + 1 < entries.length ? { pk: item.pk, sk: item.sk } : {} });
  }
}
const identity = { issuer: 'https://issuer.test/pool', sub: 'test-only-guest' };
const key = 'test-submission-0001';
const ids = { bookingId: 'TEST-BOOKING', quoteId: 'TEST-QUOTE', invoiceId: 1 };
const money = { amount: '112.00', currency: 'INR' };
function draft(): BookingDraft {
  return { provenance: 'test_fixture', summary: { referenceId: 'TEST-ONLY', guestName: 'Fictional Guest', roomType: 'Test Room',
    checkInDate: '2099-01-01', checkOutDate: '2099-01-02', adults: 2, children: 0,
    bookingStatus: 'pending', paymentStatus: 'pending', stayState: 'upcoming', total: money },
  rooms: [{ roomTypeId: 'TEST-ROOM', roomName: 'Test Room', ratePlanId: 'TEST-RATE', ratePlanName: 'Test Rate', adults: 2, children: 0,
    dailyPrices: [{ date: '2099-01-01', price: money, taxes: [] }], addons: [], penalties: [] }] };
}
function setup() {
  const db = new WireDatabase();
  let providerCalls = 0;
  const create = () => createGuestHistoryDynamoTransport({ region: 'eu-north-1', table: 'local-test-bookings' }, {
    requestHandler: db,
    // Ephemeral fake signing material: no profile, credentials file, IMDS or AWS.
    credentials: async () => { providerCalls++; return { accessKeyId: randomBytes(10).toString('hex'), secretAccessKey: randomBytes(20).toString('hex') }; },
  });
  return { db, create, providerCalls: () => providerCalls };
}
test('configuration fails closed; factory is lazy; live route remains disconnected', () => {
  for (const env of [{}, { AWS_REGION: 'eu-north-1' }, { AWS_REGION: 'invalid', GUEST_HISTORY_DYNAMODB_TABLE: 'test' }, { AWS_REGION: 'eu-north-1', GUEST_HISTORY_DYNAMODB_TABLE: ' ' }]) {
    assert.throws(() => readGuestHistoryDynamoConfig(env), /configuration/);
  }
  assert.deepEqual(readGuestHistoryDynamoConfig({ AWS_REGION: 'eu-north-1', GUEST_HISTORY_DYNAMODB_TABLE: 'local-test-bookings' }), { region: 'eu-north-1', table: 'local-test-bookings' });
  const s = setup(); const transport = s.create();
  assert.equal(s.providerCalls(), 0); assert.equal(s.db.calls.length, 0); transport.destroy();
  const route = readFileSync(new URL('../../app/api/my-bookings/route.ts', import.meta.url), 'utf8');
  assert.match(route, /repository: emptyGuestBookingRepository/);
  assert.doesNotMatch(route, /dynamoTransport|createGuestHistoryDynamoTransport/);
});
test('SDK marshals transaction conditions/nested snapshots and unmarshals consistent owner reads', async () => {
  const s = setup(); const t = s.create();
  try {
    const record = await t.repository.begin(identity, 7849, key, draft());
    const put = s.db.calls[0].body.TransactItems![0].Put;
    assert.equal(s.db.calls[0].operation, 'TransactWriteItems');
    assert.equal(put.ConditionExpression, 'attribute_not_exists(pk)');
    assert.equal(put.Item.record.M!.version.N, '1');
    assert.equal(put.Item.record.M!.summary.M!.total.M!.amount.S, '112.00');
    assert.equal(put.Item.record.M!.summary.M!.checkInDate.S, '2099-01-01');
    assert.equal(put.Item.record.M!.owner.M!.sub.S, identity.sub);
    assert.deepEqual(await t.repository.getOwned(identity, 7849, key), record);
    await t.repository.begin(identity, 7849, 'test-submission-0002', draft());
    assert.equal((await t.repository.listOwned(identity, 7849)).length, 2); // SDK pagination, including empty final cursor.
    assert.deepEqual(await t.repository.listOwned({ ...identity, sub: 'other' }, 7849), []);
    assert.deepEqual(await t.repository.listOwned(identity, 99), []);
    assert.deepEqual(await t.repository.listOwned({ ...identity, issuer: 'https://other.test' }, 7849), []);
  } finally { t.destroy(); }
});
test('real SDK cancellation deserialization supports duplicates and fingerprint conflicts', async () => {
  const s = setup(); const t = s.create(); const replacement = s.create();
  try {
    const original = await t.repository.begin(identity, 7849, key, draft());
    assert.equal((await replacement.repository.begin(identity, 7849, key, draft())).recordId, original.recordId);
    const changed = draft(); changed.rooms[0].ratePlanId = 'OTHER';
    await assert.rejects(t.repository.begin(identity, 7849, key, changed), BookingStorageConflict);
    assert.equal(s.db.items.size, 1);
  } finally { t.destroy(); replacement.destroy(); }
});
test('CAS and external ownership reservation stay in one SDK transaction; conflicts roll back', async () => {
  const s = setup(); const t = s.create(); const other = { ...identity, sub: 'another' };
  try {
    for (const owner of [identity, other]) { await t.repository.begin(owner, 7849, key, draft()); await t.repository.advance(owner, 7849, key, 1, 'dispatching'); }
    await t.repository.advance(identity, 7849, key, 2, 'invoice_created', ids);
    const writes = s.db.calls.at(-1)!.body.TransactItems!;
    assert.equal(writes.length, 2);
    assert.equal(writes[0].Put.ExpressionAttributeValues![':version'].N, '2');
    assert.equal(writes[1].Put.Item.sk.S, 'OWNERSHIP');
    assert.equal(writes[1].Put.Item.target.S, writes[1].Put.ExpressionAttributeValues![':target'].S);
    await assert.rejects(t.repository.advance(other, 7849, key, 2, 'invoice_created', ids), BookingStorageConflict);
    assert.equal((await t.repository.getOwned(other, 7849, key))!.version, 2);
  } finally { t.destroy(); }
});
test('lost write response and throttling are not retried; recovery cannot redispatch', async () => {
  const s = setup(); const t = s.create();
  try {
    s.db.loseNextWrite = true;
    await assert.rejects(t.repository.begin(identity, 7849, key, draft()), /response lost/);
    assert.equal(s.db.calls.length, 1);
    assert.equal((await t.repository.getOwned(identity, 7849, key))!.version, 1);
    s.db.loseNextWrite = true;
    await assert.rejects(t.repository.advance(identity, 7849, key, 1, 'dispatching'), /response lost/);
    assert.equal((await t.repository.getOwned(identity, 7849, key))!.processingState, 'dispatching');
    await assert.rejects(t.repository.advance(identity, 7849, key, 1, 'dispatching'), BookingStorageConflict);
    await t.repository.advance(identity, 7849, key, 2, 'uncertain');
    await assert.rejects(t.repository.advance(identity, 7849, key, 3, 'prepared'), BookingStorageConflict);
    await t.repository.advance(identity, 7849, key, 3, 'invoice_created', ids);
    const recovered = await t.repository.getOwned(identity, 7849, key);
    assert.equal(recovered!.summary.paymentStatus, 'pending');
    assert.equal(recovered!.summary.bookingStatus, 'pending');
    s.db.throttleNextWrite = true; const before = s.db.calls.length;
    await assert.rejects(t.repository.begin(identity, 7849, 'test-submission-0002', draft()), { name: 'ProvisionedThroughputExceededException' });
    assert.equal(s.db.calls.length, before + 1);
  } finally { t.destroy(); }
});
test('transport rejects table substitution before signing or sending', async () => {
  const s = setup(); const t = s.create();
  try {
    await assert.rejects(t.client.get({ TableName: 'wrong-table', Key: { pk: 'test', sk: 'test' }, ConsistentRead: true }), /table mismatch/);
    assert.equal(s.providerCalls(), 0); assert.equal(s.db.calls.length, 0);
  } finally { t.destroy(); }
});
