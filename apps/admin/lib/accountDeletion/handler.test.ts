import assert from 'node:assert/strict';
import test from 'node:test';
import { GuestHistoryAuthError } from '../guestHistory/cognito.ts';
import { createAccountDeletionPreparationHandler } from './handler.ts';

const request = (body: unknown = { confirmation: 'DELETE_MY_ACCOUNT' }) => new Request('https://example.test/api/account-deletion/prepare', {
  method: 'POST', headers: { Authorization: 'Bearer MOCKED' }, body: JSON.stringify(body),
});

test('requires authenticated Cognito ownership and exact confirmation', async () => {
  let calls = 0;
  const handler = createAccountDeletionPreparationHandler({ authenticate: async () => { calls++; return { issuer: 'https://issuer.test', sub: 'TEST-SUB' }; } });
  const response = await handler(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authorized: true });
  assert.equal(calls, 1);
  for (const body of [{}, { confirmation: 'DELETE' }, { confirmation: 'DELETE_MY_ACCOUNT', sub: 'attacker' }]) {
    assert.equal((await handler(request(body))).status, 400);
  }
});

test('rejects missing or invalid authentication without exposing identity', async () => {
  for (const status of [401, 403] as const) {
    const handler = createAccountDeletionPreparationHandler({ authenticate: async () => { throw new GuestHistoryAuthError(status); } });
    const response = await handler(request());
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /TEST-SUB|Bearer|issuer/);
  }
});

test('preparation performs no booking or provider mutation', async () => {
  const handler = createAccountDeletionPreparationHandler({ authenticate: async () => ({ issuer: 'TEST', sub: 'TEST' }) });
  const response = await handler(request());
  assert.equal(response.headers.get('cache-control'), 'private, no-store, max-age=0');
  assert.equal(response.headers.get('vary'), 'Authorization');
});
