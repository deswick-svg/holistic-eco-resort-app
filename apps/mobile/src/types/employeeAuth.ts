import type { AccountAuthProvider, AuthResult } from './accountAuth';
export type EmployeeSignInRequest = { email: string; password?: string };
export type EmployeeSignInResult = AuthResult;
export interface EmployeeAuthProvider extends AccountAuthProvider {}
