import { createAccountDeletionPreparationHandler } from '../../../../lib/accountDeletion/handler.ts';
import { authenticateGuest } from '../../../../lib/guestHistory/cognito.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = createAccountDeletionPreparationHandler({ authenticate: authenticateGuest });
