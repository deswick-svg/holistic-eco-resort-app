import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { SimpleJwksCache } from 'aws-jwt-verify/jwk';
import { authenticateGuest, createGuestVerifier } from './cognito.ts';
import { createMyBookingsHandler } from './handler.ts';
import { emptyGuestBookingRepository } from './model.ts';
import type { OwnedBookingRecord } from './model.ts';
import { GET } from '../../app/api/my-bookings/route.ts';
import { createGuestHistoryReadRepository } from './readRepository.ts';
import { readGuestHistoryDynamoConfig } from './dynamoTransport.ts';

// TEST ONLY: ephemeral local signing keys; no Cognito users, tokens or bookings.
globalThis.fetch = async () => { throw new Error('Live network forbidden'); };
const config = { userPoolId: 'eu-north-1_TestOnly', clientId: 'testclient' };
const issuer = `https://cognito-idp.eu-north-1.amazonaws.com/${config.userPoolId}`;
const key = generateKeyPairSync('rsa', { modulusLength: 2048 });
const cache = new SimpleJwksCache({ fetcher: { fetch: async () => { throw new Error('JWKS network forbidden'); } } });
const verifier = createGuestVerifier(config, cache);
verifier.cacheJwks({ keys: [{ ...key.publicKey.export({ format: 'jwk' }), kty: 'RSA', kid: 'local-test', alg: 'RS256', use: 'sig' }] });

function token(sub: string, overrides: Record<string, unknown> = {}, headerOverrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: 'local-test', ...headerOverrides };
  const claims = { iss: issuer, sub, client_id: config.clientId, token_use: 'access', iat: now, exp: now + 300, ...overrides };
  const input = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`;
  return `${input}.${sign('RSA-SHA256', Buffer.from(input), key.privateKey).toString('base64url')}`;
}
function request(jwt = token('test-guest-a'), query = '') {
  return new Request(`http://localhost/api/my-bookings${query}`, { headers: { Authorization: `Bearer ${jwt}` } });
}

// Fictional upcoming/past examples live ONLY in this test module.
function record(sub: string, stayState: 'upcoming' | 'past'): OwnedBookingRecord {
  return { owner: { issuer, sub }, propertyId: 7849, provenance: 'test_fixture',
    summary: { referenceId: `TEST-ONLY-${sub}-${stayState}`, guestName: 'Fictional Test Guest', roomType: 'Test Room',
      checkInDate: stayState === 'upcoming' ? '2099-01-01' : '2000-01-01',
      checkOutDate: stayState === 'upcoming' ? '2099-01-03' : '2000-01-03',
      adults: 2, children: 0, bookingStatus: stayState === 'upcoming' ? 'confirmed' : 'checked_out',
      paymentStatus: 'unknown', stayState, total: { amount: '100.00', currency: 'INR' } } };
}
const records = [record('test-guest-a', 'upcoming'), record('test-guest-a', 'past'), record('test-guest-b', 'past')];
const authenticate = (req: Request) => authenticateGuest(req, verifier);
const handler = createMyBookingsHandler({ authenticate, repository: {
  // Deliberately overbroad repository proves the handler's defense-in-depth filtering.
  async listOwned() { return [...records, { ...record('test-guest-a', 'past'), propertyId: 99 },
    { ...record('test-guest-a', 'past'), owner: { issuer: 'wrong-pool', sub: 'test-guest-a' } }]; },
} });

test('signed tokens return only own upcoming/past stays; owner/internal fields never leak', async () => {
  for (const [sub, expected] of [['test-guest-a', 2], ['test-guest-b', 1], ['test-guest-c', 0]] as const) {
    const response = await handler(request(token(sub)));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control')!, /private, no-store/);
    assert.equal(response.headers.get('vary'), 'Authorization');
    assert.deepEqual(await response.json(), { bookings: records.filter(r => r.owner.sub === sub).map(r => r.summary) });
    assert.equal(records.filter(r => r.owner.sub === sub).length, expected);
  }
});

test('client user/email/reference/property overrides cannot select another owner', async () => {
  for (const query of ['?sub=test-guest-b', '?email=other@example.com', '?referenceId=other', '?propertyId=99']) {
    assert.equal((await handler(request(token('test-guest-a'), query))).status, 400);
  }
  const req = request();
  req.headers.set('x-user-id', 'test-guest-b');
  const body = await (await handler(req)).json();
  assert.deepEqual(body.bookings, records.slice(0, 2).map(r => r.summary));
});

test('React Native no-store cache-buster permits authenticated empty response only', async () => {
  const empty = createMyBookingsHandler({ authenticate, repository: emptyGuestBookingRepository });
  const response = await empty(request(token('test-guest-a'), '?_=1788412345678'));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { bookings: [] });
  assert.match(response.headers.get('cache-control')!, /private, no-store/);
  for (const query of ['?_=123&sub=test-guest-b', '?_=123&_=456', '?_=abc', '?email=other@example.com', '?_=']) {
    assert.equal((await empty(request(token('test-guest-a'), query))).status, 400);
  }
  assert.equal((await empty(new Request('http://localhost/api/my-bookings?_=123'))).status, 401);
});

