import type { EmployeeAuthProvider, EmployeeSignInRequest, EmployeeSignInResult } from '../types/employeeAuth';

const unavailableMessage =
  'Secure employee access is not connected yet. No sign-in request has been sent and no staff access has been granted.';

/**
 * Safe default staff adapter. Keep this separate from guest authentication.
 * Replace only after an approved employee identity provider, authorization
 * model and secure session-storage strategy have been deployed.
 */
class UnconnectedEmployeeAuthProvider implements EmployeeAuthProvider {
  async beginSignIn(_request: EmployeeSignInRequest): Promise<EmployeeSignInResult> {
    return { status: 'not_connected', message: unavailableMessage };
  }
}

export const employeeAuth: EmployeeAuthProvider = new UnconnectedEmployeeAuthProvider();
