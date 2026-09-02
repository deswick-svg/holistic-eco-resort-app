import type { AuthResult, AuthRole } from '../types/accountAuth';

type Claims = Record<string, unknown>;
export interface AuthDriver {
  prepare?(): Promise<void>;
  signIn(email: string, password: string): Promise<{ isSignedIn: boolean; nextStep: { signInStep: string } }>;
  confirmSignIn(response: string): ReturnType<AuthDriver['signIn']>;
  session(forceRefresh: boolean): Promise<{ id?: Claims; access?: Claims }>;
  signOut(): Promise<void>;
  clear(): Promise<void>;
  signUp(email: string, password: string): Promise<unknown>;
  confirmEmail(email: string, code: string): Promise<unknown>;
  confirmVerifiedEmail?(code: string): Promise<unknown>;
  resendVerifiedEmail?(): Promise<unknown>;
  resend(email: string): Promise<unknown>;
  reset(email: string): Promise<unknown>;
  confirmReset(email: string, code: string, password: string): Promise<unknown>;
}
export interface AuthConfiguration {
  region: string; cognitoUserPoolId: string; cognitoClientId: string;
  guestGroup: string; employeeGroup: string;
}
const error = (code: string, message: string): AuthResult => ({ status: 'error', code, message });
export function authError(cause: unknown): AuthResult {
  const name = cause instanceof Error ? cause.name : '';
  if (name === 'NativeSetupRequired') return { status: 'not_connected', message: 'Secure sign-in requires a rebuilt Android/iOS development app. It is not available in Expo Go.' };
  if (name === 'AuthConfigurationError') return { status: 'not_connected', message: 'Secure account configuration is incomplete. Contact the app administrator.' };
  if (name === 'UserNotConfirmedException') return { status: 'verification_required', message: 'Verify your email before signing in.' };
  if (['NotAuthorizedException', 'UserNotFoundException'].includes(name)) return error('invalid_credentials', 'Email or password is incorrect, or access is no longer valid.');
  if (['CodeMismatchException', 'ExpiredCodeException'].includes(name)) return error('invalid_code', 'The code is invalid or expired. Request a new code and try again.');
  if (name === 'UsernameExistsException') return error('account_exists', 'Unable to register this email. Try signing in or resetting your password.');
  if (name === 'InvalidPasswordException') return error('password_policy', 'The password does not meet the resort account password policy.');
  if (['LimitExceededException', 'TooManyRequestsException'].includes(name)) return error('rate_limited', 'Too many attempts. Wait before trying again.');
  if (['NetworkError', 'TypeError', 'TimeoutError'].includes(name)) return error('network', 'Unable to reach secure sign-in. Check your connection and try again.');
  if (name === 'PasswordResetRequiredException') return error('reset_required', 'Reset your password before signing in.');
  return error('auth_failed', 'Secure account access could not be completed. Try again or contact the resort.');
}

/** One Cognito identity per device; role checks are separate and never grant backend access. */
export class CognitoAuthCore {
  private busy = false;
  private challengeRole: AuthRole | null = null;
  private verifySignedInEmail = false;
  private readonly driver: AuthDriver;
  private readonly config: AuthConfiguration;
  constructor(driver: AuthDriver, config: AuthConfiguration) { this.driver = driver; this.config = config; }

