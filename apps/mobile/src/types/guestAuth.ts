export type GuestSignInRequest = {
  email: string;
};

export type GuestSignInResult =
  | { status: 'interaction_required' }
  | { status: 'authenticated'; guestId: string }
  | { status: 'not_connected'; message: string };

export interface GuestAuthProvider {
  beginSignIn(request: GuestSignInRequest): Promise<GuestSignInResult>;
}
