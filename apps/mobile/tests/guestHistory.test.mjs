import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createGuestHistoryClient } from '../src/services/guestHistoryCore.ts';
globalThis.fetch = async () => { throw new Error('Live requests forbidden'); };
const session = async () => ({ token: 'test-only-token', sub: 'test-a' });
const run = (overrides = {}) => createGuestHistoryClient({ baseUrl: 'https://test.invalid', allowLocalHttp: false, session,
  fetcher: async () => Response.json({ bookings: [] }), ...overrides })(new AbortController().signal);
test('empty result uses bearer header only and disables redirects/caching', async () => {
  assert.equal(await run({ fetcher: async (url, options) => {
    assert.equal(url, 'https://test.invalid/api/my-bookings');
    assert.equal(options.headers.Authorization, 'Bearer test-only-token');
    assert.equal(options.redirect, 'error');
    assert.equal(options.cache, 'no-store');
    return Response.json({ bookings: [] });
  } }), 'empty');
});
test('error, nonempty and malformed responses never become empty', async () => {
  for (const [status, expected] of [[401, 'signed_out'], [403, 'forbidden'], [503, 'unavailable']]) {
    assert.equal(await run({ fetcher: async () => new Response('', { status }) }), expected);
  }
  for (const body of [{}, null, { bookings: [{}] }, { bookings: 'invalid' }]) {
    assert.equal(await run({ fetcher: async () => Response.json(body) }), 'unavailable');
  }
  assert.equal(await run({ fetcher: async () => { throw new Error('network'); } }), 'unavailable');
});
test('no session, cancellation and unsafe URLs send no request', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return Response.json({ bookings: [] }); };
  assert.equal(await run({ session: async () => null, fetcher }), 'signed_out');
  for (const baseUrl of ['', 'http://example.com', 'https://user:password@example.com', 'https://example.com?token=bad']) {
    assert.equal(await run({ baseUrl, fetcher }), 'unavailable');
  }
  const controller = new AbortController(); controller.abort();
  await createGuestHistoryClient({ baseUrl: 'https://test.invalid', allowLocalHttp: false, session, fetcher })(controller.signal);
  assert.equal(calls, 0);
});
test('account switch and sign-out discard pending history; timeout does not retry', async () => {
  let n = 0;
  assert.equal(await run({ session: async () => ({ token: 'test', sub: ++n === 1 ? 'a' : 'b' }) }), 'signed_out');
  let calls = 0;
  assert.equal(await run({ timeoutMs: 10, fetcher: async () => { calls++; return new Promise(() => {}); } }), 'unavailable');
  assert.equal(calls, 1);
});
test('UI is empty-state only and discards results on unmount', () => {
  const source = readFileSync(new URL('../src/components/MyStaysSection.tsx', import.meta.url), 'utf8');
  assert.match(source, /if \(!controller.signal.aborted\) setState/);
  assert.match(source, /return \(\) => controller.abort\(\)/);
  assert.match(source, /No app-linked bookings yet/);
  assert.doesNotMatch(source, /AsyncStorage|console\.|booking_id|TEST-ONLY/);
});
