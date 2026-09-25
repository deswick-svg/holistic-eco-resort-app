import { GuestHistoryAuthError } from '../guestHistory/cognito.ts';
import type { GuestIdentity } from '../guestHistory/model.ts';

const headers = { 'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization' };

export function createAccountDeletionPreparationHandler(dependencies: {
  authenticate: (request: Request) => Promise<GuestIdentity>;
}) {
  return async (request: Request): Promise<Response> => {
    try {
      if (request.method !== 'POST') return Response.json({ error: { code: 'METHOD_NOT_ALLOWED' } }, { status: 405, headers });
      await dependencies.authenticate(request);
      let body: unknown;
      try { body = await request.json(); } catch { return Response.json({ error: { code: 'INVALID_REQUEST' } }, { status: 400, headers }); }
      if (!body || typeof body !== 'object' || Array.isArray(body) ||
          Object.keys(body).length !== 1 || (body as Record<string, unknown>).confirmation !== 'DELETE_MY_ACCOUNT') {
        return Response.json({ error: { code: 'CONFIRMATION_REQUIRED' } }, { status: 400, headers });
      }
      // This endpoint authorizes the destructive mobile operation. It does not
      // delete or mutate booking records and never accepts a client identity.
      return Response.json({ authorized: true }, { status: 200, headers });
    } catch (error) {
      if (error instanceof GuestHistoryAuthError) {
        return Response.json({ error: { code: error.status === 403 ? 'FORBIDDEN' : 'UNAUTHENTICATED' } }, {
          status: error.status === 503 ? 503 : error.status,
          headers: { ...headers, ...(error.status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}) },
        });
      }
      return Response.json({ error: { code: 'DELETION_UNAVAILABLE' } }, { status: 503, headers });
    }
  };
}
