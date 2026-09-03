import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoGuestBookingRepository } from './dynamoRepository.ts';
import type { BookingDocumentClient } from './dynamoRepository.ts';

export type GuestHistoryDynamoConfig = { region: string; table: string };
type Provider = () => Promise<{ accessKeyId: string; secretAccessKey: string; sessionToken?: string; expiration?: Date }>;
type TransportOptions = {
  credentials?: Provider;
  /** Tests inject an in-process HTTP handler; never read this from environment or requests. */
  requestHandler?: DynamoDBClientConfig['requestHandler'];
};
export function readGuestHistoryDynamoConfig(env: {
  AWS_REGION?: string; GUEST_HISTORY_DYNAMODB_TABLE?: string;
} = { AWS_REGION: process.env.AWS_REGION, GUEST_HISTORY_DYNAMODB_TABLE: process.env.GUEST_HISTORY_DYNAMODB_TABLE }): GuestHistoryDynamoConfig {
  const region = env.AWS_REGION;
  const table = env.GUEST_HISTORY_DYNAMODB_TABLE;
  if (!region || !/^[a-z]{2}(?:-[a-z]+)+-\d+$/.test(region) || !table || !/^[A-Za-z0-9_.-]{3,255}$/.test(table)) {
    throw new Error('Guest history DynamoDB configuration is missing or invalid');
  }
  return { region, table };
}

/** Explicit factory only: importing this module performs no AWS operations.
 * Default SDK credentials are resolved lazily through its provider chain (future
 * execution role). No credentials, table activation or endpoint comes from mobile.
 */
export function createGuestHistoryDynamoTransport(config: GuestHistoryDynamoConfig, options: TransportOptions = {}) {
  const validated = readGuestHistoryDynamoConfig({ AWS_REGION: config.region, GUEST_HISTORY_DYNAMODB_TABLE: config.table });
  const raw = new DynamoDBClient({ region: validated.region,
    maxAttempts: 1, // Preserve uncertain outcomes: no SDK retry after a lost response.
    ignoreConfiguredEndpointUrls: true,
    ...(options.credentials ? { credentials: options.credentials } : {}),
    ...(options.requestHandler ? { requestHandler: options.requestHandler } : {}),
  });
  const document = DynamoDBDocumentClient.from(raw, {
    marshallOptions: { removeUndefinedValues: false, convertEmptyValues: false, convertClassInstanceToMap: false },
    unmarshallOptions: { wrapNumbers: false },
  });
  const requireTable = (table: string) => {
    if (table !== validated.table) throw new Error('Guest history table mismatch');
  };
  const client: BookingDocumentClient = {
    async get(input) {
      requireTable(input.TableName);
      const result = await document.send(new GetCommand(input));
      // Repository validates the full record/ownership before exposing any data.
      return { Item: result.Item as Awaited<ReturnType<BookingDocumentClient['get']>>['Item'] };
    },
    async query(input) {
      requireTable(input.TableName);
      const result = await document.send(new QueryCommand(input));
      return {
        Items: result.Items as Awaited<ReturnType<BookingDocumentClient['query']>>['Items'],
        // DynamoDB can signal completion with an absent OR empty cursor.
        ...(result.LastEvaluatedKey && Object.keys(result.LastEvaluatedKey).length ? {
          LastEvaluatedKey: result.LastEvaluatedKey as { pk: string; sk: string },
        } : {}),
      };
    },
    async transactWrite(input) {
      input.TransactItems.forEach(({ Put }) => requireTable(Put.TableName));
      // Preserve atomicity, condition expressions and SDK CancellationReasons.
      return document.send(new TransactWriteCommand(input));
    },
  };
  return { client, repository: new DynamoGuestBookingRepository(client, validated.table), destroy: () => raw.destroy() };
}
