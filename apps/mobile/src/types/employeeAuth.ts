export type EmployeeSignInRequest = {
  email: string;
};

export type EmployeeSignInResult =
  | { status: 'interaction_required' }
  | { status: 'authorized'; employeeId: string }
  | { status: 'not_connected'; message: string };

export interface EmployeeAuthProvider {
  beginSignIn(request: EmployeeSignInRequest): Promise<EmployeeSignInResult>;
}
