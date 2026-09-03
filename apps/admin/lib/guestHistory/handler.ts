import { GuestHistoryAuthError } from './cognito.ts';
import type { BookingSummary, GuestBookingRepository, GuestIdentity } from './model.ts';

const propertyId = 7849;
function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'private, no-store, max-age=0',
    Vary: 'Authorization',
    ...(status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}),
  } });
}

export function createMyBookingsHandler(dependencies: {
  authenticate: (request: Request) => Promise<GuestIdentity>;
  repository: GuestBookingRepository;
}) {
  return async (request: Request): Promise<Response> => {
    try {
      const identity = await dependencies.authenticate(request);
      // React Native's fetch adds a numeric `_` cache-buster for cache: 'no-store'.
      // Permit only that transport parameter, never identity/booking selectors.
      if (request.method !== 'GET') return json({ error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
      const query = [...new URL(request.url).searchParams.entries()];
      if (query.length && !(query.length === 1 && query[0][0] === '_' && /^\d{1,20}$/.test(query[0][1]))) {
        return json({ error: { code: 'UNSUPPORTED_QUERY' } }, 400);
      }
      const records = await dependencies.repository.listOwned(identity, propertyId);
      const bookings: BookingSummary[] = records
        .filter(record => record.owner.issuer === identity.issuer && record.owner.sub === identity.sub && record.propertyId === propertyId)
        // Durable attempts are private workflow state until provider identifiers
        // exist. Legacy/trusted projected records have no processingState.
        .filter(record => !('processingState' in record) || record.processingState === 'invoice_created')
        .map(({ summary }) => ({
          referenceId: summary.referenceId, guestName: summary.guestName, roomType: summary.roomType,
          checkInDate: summary.checkInDate, checkOutDate: summary.checkOutDate,
          adults: summary.adults, children: summary.children,
          bookingStatus: summary.bookingStatus, paymentStatus: summary.paymentStatus, stayState: summary.stayState,
          ...(summary.total ? { total: { amount: summary.total.amount, currency: summary.total.currency } } : {}),
        }));
      return json({ bookings });
    } catch (error) {
      if (error instanceof GuestHistoryAuthError) {
        return json({ error: { code: error.status === 401 ? 'UNAUTHENTICATED' : error.status === 403 ? 'FORBIDDEN' : 'HISTORY_UNAVAILABLE' } }, error.status);
      }
      // Never log tokens, request data, identities, records or arbitrary provider errors.
      return json({ error: { code: 'HISTORY_UNAVAILABLE' } }, 503);
    }
  };
}
