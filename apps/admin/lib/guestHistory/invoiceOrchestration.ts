import { BookingStorageConflict, DynamoGuestBookingRepository } from './dynamoRepository.ts';
import type { GuestIdentity } from './model.ts';
import type { BookingDraft, PersistentBookingRecord } from './persistentModel.ts';
import { reportInvoiceStageFailure } from './invoiceDiagnostics.ts';
import type { InvoiceFailureReporter, InvoiceFailureStage } from './invoiceDiagnostics.ts';
import { prepareBookingCore } from '../simplotel/bookingPreparation.ts';
import type { BookingPreparationRequest, JsonValue, PreparedBookingCore } from '../simplotel/bookingPreparation.ts';

export const GUEST_BOOKING_PROPERTY_ID = 7849;

export class InvoiceProviderFailure extends Error {
  readonly outcome: 'rejected' | 'uncertain';
  constructor(outcome: 'rejected' | 'uncertain') { super('Invoice provider operation failed'); this.outcome = outcome; }
}
export class InvoiceOrchestrationError extends Error {
  readonly code: 'INVALID_REQUEST' | 'CONFLICT' | 'PROVIDER_REJECTED' | 'OUTCOME_UNCERTAIN';
  constructor(code: 'INVALID_REQUEST' | 'CONFLICT' | 'PROVIDER_REJECTED' | 'OUTCOME_UNCERTAIN') {
    super('Invoice creation could not be completed safely'); this.code = code;
  }
}
export type PreparedInvoice = ReturnType<typeof prepareBookingCore>;
type Identifiers = { bookingId: string; quoteId: string; invoiceId: number };
type WriteRepository = Pick<DynamoGuestBookingRepository, 'begin' | 'advance' | 'getOwned'>;

const allowedBodyFields = new Set(['submissionId', 'checkIn', 'checkOut', 'adults', 'children', 'childAge', 'rooms', 'selection', 'customerDetail']);
function strictSubmission(body: unknown): { submissionId: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !allowedBodyFields.has(key))) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  const submissionId = String((body as Record<string, unknown>).submissionId ?? '');
  if (!/^[A-Za-z0-9_-]{16,128}$/.test(submissionId)) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  return { submissionId };
}
function money(amount: string | number) {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < 0) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  return { amount: value.toFixed(2), currency: 'INR' };
}
function price(value: JsonValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  const item = value as Record<string, JsonValue>;
  if (typeof item.date !== 'string' || (typeof item.total_price !== 'string' && typeof item.price !== 'string' && typeof item.amount !== 'string')) {
    throw new InvoiceOrchestrationError('INVALID_REQUEST');
  }
  const date = normalizeDailyPriceDate(item.date);
  return { date, price: money(String(item.total_price ?? item.price ?? item.amount)), taxes: [] };
}

