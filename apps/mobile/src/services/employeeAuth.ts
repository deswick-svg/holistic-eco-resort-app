import type { EmployeeAuthProvider } from '../types/employeeAuth';
import { cognitoAuth } from './cognitoAuth';

export const employeeAuth: EmployeeAuthProvider = {
  beginSignIn: request => cognitoAuth.beginSignIn('employee', request),
  confirmSignIn: response => cognitoAuth.confirmSignIn('employee', response),
  restoreSession: () => cognitoAuth.restoreSession('employee'),
  signOut: () => cognitoAuth.signOut(),
  confirmEmail: (email, code) => cognitoAuth.confirmEmail(email, code),
  resendVerification: email => cognitoAuth.resendVerification(email),
  resetPassword: email => cognitoAuth.resetPassword(email),
  confirmResetPassword: (email, code, password) => cognitoAuth.confirmResetPassword(email, code, password),
};
