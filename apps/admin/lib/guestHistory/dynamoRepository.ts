import { createHash, randomUUID } from 'node:crypto';
import type { GuestBookingRepository, GuestIdentity } from './model.ts';
import { assertDraft, assertRecord, validIdentity, validIdentifiers, validProperty, validSubmission } from './persistentModel.ts';
import type { BookingDraft, PersistentBookingRecord, ProcessingState } from './persistentModel.ts';

type Key = { pk: string; sk: string };
type Item = Key & { record?: PersistentBookingRecord; target?: string };
export type ConditionalPut = {
  TableName: string; Item: Item; ConditionExpression: string;
  ExpressionAttributeNames?: Record<string, string>;
  ExpressionAttributeValues?: Record<string, unknown>;
};
/** DocumentClient-shaped port. A future wrapper may use Get/Query/TransactWriteCommand.
 * No SDK, credentials, default client, environment switch or network transport here.
 * transactWrite MUST be atomic; get/query MUST honour ConsistentRead.
 */
export interface BookingDocumentClient {
  get(input: { TableName: string; Key: Key; ConsistentRead: true }): Promise<{ Item?: Item }>;
  query(input: {
    TableName: string; KeyConditionExpression: string;
    ExpressionAttributeNames: Record<string, string>; ExpressionAttributeValues: Record<string, string>;
    ConsistentRead: true; Limit: number; ExclusiveStartKey?: Key;
  }): Promise<{ Items?: Item[]; LastEvaluatedKey?: Key }>;
  transactWrite(input: { TransactItems: { Put: ConditionalPut }[] }): Promise<unknown>;
}
export class BookingStorageConflict extends Error {
  constructor() { super('Booking submission or version conflict'); }
}
function digest(value: unknown): string {
  // Stable object ordering; array order remains meaningful.
  const canonical = (v: unknown): unknown => Array.isArray(v) ? v.map(canonical) :
    v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)).map(([k, x]) => [k, canonical(x)])) : v;
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}
function scope(identity: GuestIdentity, propertyId: number): string {
  if (!validIdentity(identity) || !validProperty(propertyId)) throw new Error('Invalid ownership scope');
  return `OWNER#${digest([identity.issuer, identity.sub, propertyId])}`;
}
function keyFor(identity: GuestIdentity, propertyId: number, submissionKey: string): Key {
  if (!validSubmission(submissionKey)) throw new Error('Invalid submission key');
  return { pk: scope(identity, propertyId), sk: `SUBMISSION#${submissionKey}` };
}
function conditionalFailure(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { name?: string; CancellationReasons?: { Code?: string }[] };
  return e.name === 'ConditionalCheckFailedException' ||
    (e.name === 'TransactionCanceledException' && !!e.CancellationReasons?.some(r => r.Code === 'ConditionalCheckFailed'));
}

export class DynamoGuestBookingRepository implements GuestBookingRepository {
  private readonly client: BookingDocumentClient;
  private readonly table: string;
  private readonly now: () => string;
  constructor(client: BookingDocumentClient, table: string, now = () => new Date().toISOString()) {
    if (!/^[A-Za-z0-9_.-]{3,255}$/.test(table)) throw new Error('Invalid table name');
    this.client = client; this.table = table; this.now = now;
  }

  private readItem(item: Item, identity: GuestIdentity, propertyId: number): PersistentBookingRecord {
    assertRecord(item.record);
    const r = item.record;
    const expected = keyFor(identity, propertyId, r.submissionKey);
    if (r.owner.issuer !== identity.issuer || r.owner.sub !== identity.sub || r.propertyId !== propertyId ||
        item.pk !== expected.pk || item.sk !== expected.sk) throw new Error('Invalid stored ownership');
    return structuredClone(r);
  }

  async getOwned(identity: GuestIdentity, propertyId: number, submissionKey: string): Promise<PersistentBookingRecord | undefined> {
    const result = await this.client.get({ TableName: this.table, Key: keyFor(identity, propertyId, submissionKey), ConsistentRead: true });
    return result.Item ? this.readItem(result.Item, identity, propertyId) : undefined;
  }

