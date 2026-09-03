import { createGuestHistoryDynamoTransport, readGuestHistoryDynamoConfig } from './dynamoTransport.ts';
import type { GuestHistoryDynamoConfig } from './dynamoTransport.ts';
import type { GuestBookingRepository } from './model.ts';

/** Server-only, lazy read facade. Authentication happens in the handler before
 * configuration/credential resolution or any query. Never expose write methods.
 * Configuration is fixed for the process; restart after changing it.
 */
export function createGuestHistoryReadRepository(
  readConfig: () => GuestHistoryDynamoConfig = readGuestHistoryDynamoConfig,
  createTransport: (config: GuestHistoryDynamoConfig) => { repository: GuestBookingRepository } = createGuestHistoryDynamoTransport,
): GuestBookingRepository {
  let repository: GuestBookingRepository | undefined;
  return {
    async listOwned(identity, propertyId) {
      repository ??= createTransport(readConfig()).repository;
      return repository.listOwned(identity, propertyId);
    },
  };
}

export const guestHistoryReadRepository = createGuestHistoryReadRepository();