  private async run(operation: () => Promise<AuthResult>): Promise<AuthResult> {
    if (this.busy) return error('busy', 'Another account request is in progress. Please wait.');
    this.busy = true;
    try { await this.driver.prepare?.(); return await operation(); }
    catch (cause) { return authError(cause); }
    finally { this.busy = false; }
  }
  private async authorize(role: AuthRole, forceRefresh: boolean): Promise<AuthResult> {
    const { id, access } = await this.driver.session(forceRefresh);
    if (!id && !access) return { status: 'signed_out' };
    const issuer = `https://cognito-idp.${this.config.region}.amazonaws.com/${this.config.cognitoUserPoolId}`;
    const now = Date.now() / 1000;
    if (!id || !access || typeof id.sub !== 'string' || !id.sub || access.sub !== id.sub ||
        id.iss !== issuer || access.iss !== issuer || id.aud !== this.config.cognitoClientId ||
        access.client_id !== this.config.cognitoClientId || id.token_use !== 'id' || access.token_use !== 'access' ||
        typeof id.exp !== 'number' || id.exp <= now || typeof access.exp !== 'number' || access.exp <= now) {
      await this.driver.clear();
      return error('session_expired', 'Your session has expired. Sign in again.');
    }
    if (id.email_verified !== true) {
      this.verifySignedInEmail = true;
      return { status: 'verification_required', message: 'Verify your email before account access is granted. Request a verification code below.' };
    }
    this.verifySignedInEmail = false;
    const rawGroups = access['cognito:groups'];
    if (rawGroups !== undefined && (!Array.isArray(rawGroups) || !rawGroups.every(g => typeof g === 'string'))) {
      return error('unauthorized', 'Account access could not be verified.');
    }
    const groups: string[] = (rawGroups as string[] | undefined) ?? [];
    if (role === 'employee') {
      if (!groups.includes(this.config.employeeGroup)) return error('unauthorized_employee', 'This account is not authorized for employee access. Contact the resort administrator.');
      return { status: 'authorized', employeeId: id.sub };
    }
    // Self-registered verified users normally have no group. Employee-only accounts use staff login.
    if (groups.includes(this.config.employeeGroup) && !groups.includes(this.config.guestGroup)) return error('employee_account', 'Use Employee Login for this staff account.');
    return { status: 'authenticated', guestId: id.sub };
  }
  private async next(role: AuthRole, result: Awaited<ReturnType<AuthDriver['signIn']>>): Promise<AuthResult> {
    if (result.isSignedIn) { this.challengeRole = null; return this.authorize(role, false); }
    const step = result.nextStep.signInStep;
    if (step === 'CONFIRM_SIGN_UP') return { status: 'verification_required', message: 'Verify your email, then sign in again.' };
    if (step === 'RESET_PASSWORD') return error('reset_required', 'Reset your password before signing in.');
    if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      this.challengeRole = role;
      return { status: 'challenge_required', challenge: 'new_password', message: 'Set a new password to replace your temporary password.' };
    }
    if (['CONFIRM_SIGN_IN_WITH_SMS_CODE', 'CONFIRM_SIGN_IN_WITH_EMAIL_CODE', 'CONFIRM_SIGN_IN_WITH_TOTP_CODE'].includes(step)) {
      this.challengeRole = role;
      return { status: 'challenge_required', challenge: 'code', message: 'Enter the sign-in code from your configured email, SMS, or authenticator.' };
    }
    this.challengeRole = null;
    return error('unsupported_challenge', 'This account needs additional security setup. Contact the administrator; access remains locked.');
  }
  beginSignIn(role: AuthRole, request: { email: string; password?: string }) {
    if (!request.password) return Promise.resolve<AuthResult>({ status: 'interaction_required' });
    return this.run(async () => {
      this.challengeRole = null;
      this.verifySignedInEmail = false;
      await this.driver.signOut(); // Explicit account switch; shared device identity is replaced.
      await this.driver.clear();
      return this.next(role, await this.driver.signIn(request.email.trim().toLowerCase(), request.password!));
    });
  }
  confirmSignIn(role: AuthRole, response: string) {
    return this.run(async () => {
      if (this.challengeRole !== role) return error('session_expired', 'Sign-in has expired. Start again.');
      return this.next(role, await this.driver.confirmSignIn(response));
    });
  }
  restoreSession(role: AuthRole) {
    return this.run(async () => {
      try { return await this.authorize(role, true); }
      catch (cause) {
        const name = cause instanceof Error ? cause.name : '';
        if (['NotAuthorizedException', 'UserUnAuthenticatedException'].includes(name)) {
          await this.driver.clear();
          return error('session_expired', 'Your session has expired. Sign in again.');
        }
        throw cause;
      }
    });
  }
  signOut() {
    return this.run(async () => {
      this.challengeRole = null;
      this.verifySignedInEmail = false;
      let remoteFailed = false;
      try { await this.driver.signOut(); } catch { remoteFailed = true; }
      await this.driver.clear();
      return { status: 'signed_out', message: remoteFailed
        ? 'Signed out on this device. Remote revocation could not be verified.' : 'Signed out on this device.' };
    });
  }
  signUp(email: string, password: string) {
    return this.run(async () => {
      this.verifySignedInEmail = false;
      const result = await this.driver.signUp(email.trim().toLowerCase(), password);
      if (result && typeof result === 'object' && 'isSignUpComplete' in result && result.isSignUpComplete === true) {
        return { status: 'done', message: 'Account registration completed. Sign in to verify account access.' };
      }
      return { status: 'verification_required', message: 'Check your email for a verification code. Verification does not sign you in.' };
    });
  }
  confirmEmail(email: string, code: string) {
    return this.run(async () => {
      if (this.verifySignedInEmail) {
        if (!this.driver.confirmVerifiedEmail) return error('auth_failed', 'Email verification is unavailable. Contact the administrator.');
        await this.driver.confirmVerifiedEmail(code.trim());
        this.verifySignedInEmail = false;
      } else await this.driver.confirmEmail(email.trim().toLowerCase(), code.trim());
      return { status: 'done', message: 'Email verified. Sign in with your password.' };
    });
  }
  resendVerification(email: string) {
    return this.run(async () => {
      if (this.verifySignedInEmail) {
        if (!this.driver.resendVerifiedEmail) return error('auth_failed', 'Email verification is unavailable. Contact the administrator.');
        await this.driver.resendVerifiedEmail();
      } else await this.driver.resend(email.trim().toLowerCase());
      return { status: 'verification_required', message: 'A new verification code has been requested. Check your email.' };
    });
  }
  resetPassword(email: string) {
    return this.run(async () => {
      await this.driver.reset(email.trim().toLowerCase());
      return { status: 'done', message: 'If account recovery is available, check your email for a password reset code.' };
    });
  }
  confirmResetPassword(email: string, code: string, password: string) {
    return this.run(async () => {
      await this.driver.confirmReset(email.trim().toLowerCase(), code.trim(), password);
      return { status: 'done', message: 'Password reset. Sign in with your new password.' };
    });
  }
}
