import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CognitoAuthCore, authError } from '../src/services/cognitoAuthCore.ts';
import { SecureAuthStorage } from '../src/services/secureAuthStorage.ts';

// No production adapters are imported. Any accidental HTTP request fails this suite.
globalThis.fetch = async () => { throw new Error('Live network prohibited in auth tests'); };
const config = { region: 'test-region', cognitoUserPoolId: 'test-region_pool', cognitoClientId: 'test-client', guestGroup: 'Guests', employeeGroup: 'Employees' };
const issuer = `https://cognito-idp.${config.region}.amazonaws.com/${config.cognitoUserPoolId}`;
function tokens(groups = []) {
  const common = { sub: 'mock-user', iss: issuer, exp: Date.now() / 1000 + 3600 };
  return {
    id: { ...common, aud: config.cognitoClientId, token_use: 'id', email_verified: true, email: 'guest@example.com' },
    access: { ...common, client_id: config.cognitoClientId, token_use: 'access', 'cognito:groups': groups },
  };
}
function fixture(overrides = {}) {
  const calls = [];
  const driver = {
    signIn: async (...args) => { calls.push(['signIn', ...args]); return { isSignedIn: true, nextStep: { signInStep: 'DONE' } }; },
    confirmSignIn: async () => ({ isSignedIn: true, nextStep: { signInStep: 'DONE' } }),
    session: async refresh => { calls.push(['session', refresh]); return tokens(); },
    signOut: async () => { calls.push(['signOut']); },
    clear: async () => { calls.push(['clear']); },
    signUp: async (...args) => { calls.push(['signUp', ...args]); },
    confirmEmail: async (...args) => { calls.push(['confirmEmail', ...args]); },
    resend: async () => {}, reset: async () => {}, confirmReset: async () => {},
    ...overrides,
  };
  return { core: new CognitoAuthCore(driver, config), calls };
}
const credentials = { email: ' GUEST@example.com ', password: 'mock-password-never-used-live' };

test('email-only beginSignIn remains compatible and sends no request', async () => {
  const { core, calls } = fixture();
  assert.equal((await core.beginSignIn('guest', { email: 'guest@example.com' })).status, 'interaction_required');
  assert.deepEqual(calls, []);
});
test('verified self-registered guest can sign in without a Guests group; result has no tokens', async () => {
  const { core, calls } = fixture();
  assert.deepEqual(await core.beginSignIn('guest', credentials), { status: 'authenticated', guestId: 'mock-user', email: 'guest@example.com', emailVerified: true });
  assert.deepEqual(calls[2], ['signIn', 'guest@example.com', credentials.password]);
});
test('guest credentials cannot authorize employee access', async () => {
  for (const groups of [[], ['Guests'], ['employees'], ['Other']]) {
    const { core } = fixture({ session: async () => tokens(groups) });
    assert.equal((await core.beginSignIn('employee', credentials)).code, 'unauthorized_employee');
    assert.equal((await core.restoreSession('employee')).code, 'unauthorized_employee');
  }
});

test('My Account uses only the verified session email, including after restore', async () => {
  const data = tokens();
  data.id.email = 'verified-account@example.com';
  data.id.privateClaim = 'must-not-reach-ui';
  const { core } = fixture({ session: async () => data });
  const expected = { status: 'authenticated', guestId: 'mock-user', email: data.id.email, emailVerified: true };
  assert.deepEqual(await core.beginSignIn('guest', credentials), expected);
  assert.deepEqual(await core.restoreSession('guest'), expected);
  assert.equal((await core.signOut()).status, 'signed_out');
});

test('My Account fails closed for missing email, unverified email, or expired session', async () => {
  for (const mutate of [t => { delete t.id.email; }, t => { t.id.email = ''; },
    t => { t.id.email_verified = false; }, t => { t.id.exp = 1; }]) {
    const data = tokens(); mutate(data);
    const { core } = fixture({ session: async () => data });
    const result = await core.restoreSession('guest');
    assert.notEqual(result.status, 'authenticated');
    assert.equal('email' in result, false);
  }
});