test('missing, forged, expired, wrong issuer/client/type and unsigned tokens fail before repository access', async () => {
  let reads = 0;
  const guarded = createMyBookingsHandler({ authenticate, repository: { async listOwned() { reads++; return records; } } });
  const now = Math.floor(Date.now() / 1000);
  const valid = token('test-guest-a');
  const forged = valid.split('.');
  forged[1] = Buffer.from(JSON.stringify({ sub: 'test-guest-b' })).toString('base64url');
  const badTokens = ['bad', forged.join('.'), token('a', { exp: now - 60 }), token('a', { client_id: 'wrong' }),
    token('a', { iss: 'https://wrong.example' }), token('a', { token_use: 'id', aud: config.clientId }),
    token('a', { nbf: now + 600 }), token('', {}), token('a', {}, { alg: 'none' }), token('a', {}, { kid: 'unknown' })];
  for (const jwt of badTokens) assert.equal((await guarded(request(jwt))).status, 401);
  const missing = await guarded(new Request('http://localhost/api/my-bookings'));
  assert.equal(missing.status, 401);
  assert.equal(reads, 0);
});

test('employee-only and malformed groups are denied; verified signature with guest/no group works', async () => {
  for (const groups of [['Employees'], 'Guests']) {
    assert.equal((await handler(request(token('test-guest-a', { 'cognito:groups': groups })))).status, 403);
  }
  assert.equal((await handler(request(token('test-guest-a', { 'cognito:groups': ['Guests'] })))).status, 200);
});

test('repository gets server-derived identity/property and failures reveal no details', async () => {
  const failing = createMyBookingsHandler({ authenticate, repository: { async listOwned(identity, property) {
    assert.deepEqual(identity, { issuer, sub: 'test-guest-a' });
    assert.equal(property, 7849);
    throw new Error('private database info');
  } } });
  const response = await failing(request());
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: { code: 'HISTORY_UNAVAILABLE' } });
});

test('production route uses read facade with no mock, Simplotel or authentication bypass', async () => {
  const empty = createMyBookingsHandler({ authenticate, repository: emptyGuestBookingRepository });
  assert.deepEqual(await (await empty(request())).json(), { bookings: [] });
  assert.equal((await GET(new Request('http://localhost/api/my-bookings'))).status, 401);
  const oldPool = process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID;
  const oldClient = process.env.GUEST_HISTORY_COGNITO_CLIENT_ID;
  try {
    delete process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID;
    delete process.env.GUEST_HISTORY_COGNITO_CLIENT_ID;
    assert.equal((await GET(request())).status, 503);
  } finally {
    if (oldPool === undefined) delete process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID; else process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID = oldPool;
    if (oldClient === undefined) delete process.env.GUEST_HISTORY_COGNITO_CLIENT_ID; else process.env.GUEST_HISTORY_COGNITO_CLIENT_ID = oldClient;
  }
  const source = readFileSync(new URL('../../app/api/my-bookings/route.ts', import.meta.url), 'utf8');
  assert.match(source, /authenticate: authenticateGuest/);
  assert.match(source, /repository: guestHistoryReadRepository/);
  assert.doesNotMatch(source, /fixture|testVerifier|simplotel/i);
});

test('read facade is lazy, authenticates before configuration, and returns private empty history', async () => {
  let configured = 0;
  let queries = 0;
  const repository = createGuestHistoryReadRepository(() => {
    configured++;
    return readGuestHistoryDynamoConfig({ AWS_REGION: 'eu-north-1', GUEST_HISTORY_DYNAMODB_TABLE: 'holistic-eco-resort-guest-bookings-dev' });
  }, config => {
    assert.deepEqual(config, { region: 'eu-north-1', table: 'holistic-eco-resort-guest-bookings-dev' });
    return { repository: { async listOwned(identity, property) {
      queries++;
      assert.deepEqual(identity, { issuer, sub: 'test-guest-a' });
      assert.equal(property, 7849);
      return [];
    } } };
  });
  assert.deepEqual(Object.keys(repository), ['listOwned']);
  const read = createMyBookingsHandler({ authenticate, repository });
  assert.equal(configured, 0);
  assert.equal((await read(new Request('http://localhost/api/my-bookings'))).status, 401);
  assert.equal((await read(request('bad'))).status, 401);
  assert.equal(configured, 0);
  for (let i = 0; i < 2; i++) {
    const response = await read(request());
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { bookings: [] });
    assert.match(response.headers.get('cache-control')!, /private, no-store/);
    assert.equal(response.headers.get('vary'), 'Authorization');
  }
  assert.equal(configured, 1);
  assert.equal(queries, 2);
});

test('read facade missing/invalid server configuration fails closed without creating a client', async () => {
  for (const env of [{}, { AWS_REGION: 'eu-north-1' }, { AWS_REGION: 'invalid', GUEST_HISTORY_DYNAMODB_TABLE: 'table' }]) {
    const repository = createGuestHistoryReadRepository(() => readGuestHistoryDynamoConfig(env), () => {
      assert.fail('must not construct transport');
    });
    const response = await createMyBookingsHandler({ authenticate, repository })(request());
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), { error: { code: 'HISTORY_UNAVAILABLE' } });
  }
});
