import { authenticateGuest } from '../../../lib/guestHistory/cognito.ts';
import { createMyBookingsHandler } from '../../../lib/guestHistory/handler.ts';
import { guestHistoryReadRepository } from '../../../lib/guestHistory/readRepository.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = createMyBookingsHandler({
  authenticate: authenticateGuest,
  repository: guestHistoryReadRepository,
});