test('My Account is gated by guest authorization and uses the existing locked sign-out flow', () => {
  const form = readFileSync(new URL('../src/components/AccountAuthForm.tsx', import.meta.url), 'utf8');
  const screen = readFileSync(new URL('../src/screens/MyAccountScreen.tsx', import.meta.url), 'utf8');
  assert.match(form, /!employee && authorized && guestAccount && renderGuestAccount/);
  assert.match(form, /renderGuestAccount\(guestAccount, \(\) => void perform\(\(\) => provider.signOut\(\)\), busy\)/);
  assert.match(form, /setAuthorized\(false\); setGuestAccount\(null\)/);
  assert.match(screen, /disabled=\{busy\}/);
  assert.match(screen, /\{account.email\}/);
  assert.doesNotMatch(screen, /AsyncStorage|fetch\(|idToken|accessToken|refreshToken/);
});
test('Employees membership is required and guest/staff roles remain distinct', async () => {
  const { core } = fixture({ session: async () => tokens(['Employees']) });
  assert.deepEqual(await core.beginSignIn('employee', credentials), { status: 'authorized', employeeId: 'mock-user' });
  assert.equal((await core.restoreSession('guest')).code, 'employee_account');
  const dual = fixture({ session: async () => tokens(['Employees', 'Guests']) });
  assert.equal((await dual.core.restoreSession('guest')).status, 'authenticated');
});
test('restore forces refresh and removed employee membership locks access', async () => {
  let groups = ['Employees'];
  const refreshed = [];
  const { core } = fixture({ session: async force => { refreshed.push(force); return tokens(groups); } });
  assert.equal((await core.restoreSession('employee')).status, 'authorized');
  groups = [];
  assert.equal((await core.restoreSession('employee')).code, 'unauthorized_employee');
  assert.deepEqual(refreshed, [true, true]);
});
test('wrong pool/client, malformed groups, and expired tokens never authorize', async () => {
  for (const mutate of [
    t => { t.id.iss = 'wrong'; }, t => { t.access.client_id = 'wrong'; },
    t => { t.id.sub = 'other-user'; }, t => { t.access.exp = 1; },
    t => { t.access['cognito:groups'] = 'Employees'; },
  ]) {
    const data = tokens(['Employees']); mutate(data);
    const { core } = fixture({ session: async () => data });
    assert.equal((await core.restoreSession('employee')).status, 'error');
  }
});
test('unverified email is not authorized and has an explicit verification state', async () => {
  const data = tokens(['Employees']); data.id.email_verified = false;
  const { core } = fixture({ session: async () => data });
  assert.equal((await core.restoreSession('employee')).status, 'verification_required');
});
test('confirmed users with unverified email use attribute verification rather than sign-up confirmation', async () => {
  const data = tokens(); data.id.email_verified = false;
  const events = [];
  const { core } = fixture({
    session: async () => data,
    confirmEmail: async () => { throw new Error('Wrong confirmation API'); },
    resendVerifiedEmail: async () => { events.push('send-attribute-code'); },
    confirmVerifiedEmail: async code => { events.push(code); data.id.email_verified = true; },
  });
  assert.equal((await core.restoreSession('guest')).status, 'verification_required');
  await core.resendVerification('guest@example.com');
  assert.equal((await core.confirmEmail('guest@example.com', '123456')).status, 'done');
  assert.deepEqual(events, ['send-attribute-code', '123456']);
  assert.equal((await core.restoreSession('guest')).status, 'authenticated');
});
test('auto-confirmed sign-up still requires a separate sign-in', async () => {
  const { core, calls } = fixture({ signUp: async () => ({ isSignUpComplete: true }) });
  assert.equal((await core.signUp(credentials.email, credentials.password)).status, 'done');
  assert.equal(calls.length, 0);
});
test('registration and confirmation never manufacture an authenticated session or assign groups', async () => {
  const { core, calls } = fixture();
  assert.equal((await core.signUp(credentials.email, credentials.password)).status, 'verification_required');
  assert.deepEqual(calls, [['signUp', 'guest@example.com', credentials.password]]);
  assert.equal((await core.confirmEmail(credentials.email, ' 123456 ')).status, 'done');
  assert.deepEqual(calls[1], ['confirmEmail', 'guest@example.com', '123456']);
  assert.equal((await core.resendVerification(credentials.email)).status, 'verification_required');
  assert.equal((await core.resetPassword(credentials.email)).status, 'done');
  assert.equal((await core.confirmResetPassword(credentials.email, '123456', credentials.password)).status, 'done');
});
test('new password and code challenges require completion with the original role', async () => {
  for (const step of ['CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED', 'CONFIRM_SIGN_IN_WITH_TOTP_CODE']) {
    const { core } = fixture({ signIn: async () => ({ isSignedIn: false, nextStep: { signInStep: step } }) });
    assert.equal((await core.beginSignIn('guest', credentials)).status, 'challenge_required');
    assert.equal((await core.confirmSignIn('employee', 'mock-code')).code, 'session_expired');
    assert.equal((await core.confirmSignIn('guest', 'mock-code')).status, 'authenticated');
  }
});
test('unsupported security challenges fail closed', async () => {
  const { core } = fixture({ signIn: async () => ({ isSignedIn: false, nextStep: { signInStep: 'UNKNOWN_CHALLENGE' } }) });
  assert.equal((await core.beginSignIn('employee', credentials)).code, 'unsupported_challenge');
});
test('duplicate sign-in taps share no extra operation', async () => {
  let release;
  const { core, calls } = fixture({ prepare: () => new Promise(resolve => { release = resolve; }) });
  const first = core.beginSignIn('guest', credentials);
  assert.equal((await core.beginSignIn('guest', credentials)).code, 'busy');
  release(); await first;
  assert.equal(calls.filter(c => c[0] === 'signIn').length, 1);
});
test('sign-out clears local data even when network revocation fails', async () => {
  const { core, calls } = fixture({ signOut: async () => { throw new TypeError('private diagnostic'); } });
  const result = await core.signOut();
  assert.equal(result.status, 'signed_out');
  assert.deepEqual(calls, [['clear']]);
  assert.equal(JSON.stringify(result).includes('private diagnostic'), false);
});
test('expired refresh token clears local session; network failure does not authorize', async () => {
  const expired = Object.assign(new Error('private'), { name: 'NotAuthorizedException' });
  const { core, calls } = fixture({ session: async () => { throw expired; } });
  assert.equal((await core.restoreSession('guest')).code, 'session_expired');
  assert.deepEqual(calls, [['clear']]);
  const offline = fixture({ session: async () => { throw new TypeError('private'); } });
  assert.equal((await offline.core.restoreSession('employee')).code, 'network');
});
test('errors are mapped without displaying raw provider messages', () => {
  for (const [name, expected] of [['NotAuthorizedException', 'invalid_credentials'], ['UserNotFoundException', 'invalid_credentials'], ['ExpiredCodeException', 'invalid_code'], ['NetworkError', 'network']]) {
    const result = authError(Object.assign(new Error('sensitive'), { name }));
    assert.equal(result.code, expected);
    assert.equal(JSON.stringify(result).includes('sensitive'), false);
  }
});
test('missing native support fails before any sign-in or sign-up request', async () => {
  const { core, calls } = fixture({ prepare: async () => { throw Object.assign(new Error(), { name: 'NativeSetupRequired' }); } });
  assert.equal((await core.beginSignIn('guest', credentials)).status, 'not_connected');
  assert.equal((await core.signUp(credentials.email, credentials.password)).status, 'not_connected');
  assert.deepEqual(calls, []);
});

function storageFixture() {
  const data = new Map();
  const port = {
    getItemAsync: async key => data.get(key) ?? null,
    setItemAsync: async (key, value) => { assert.match(key, /^[\w.-]+$/); assert.ok(Buffer.byteLength(value) <= 2048); data.set(key, value); },
    deleteItemAsync: async key => { data.delete(key); },
  };
  return { data, port, storage: new SecureAuthStorage(port) };
}
test('secure storage chunks large tokens, survives restart, handles concurrent writes and clears only auth keys', async () => {
  const { storage, data, port } = storageFixture();
  data.set('unrelated', 'keep');
  await Promise.all([storage.setItem('token@guest+1', 'x'.repeat(6000)), storage.setItem('other', 'value')]);
  const restored = new SecureAuthStorage(port);
  assert.equal(await restored.getItem('token@guest+1'), 'x'.repeat(6000));
  await restored.setItem('token@guest+1', 'short');
  assert.equal(await restored.getItem('token@guest+1'), 'short');
  await restored.removeItem('other');
  assert.equal(await restored.getItem('other'), null);
  await restored.clear();
  assert.deepEqual([...data], [['unrelated', 'keep']]);
});
test('secure storage failures never fall back to plaintext', async () => {
  const storage = new SecureAuthStorage({ getItemAsync: async () => null, setItemAsync: async () => { throw new Error('keychain unavailable'); }, deleteItemAsync: async () => {} });
  await assert.rejects(storage.setItem('token', 'mock-sensitive'));
});
test('missing token chunks fail closed and remain clearable', async () => {
  const { storage, data } = storageFixture();
  await storage.setItem('token', 'x'.repeat(6000));
  const key = [...data.keys()].find(key => key !== 'her.auth.index.0' && key.endsWith('.1'));
  data.delete(key);
  await assert.rejects(storage.getItem('token'));
  await storage.clear();
  assert.equal(data.size, 0);
});
test('production auth boundary uses secure storage after configuration and never exposes tokens', () => {
  const source = readFileSync(new URL('../src/services/cognitoAuth.ts', import.meta.url), 'utf8');
  assert.ok(source.indexOf('setKeyValueStorage(storage)') > source.indexOf('Amplify.configure('));
  assert.match(source, /USER_SRP_AUTH/);
  assert.match(source, /WHEN_UNLOCKED_THIS_DEVICE_ONLY/);
  assert.doesNotMatch(source, /console\.|SECRET_HASH|clientSecret|accessKeyId|AsyncStorage\./);
  const ui = readFileSync(new URL('../src/components/AccountAuthForm.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(ui, /accessToken|refreshToken|idToken|console\./);
  const staff = readFileSync(new URL('../src/services/employeeAuth.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(staff, /signUp:/);
});
