import { GuestHistoryAuthError } from '../guestHistory/cognito.ts';
import type { GuestIdentity } from '../guestHistory/model.ts';
import type { DynamoGuestBookingRepository } from '../guestHistory/dynamoRepository.ts';
import { createAuthenticatedInvoiceOrchestrator, InvoiceOrchestrationError, InvoiceProviderFailure } from '../guestHistory/invoiceOrchestration.ts';
import { BookingExecutionError, buildPaymentLinkResult, requireBookingCreationEnabled } from './bookingExecution.ts';
import { BookingPreparationError, InvoiceConfigurationError, prepareBookingCore, validateBookingPreparationRequest } from './bookingPreparation.ts';
import type { PreparedBookingCore, SimplotelAvailabilityResponse, SimplotelInvoicePayload } from './bookingPreparation.ts';
import { InvoiceTestAuthorizationError } from './invoiceTestAuthorization.ts';

type Hold = SimplotelInvoicePayload['holdInventory'];
type Repository = Pick<DynamoGuestBookingRepository, 'begin' | 'advance' | 'getOwned'>;
type Identifiers = { bookingId: string; quoteId: string; invoiceId: number };
export type SendInvoiceDependencies = {
  enabled: () => boolean;
  authorizeTest: (headers: Headers) => void;
  inventoryHold: () => Hold;
  accessToken: () => string | undefined;
  authenticate: (request: Request) => Promise<GuestIdentity>;
  repository: Repository;
  revalidate: (request: ReturnType<typeof validateBookingPreparationRequest>, accessToken: string) => Promise<SimplotelAvailabilityResponse>;
  submitInvoice: (core: PreparedBookingCore, hold: Hold, accessToken: string) => Promise<Identifiers>;
};

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: {
  'Cache-Control': 'private, no-store, max-age=0', Vary: 'Authorization',
  ...(status === 401 ? { 'WWW-Authenticate': 'Bearer' } : {}),
} });

export function createSendInvoiceHandler(deps: SendInvoiceDependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      // Guards must remain before authentication, storage, availability and provider I/O.
      requireBookingCreationEnabled(deps.enabled());
      deps.authorizeTest(request.headers);
      const hold = deps.inventoryHold();
      const accessToken = deps.accessToken();
      if (!accessToken) return json({ error: { code: 'SERVER_CONFIGURATION', message: 'Invoice creation is unavailable.' } }, 500);

      const orchestrate = createAuthenticatedInvoiceOrchestrator({
        authenticate: deps.authenticate,
        repository: deps.repository,
        validateAndPrepare: async (body, propertyId) => {
          const bookingRequest = validateBookingPreparationRequest(body);
          const availability = await deps.revalidate(bookingRequest, accessToken);
          return { request: bookingRequest, prepared: prepareBookingCore(bookingRequest, availability, propertyId) };
        },
        submitInvoice: core => deps.submitInvoice(core, hold, accessToken),
      });
      const body: unknown = await request.json();
      const result = await orchestrate(request, body);
      return json(buildPaymentLinkResult({ booking_id: result.bookingId, quote_id: result.quoteId, invoice_id: result.invoiceId }));
    } catch (error) {
      if (error instanceof InvoiceTestAuthorizationError) return json({ error: { code: 'TEST_AUTHORIZATION_REQUIRED', message: error.message } }, 403);
      if (error instanceof GuestHistoryAuthError) return json({ error: { code: error.status === 401 ? 'UNAUTHENTICATED' : error.status === 403 ? 'FORBIDDEN' : 'SERVER_CONFIGURATION' } }, error.status);
      if (error instanceof InvoiceConfigurationError) return json({ error: { code: 'SERVER_CONFIGURATION', message: error.message } }, 500);
      if (error instanceof BookingPreparationError) return json({ error: { code: error.code, message: error.message } }, error.code === 'INVALID_REQUEST' ? 400 : 409);
      if (error instanceof InvoiceOrchestrationError) {
        const status = error.code === 'INVALID_REQUEST' ? 400 : error.code === 'CONFLICT' ? 409 : 502;
        return json({ error: { code: error.code, message: error.message } }, status);
      }
      if (error instanceof BookingExecutionError) return json({ error: { code: error.code, message: error.message } }, error.status);
      return json({ error: { code: 'INVOICE_FAILED', message: 'The invoice request could not be completed.' } }, 500);
    }
  };
}

export function classifyProviderError(error: unknown): InvoiceProviderFailure {
  return new InvoiceProviderFailure(error instanceof BookingExecutionError &&
    (error.code === 'SIMPLOTEL_REJECTED' || error.code === 'NO_LONGER_AVAILABLE') ? 'rejected' : 'uncertain');
}
