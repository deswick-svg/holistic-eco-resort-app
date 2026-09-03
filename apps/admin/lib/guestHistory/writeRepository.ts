import { createGuestHistoryDynamoTransport, readGuestHistoryDynamoConfig } from './dynamoTransport.ts';
import type { DynamoGuestBookingRepository } from './dynamoRepository.ts';

const REGION = 'eu-north-1';
const TABLE = 'holistic-eco-resort-guest-bookings-dev';
type WriteRepository = Pick<DynamoGuestBookingRepository, 'begin' | 'advance' | 'getOwned'>;

/** Lazy, server-only write facade. Default SDK credential providers are resolved
 * only after every route guard and Cognito authentication succeeds.
 */
export function createGuestHistoryWriteRepository(
  create: (config: { region: string; table: string }) => { repository: WriteRepository } = createGuestHistoryDynamoTransport,
  readConfig = readGuestHistoryDynamoConfig,
): WriteRepository {
  let repository: WriteRepository | undefined;
  const get = () => {
    if (repository) return repository;
    const config = readConfig();
    if (config.region !== REGION || config.table !== TABLE) throw new Error('Guest booking storage configuration is unavailable');
    repository = create(config).repository;
    return repository;
  };
  return {
    begin: (...args) => get().begin(...args),
    advance: (...args) => get().advance(...args),
    getOwned: (...args) => get().getOwned(...args),
  };
}

export const guestHistoryWriteRepository = createGuestHistoryWriteRepository();
