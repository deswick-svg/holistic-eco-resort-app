import { CognitoJwtVerifier } from 'aws-jwt-verify';
import type { JwksCache } from 'aws-jwt-verify/jwk';
import type { GuestIdentity } from './model.ts';

export class GuestHistoryAuthError extends Error {
  readonly status: 401 | 403 | 503;
  constructor(status: 401 | 403 | 503) { super('Guest history access unavailable'); this.status = status; }
}

export function createGuestVerifier(config: { userPoolId: string; clientId: string }, jwksCache?: JwksCache) {
  return CognitoJwtVerifier.create({ ...config, tokenUse: 'access', customJwtCheck: ({ header }) => {
    if (header.alg !== 'RS256') throw new Error('Unsupported signing algorithm');
  } }, jwksCache ? { jwksCache } : undefined);
}

type GuestVerifier = ReturnType<typeof createGuestVerifier>;
let verifier: GuestVerifier | undefined;

function configuredVerifier(): GuestVerifier {
  if (verifier) return verifier;
  const userPoolId = process.env.GUEST_HISTORY_COGNITO_USER_POOL_ID;
  const clientId = process.env.GUEST_HISTORY_COGNITO_CLIENT_ID;
  if (!userPoolId || !clientId || !/^[a-z0-9]+$/.test(clientId)) {
    throw new GuestHistoryAuthError(503);
  }
  try { verifier = createGuestVerifier({ userPoolId, clientId }); }
  catch { throw new GuestHistoryAuthError(503); }
  return verifier;
}

export async function authenticateGuest(request: Request, testVerifier?: GuestVerifier): Promise<GuestIdentity> {
  const match = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!match || match[1].length > 16384) throw new GuestHistoryAuthError(401);
  const activeVerifier = testVerifier ?? configuredVerifier();
  let claims;
  try { claims = await activeVerifier.verify(match[1]); }
  catch { throw new GuestHistoryAuthError(401); }
  // Signature, issuer, client_id, token_use, expiry and nbf are checked by AWS's verifier.
  if (typeof claims.sub !== 'string' || !claims.sub || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) {
    throw new GuestHistoryAuthError(401);
  }
  const groups = claims['cognito:groups'];
  if (groups !== undefined && (!Array.isArray(groups) || !groups.every(g => typeof g === 'string'))) {
    throw new GuestHistoryAuthError(403);
  }
  // Match mobile policy: no group is required for normal self-registered guests.
  if (groups?.includes('Employees') && !groups.includes('Guests')) throw new GuestHistoryAuthError(403);
  return { issuer: claims.iss, sub: claims.sub };
}