function normalizeDailyPriceDate(value: string) {
  const isDate = (candidate: string) => {
    const parsed = new Date(`${candidate}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === candidate;
  };
  if (/^\d{4}-\d{2}-\d{2}$/.test(value) && isDate(value)) return value;
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!match) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  const normalized = `${match[3]}-${match[2]}-${match[1]}`;
  if (!isDate(normalized)) {
    throw new InvoiceOrchestrationError('INVALID_REQUEST');
  }
  return normalized;
}
/** Converts only freshly revalidated data. Raw provider responses/tokens are never stored. */
export function buildInvoiceBookingDraft(prepared: PreparedInvoice, request: BookingPreparationRequest): BookingDraft {
  const { payload, summary } = prepared;
  if (payload.propertyId !== GUEST_BOOKING_PROPERTY_ID) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  const first = payload.lineItems[0];
  if (!first || payload.lineItems.length !== request.rooms) throw new InvoiceOrchestrationError('INVALID_REQUEST');
  const taxes = money(summary.taxesAndFees);
  return {
    provenance: 'verified_backend',
    guest: { name: request.customerDetail.name, email: request.customerDetail.email, phone: request.customerDetail.phone },
    validatedSelection: { ratePlan: structuredClone(request.selection.ratePlan), occupancy: structuredClone(request.selection.occupancy) },
    summary: { referenceId: `PENDING-${request.selection.occupancyId}`, guestName: request.customerDetail.name,
      roomType: summary.roomName, checkInDate: summary.checkIn, checkOutDate: summary.checkOut,
      adults: summary.adultsPerRoom * summary.rooms, children: summary.childrenPerRoom * summary.rooms,
      bookingStatus: 'pending', paymentStatus: 'pending', stayState: 'upcoming', total: money(summary.totalAmount) },
    rooms: payload.lineItems.map(item => ({ roomTypeId: String(item.room.room_type), roomName: summary.roomName,
      ratePlanId: String(item.room.rate_plan.rate_plan_id), ratePlanName: item.room.rate_plan.name,
      adults: item.room.adults, children: item.room.children,
      dailyPrices: item.room.rate_plan.prices.map(price), addons: [],
      penalties: [{ description: JSON.stringify(item.room.rate_plan.penalty) }],
    })),
    totals: { subtotal: money(summary.roomPrice), taxes, total: money(summary.totalAmount) },
  };
}

function identifiers(record: PersistentBookingRecord): Identifiers | undefined {
  const ids = record.simplotelIdentifiers;
  return ids?.quoteId && ids.invoiceId ? { bookingId: ids.bookingId, quoteId: ids.quoteId, invoiceId: ids.invoiceId } : undefined;
}

export function createAuthenticatedInvoiceOrchestrator(deps: {
  authenticate: (request: Request) => Promise<GuestIdentity>;
  validateAndPrepare: (body: unknown, propertyId: number) => Promise<{ request: BookingPreparationRequest; prepared: PreparedInvoice }>;
  repository: WriteRepository;
  submitInvoice: (core: PreparedBookingCore) => Promise<Identifiers>;
  reportFailure?: InvoiceFailureReporter;
}) {
  const reportFailure = deps.reportFailure ?? reportInvoiceStageFailure;
  const stage = async <T>(name: InvoiceFailureStage, operation: () => T | Promise<T>): Promise<T> => {
    try { return await operation(); }
    catch (error) { reportFailure(name, error); throw error; }
  };
  const recover = (owner: GuestIdentity, key: string) => deps.repository.getOwned(owner, GUEST_BOOKING_PROPERTY_ID, key);
  return async (httpRequest: Request, body: unknown): Promise<Identifiers> => {
    const owner = await stage('authentication', () => deps.authenticate(httpRequest));
    const { submissionId } = await stage('request_parsing', () => strictSubmission(body));
    const { request, prepared } = await stage('fresh_preparation', () => deps.validateAndPrepare(body, GUEST_BOOKING_PROPERTY_ID));
    const draft = await stage('draft_mapping', () => buildInvoiceBookingDraft(prepared, request));
    let record: PersistentBookingRecord;
    try { record = await stage('repository_begin', () => deps.repository.begin(owner, GUEST_BOOKING_PROPERTY_ID, submissionId, draft)); }
    catch (error) { throw error instanceof BookingStorageConflict ? new InvoiceOrchestrationError('CONFLICT') : error; }
    const done = identifiers(record);
    if (record.processingState === 'invoice_created' && done) return done;
    if (record.processingState === 'provider_rejected') throw new InvoiceOrchestrationError('PROVIDER_REJECTED');
    if (record.processingState !== 'prepared') throw new InvoiceOrchestrationError('OUTCOME_UNCERTAIN');
    try { record = await deps.repository.advance(owner, GUEST_BOOKING_PROPERTY_ID, submissionId, record.version, 'dispatching'); }
    catch (error) {
      if (!(error instanceof BookingStorageConflict)) throw error;
      const current = await recover(owner, submissionId); const recovered = current && identifiers(current);
      if (current?.processingState === 'invoice_created' && recovered) return recovered;
      throw new InvoiceOrchestrationError('OUTCOME_UNCERTAIN');
    }
    let result: Identifiers;
    try { result = await deps.submitInvoice(prepared.payload); }
    catch (error) {
      const state = error instanceof InvoiceProviderFailure && error.outcome === 'rejected' ? 'provider_rejected' : 'uncertain';
      try { await deps.repository.advance(owner, GUEST_BOOKING_PROPERTY_ID, submissionId, record.version, state); } catch { /* fail closed */ }
      throw new InvoiceOrchestrationError(state === 'provider_rejected' ? 'PROVIDER_REJECTED' : 'OUTCOME_UNCERTAIN');
    }
    try { await deps.repository.advance(owner, GUEST_BOOKING_PROPERTY_ID, submissionId, record.version, 'invoice_created', result); }
    catch {
      const current = await recover(owner, submissionId); const recovered = current && identifiers(current);
      if (current?.processingState === 'invoice_created' && recovered && JSON.stringify(recovered) === JSON.stringify(result)) return recovered;
      if (current?.processingState === 'dispatching') {
        try { await deps.repository.advance(owner, GUEST_BOOKING_PROPERTY_ID, submissionId, current.version, 'uncertain'); } catch { /* fail closed */ }
      }
      throw new InvoiceOrchestrationError('OUTCOME_UNCERTAIN');
    }
    return result;
  };
}