  async listOwned(identity: GuestIdentity, propertyId: number): Promise<PersistentBookingRecord[]> {
    const pk = scope(identity, propertyId);
    const records: PersistentBookingRecord[] = [];
    let cursor: Key | undefined;
    const seen = new Set<string>();
    do {
      const page = await this.client.query({ TableName: this.table,
        KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :prefix)',
        ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
        ExpressionAttributeValues: { ':pk': pk, ':prefix': 'SUBMISSION#' }, ConsistentRead: true, Limit: 100,
        ...(cursor ? { ExclusiveStartKey: cursor } : {}),
      });
      for (const item of page.Items ?? []) records.push(this.readItem(item, identity, propertyId));
      cursor = page.LastEvaluatedKey;
      if (cursor) {
        const id = JSON.stringify(cursor);
        if (cursor.pk !== pk || !cursor.sk.startsWith('SUBMISSION#') || seen.has(id) || seen.size >= 100) throw new Error('Invalid history pagination');
        seen.add(id);
      }
    } while (cursor);
    return records;
  }

  /** Only call with a server-validated snapshot and authenticated identity.
   * An existing record is recovery information, NEVER permission to resubmit.
   */
  async begin(identity: GuestIdentity, propertyId: number, submissionKey: string, draft: BookingDraft): Promise<PersistentBookingRecord> {
    const key = keyFor(identity, propertyId, submissionKey);
    assertDraft(draft);
    // This adapter currently prepares pending attempts, never confirmed/paid bookings.
    if (draft.summary.bookingStatus !== 'pending' || draft.summary.paymentStatus !== 'pending') throw new Error('New attempts must be pending');
    const requestFingerprint = digest([identity, propertyId, draft]);
    const now = this.now();
    const record: PersistentBookingRecord = structuredClone({ ...draft, owner: identity, propertyId,
      recordId: randomUUID(), schemaVersion: 1, submissionKey, requestFingerprint,
      processingState: 'prepared', version: 1, createdAt: now, updatedAt: now,
    });
    assertRecord(record);
    try {
      await this.client.transactWrite({ TransactItems: [{ Put: { TableName: this.table, Item: { ...key, record },
        ConditionExpression: 'attribute_not_exists(pk)',
      } }] });
      return structuredClone(record);
    } catch (error) {
      if (!conditionalFailure(error)) throw error;
      const existing = await this.getOwned(identity, propertyId, submissionKey);
      if (!existing || existing.requestFingerprint !== requestFingerprint) throw new BookingStorageConflict();
      return existing;
    }
  }

  /** CAS claim before any external side effect. No lease expiry or automatic replay.
   * dispatching/uncertain may only be reconciled, never reset to prepared.
   * invoice_created requires identifiers from a trusted server-side response.
   */
  async advance(identity: GuestIdentity, propertyId: number, submissionKey: string, expectedVersion: number,
    nextState: ProcessingState, identifiers?: { bookingId: string; quoteId: string; invoiceId: number }): Promise<PersistentBookingRecord> {
    const existing = await this.getOwned(identity, propertyId, submissionKey);
    if (!existing || existing.version !== expectedVersion) throw new BookingStorageConflict();
    const allowed: Record<ProcessingState, ProcessingState[]> = {
      prepared: ['dispatching'], dispatching: ['uncertain', 'invoice_created'], uncertain: ['invoice_created'], invoice_created: [],
    };
    if (!allowed[existing.processingState].includes(nextState)) throw new BookingStorageConflict();
    if (nextState === 'invoice_created' ? !validIdentifiers(identifiers) : identifiers !== undefined) throw new Error('Invalid invoice identifiers');
    const record: PersistentBookingRecord = structuredClone({ ...existing, processingState: nextState,
      version: existing.version + 1, updatedAt: this.now(), ...(identifiers ? { simplotelIdentifiers: identifiers } : {}),
    });
    assertRecord(record);
    const key = keyFor(identity, propertyId, submissionKey);
    const writes: { Put: ConditionalPut }[] = [{ Put: { TableName: this.table, Item: { ...key, record },
      ConditionExpression: '#record.#version = :version',
      ExpressionAttributeNames: { '#record': 'record', '#version': 'version' },
      ExpressionAttributeValues: { ':version': expectedVersion },
    } }];
    if (identifiers) {
      // A GSI alone cannot enforce uniqueness. Reserve the external booking ID
      // atomically with the record; never reassign it to another owner/attempt.
      writes.push({ Put: { TableName: this.table,
        Item: { pk: `PROVIDER#${digest([propertyId, identifiers.bookingId])}`, sk: 'OWNERSHIP', target: JSON.stringify(key) },
        ConditionExpression: 'attribute_not_exists(pk) OR #target = :target',
        ExpressionAttributeNames: { '#target': 'target' }, ExpressionAttributeValues: { ':target': JSON.stringify(key) },
      } });
    }
    try { await this.client.transactWrite({ TransactItems: writes }); }
    catch (error) { if (conditionalFailure(error)) throw new BookingStorageConflict(); throw error; }
    return structuredClone(record);
  }
}
