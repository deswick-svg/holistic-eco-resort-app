import { authenticateGuest } from '../../../lib/guestHistory/cognito.ts';
import { createMyBookingsHandler } from '../../../lib/guestHistory/handler.ts';
import { emptyGuestBookingRepository } from '../../../lib/guestHistory/model.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = createMyBookingsHandler({
  authenticate: authenticateGuest,
  repository: emptyGuestBookingRepository,
});
