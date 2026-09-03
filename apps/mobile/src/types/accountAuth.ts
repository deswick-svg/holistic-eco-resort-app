export type AuthRole = 'guest' | 'employee';
export type AuthResult =
  | { status: 'interaction_required' }
  | { status: 'authenticated'; guestId: string; email: string; emailVerified: true }
  | { status: 'authorized'; employeeId: string }
  | { status: 'verification_required'; message: string }
  | { status: 'challenge_required'; challenge: 'code' | 'new_password'; message: string }
  | { status: 'signed_out'; message?: string }
  | { status: 'done'; message: string }
  | { status: 'not_connected'; message: string }
  | { status: 'error'; code: string; message: string };

export interface AccountAuthProvider {
  beginSignIn(request: { email: string; password?: string }): Promise<AuthResult>;
  confirmSignIn(response: string): Promise<AuthResult>;
  restoreSession(): Promise<AuthResult>;
  signOut(): Promise<AuthResult>;
  confirmEmail(email: string, code: string): Promise<AuthResult>;
  resendVerification(email: string): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  confirmResetPassword(email: string, code: string, password: string): Promise<AuthResult>;
}
