import type { GuestAuthProvider } from '../types/guestAuth';
import { cognitoAuth } from './cognitoAuth';

export const guestAuth: GuestAuthProvider = {
  beginSignIn: request => cognitoAuth.beginSignIn('guest', request),
  confirmSignIn: response => cognitoAuth.confirmSignIn('guest', response),
  restoreSession: () => cognitoAuth.restoreSession('guest'),
  signOut: () => cognitoAuth.signOut(),
  signUp: request => cognitoAuth.signUp(request.email, request.password),
  confirmEmail: (email, code) => cognitoAuth.confirmEmail(email, code),
  resendVerification: email => cognitoAuth.resendVerification(email),
  resetPassword: email => cognitoAuth.resetPassword(email),
  confirmResetPassword: (email, code, password) => cognitoAuth.confirmResetPassword(email, code, password),
};
