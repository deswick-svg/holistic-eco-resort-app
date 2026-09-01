import type { GuestAuthProvider, GuestSignInRequest, GuestSignInResult } from '../types/guestAuth';

const unavailableMessage =
  'Secure guest account access is not connected yet. No sign-in request has been sent.';

/**
 * Safe default adapter. Replace this implementation with an approved backend or
 * Cognito provider only when account creation, verification and secure session
 * storage have been designed and deployed.
 */
class UnconnectedGuestAuthProvider implements GuestAuthProvider {
  async beginSignIn(_request: GuestSignInRequest): Promise<GuestSignInResult> {
    return { status: 'not_connected', message: unavailableMessage };
  }
}

export const guestAuth: GuestAuthProvider = new UnconnectedGuestAuthProvider();
