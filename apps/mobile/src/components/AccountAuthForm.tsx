import React, { useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { AccountAuthProvider, AuthResult } from '../types/accountAuth';
import type { GuestAuthProvider } from '../types/guestAuth';
import { colors } from '../theme/colors';

type Mode = 'signin' | 'signup' | 'verify' | 'code' | 'new_password' | 'forgot' | 'reset';
export function AccountAuthForm({ provider, employee = false }: { provider: AccountAuthProvider; employee?: boolean }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [authorized, setAuthorized] = useState(false);
  const [busy, setBusy] = useState(true);
  const lock = useRef(false);
  const mounted = useRef(true);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const apply = (result: AuthResult) => {
    const allowed = employee ? result.status === 'authorized' : result.status === 'authenticated';
    setAuthorized(allowed);
    setMessage('message' in result ? result.message ?? '' : allowed ? 'Secure sign-in completed.' : '');
    if (result.status === 'verification_required') setMode('verify');
    if (result.status === 'challenge_required') setMode(result.challenge === 'code' ? 'code' : 'new_password');
    if (allowed || result.status === 'signed_out') { setMode('signin'); setPassword(''); setCode(''); }
  };

  useEffect(() => {
    mounted.current = true;
    const restore = async () => {
      if (lock.current || modeRef.current !== 'signin') return;
      lock.current = true;
      setBusy(true);
      try {
        const result = await provider.restoreSession();
        if (mounted.current) apply(result);
      } catch {
        if (mounted.current) { setAuthorized(false); setMessage('Secure session could not be restored. Please sign in again.'); }
      } finally {
        lock.current = false;
        if (mounted.current) setBusy(false);
      }
    };
    void restore();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void restore();
      else { setPassword(''); setCode(''); setAuthorized(false); }
    });
    const timer = setInterval(() => { if (AppState.currentState === 'active') void restore(); }, 60_000);
    return () => { mounted.current = false; subscription.remove(); clearInterval(timer); };
    // Provider instances are stable; apply only depends on the fixed employee role.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, employee]);

  const changeMode = (next: Mode) => { setMode(next); setMessage(''); setPassword(''); setCode(''); };
  const perform = async (operation: () => Promise<AuthResult>, onDone?: () => void) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await operation();
      if (mounted.current) {
        apply(result);
        if (result.status === 'done') onDone?.();
      }
    } catch { if (mounted.current) { setAuthorized(false); setMessage('Secure access could not be completed. Please try again.'); } }
    finally {
      lock.current = false;
      if (mounted.current) { setPassword(''); setCode(''); setBusy(false); }
    }
  };
  const submit = () => {
    const normalized = email.trim().toLowerCase();
    if (!['code', 'new_password'].includes(mode) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setMessage('Enter a valid email address.'); return;
    }
    if (['signin', 'signup', 'new_password', 'reset'].includes(mode) && !password) { setMessage('Enter your password.'); return; }
    if (['verify', 'code', 'reset'].includes(mode) && !code.trim()) { setMessage('Enter the verification code.'); return; }
    if (mode === 'signin') void perform(() => provider.beginSignIn({ email: normalized, password }));
    if (mode === 'signup' && !employee && 'signUp' in provider) void perform(() => (provider as GuestAuthProvider).signUp({ email: normalized, password }), () => setMode('signin'));
    if (mode === 'verify') void perform(() => provider.confirmEmail(normalized, code), () => setMode('signin'));
    if (mode === 'code' || mode === 'new_password') void perform(() => provider.confirmSignIn(mode === 'code' ? code : password));
    if (mode === 'forgot') void perform(() => provider.resetPassword(normalized), () => setMode('reset'));
    if (mode === 'reset') void perform(() => provider.confirmResetPassword(normalized, code, password), () => setMode('signin'));
  };
  const titles: Record<Mode, string> = { signin: employee ? 'Sign in with work email' : 'Sign in with email', signup: 'Create a guest account', verify: 'Verify your email', code: 'Security verification', new_password: 'Choose a new password', forgot: 'Reset your password', reset: 'Enter your reset code' };
  const button = (label: string, onPress: () => void, primary = false) => (
    <Pressable accessibilityRole="button" disabled={busy} onPress={onPress} style={[primary ? styles.button : styles.link, busy && styles.disabled]}>
      <Text style={primary ? styles.buttonText : styles.linkText}>{label}</Text>
    </Pressable>
  );
  return <View>
    <Text style={styles.title}>{authorized ? (employee ? 'Employee identity verified' : 'You are signed in') : titles[mode]}</Text>
    <Text style={styles.intro}>{authorized ? 'Personal stay data and operational functions are not connected yet.' : 'Access is secured by Amazon Cognito. Passwords and verification codes are not saved on this device.'}</Text>
    {!authorized && <>
      {!['code', 'new_password'].includes(mode) && <>
        <Text style={styles.label}>{employee ? 'EMPLOYEE EMAIL' : 'EMAIL ADDRESS'}</Text>
        <TextInput accessibilityLabel={employee ? 'Employee email' : 'Email address'} value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" placeholder="you@example.com" placeholderTextColor={colors.muted} style={styles.input} />
      </>}
      {['verify', 'code', 'reset'].includes(mode) && <>
        <Text style={styles.label}>VERIFICATION CODE</Text>
        <TextInput accessibilityLabel="Verification code" value={code} onChangeText={setCode} editable={!busy} autoCapitalize="none" autoCorrect={false} textContentType="oneTimeCode" style={styles.input} />
      </>}
      {['signin', 'signup', 'new_password', 'reset'].includes(mode) && <>
        <Text style={styles.label}>{mode === 'signin' ? 'PASSWORD' : 'NEW PASSWORD'}</Text>
        <TextInput accessibilityLabel={mode === 'signin' ? 'Password' : 'New password'} value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoCorrect={false} textContentType={mode === 'signin' ? 'password' : 'newPassword'} onSubmitEditing={submit} style={styles.input} />
      </>}
      {button(busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Continue', submit, true)}
      {mode === 'signin' && <>
        {!employee && button('Create a guest account', () => changeMode('signup'))}
        {button('Forgot password?', () => changeMode('forgot'))}
        {button('Verify an existing account', () => changeMode('verify'))}
      </>}
      {mode === 'verify' && button('Resend verification code', () => {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMessage('Enter a valid email address.'); return; }
        void perform(() => provider.resendVerification(email));
      })}
      {mode !== 'signin' && button('Back to sign in', () => changeMode('signin'))}
    </>}
    {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    {button('Sign out / clear this device session', () => void perform(() => provider.signOut()), authorized)}
    <Text style={styles.note}>One account at a time on this device. Signing in replaces the previous account. Booking history remains unavailable until secure ownership checks are connected.</Text>
  </View>;
}
const styles = StyleSheet.create({
  title: { marginTop: 7, color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  intro: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  label: { marginTop: 20, marginBottom: 7, color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  input: { minHeight: 54, paddingHorizontal: 14, borderRadius: 14, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line, color: colors.ink, fontSize: 15 },
  button: { marginTop: 15, minHeight: 52, padding: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  link: { minHeight: 44, justifyContent: 'center', paddingVertical: 8 },
  linkText: { color: colors.forest, fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.6 },
  message: { marginTop: 14, padding: 13, borderRadius: 14, backgroundColor: colors.sage, color: colors.forest, fontSize: 13, lineHeight: 20 },
  note: { marginTop: 12, color: colors.muted, fontSize: 11, lineHeight: 17 },
});
