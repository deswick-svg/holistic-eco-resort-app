import type { AccountAuthProvider, AuthResult } from './accountAuth';
export type GuestSignInRequest = { email: string; password?: string };
export type GuestSignInResult = AuthResult;
export interface GuestAuthProvider extends AccountAuthProvider {
  signUp(request: { email: string; password: string }): Promise<AuthResult>;
}
