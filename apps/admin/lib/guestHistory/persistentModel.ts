import type { OwnedBookingRecord } from './model.ts';

/** Internal, server-owned data. Not a Simplotel request body or a mobile DTO. */
export type Money = { amount: string; currency: string };
export type Charge = { name: string; amount: Money };
export type RoomSnapshot = {
  roomTypeId: string;
  roomName: string;
  ratePlanId: string;
  ratePlanName: string;
  adults: number;
  children: number;
  dailyPrices: { date: string; price: Money; taxes: Charge[] }[];
  addons: Charge[];
  penalties: { description: string; amount?: Money }[];
};
export type BookingDraft = Pick<OwnedBookingRecord, 'summary' | 'provenance'> & {
  guest: { name: string; email: string; phone: string };
  /** Fresh, server-validated Simplotel selection used by the fingerprint. */
  validatedSelection: { ratePlan: unknown; occupancy: unknown };
  rooms: RoomSnapshot[];
  totals?: { subtotal: Money; taxes: Money; total: Money };
};
export type ProcessingState = 'prepared' | 'dispatching' | 'uncertain' | 'provider_rejected' | 'invoice_created';
export type PersistentBookingRecord = OwnedBookingRecord & BookingDraft & {
  schemaVersion: 1;
  recordId: string;
  submissionKey: string;
  requestFingerprint: string;
  processingState: ProcessingState;
  version: number;
  createdAt: string;
  updatedAt: string;
};

// Exact shape validation prevents accidental persistence of arbitrary payloads,
// Authorization headers, token fields or card data. No raw provider responses.
type Check = (value: unknown) => boolean;
const text: Check = v => typeof v === 'string' && v.trim().length > 0 && v.length <= 2000;
const integer: Check = v => Number.isSafeInteger(v) && (v as number) >= 0;
const positive: Check = v => integer(v) && (v as number) > 0;
const oneOf = (...values: unknown[]): Check => v => values.includes(v);
const list = (check: Check): Check => v => Array.isArray(v) && v.length <= 366 && v.every(check);
function shape(required: Record<string, Check>, optional: Record<string, Check> = {}): Check {
  return value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const v = value as Record<string, unknown>;
    return Object.keys(v).every(k => Object.hasOwn(required, k) || Object.hasOwn(optional, k)) &&
      Object.entries(required).every(([k, check]) => Object.hasOwn(v, k) && check(v[k])) &&
      Object.entries(optional).every(([k, check]) => !Object.hasOwn(v, k) || check(v[k]));
  };
}
export const isoDate: Check = v => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) &&
  Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const timestamp: Check = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const money = shape({ amount: v => typeof v === 'string' && /^\d{1,12}(\.\d{1,4})?$/.test(v), currency: v => typeof v === 'string' && /^[A-Z]{3}$/.test(v) });
const charge = shape({ name: text, amount: money });
const json: Check = value => {
  const visit = (v: unknown, depth: number): boolean => depth <= 20 &&
    (v === null || ['string', 'boolean'].includes(typeof v) ||
      (typeof v === 'number' && Number.isFinite(v)) ||
      (Array.isArray(v) && v.length <= 366 && v.every(x => visit(x, depth + 1))) ||
      (!!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length <= 100 &&
        Object.entries(v).every(([k, x]) => k.length <= 200 && visit(x, depth + 1))));
  return visit(value, 0);
};
const summary = shape({
  referenceId: text, guestName: text, roomType: text, checkInDate: isoDate, checkOutDate: isoDate,
  adults: positive, children: integer,
  bookingStatus: oneOf('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'unknown'),
  paymentStatus: oneOf('not_required', 'pending', 'paid', 'failed', 'unknown'),
  stayState: oneOf('upcoming', 'current', 'past'),
}, { total: money });
const draftFields = {
  guest: shape({ name: text, email: v => text(v) && /^\S+@\S+\.\S+$/.test(v as string), phone: v => text(v) && /^\+\d+$/.test(v as string) }),
  validatedSelection: shape({ ratePlan: json, occupancy: json }),
  summary,
  provenance: oneOf('test_fixture', 'verified_backend'),
  rooms: list(shape({ roomTypeId: text, roomName: text, ratePlanId: text, ratePlanName: text,
    adults: positive, children: integer,
    dailyPrices: list(shape({ date: isoDate, price: money, taxes: list(charge) })),
    addons: list(charge), penalties: list(shape({ description: text }, { amount: money })),
  })),
};
const totals = shape({ subtotal: money, taxes: money, total: money });
export const validIdentity = shape({ issuer: text, sub: text });
export const validProperty = positive;
export const validSubmission: Check = v => typeof v === 'string' && /^[A-Za-z0-9_-]{16,128}$/.test(v);
export const validIdentifiers = shape({ bookingId: text, quoteId: text, invoiceId: positive });
const recordShape = shape({ ...draftFields, schemaVersion: oneOf(1), recordId: text,
  owner: validIdentity, propertyId: positive, submissionKey: validSubmission,
  requestFingerprint: v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v),
  processingState: oneOf('prepared', 'dispatching', 'uncertain', 'provider_rejected', 'invoice_created'),
  version: positive, createdAt: timestamp, updatedAt: timestamp,
}, { totals, simplotelIdentifiers: validIdentifiers });

export function assertDraft(value: unknown): asserts value is BookingDraft {
  if (!shape(draftFields, { totals })(value)) throw new Error('Invalid booking snapshot');
  const v = value as BookingDraft;
  if (v.summary.checkOutDate <= v.summary.checkInDate || !v.rooms.length ||
      v.rooms.some(r => !r.dailyPrices.length || r.dailyPrices.some(d => d.date < v.summary.checkInDate || d.date >= v.summary.checkOutDate)) ||
      Buffer.byteLength(JSON.stringify(value)) > 300_000) throw new Error('Invalid booking snapshot');
}
export function assertRecord(value: unknown): asserts value is PersistentBookingRecord {
  if (!recordShape(value)) throw new Error('Invalid stored booking');
  const v = value as PersistentBookingRecord;
  assertDraft({ summary: v.summary, provenance: v.provenance, guest: v.guest,
    validatedSelection: v.validatedSelection, rooms: v.rooms, ...(v.totals ? { totals: v.totals } : {}) });
  if ((v.processingState === 'invoice_created') !== !!v.simplotelIdentifiers) throw new Error('Invalid stored booking state');
}
