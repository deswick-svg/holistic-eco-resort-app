import { authenticateGuest } from '../../../../../lib/guestHistory/cognito.ts';
import { guestHistoryWriteRepository } from '../../../../../lib/guestHistory/writeRepository.ts';
import { requireServerControlledInvoiceTestAuthorization } from '../../../../../lib/simplotel/invoiceTestAuthorization.ts';
import { buildFullOnlineInvoicePayload, getInvoiceInventoryHold } from '../../../../../lib/simplotel/bookingPreparation.ts';
import { BookingExecutionError, buildPaymentLinkResult, isFullOnlinePaymentEnabled, postToSimplotel } from '../../../../../lib/simplotel/bookingExecution.ts';
import { classifyProviderError, createSendInvoiceHandler } from '../../../../../lib/simplotel/sendInvoiceHandler.ts';

const HOTEL_ID = 7849;

export const POST = createSendInvoiceHandler({
  enabled: isFullOnlinePaymentEnabled,
  authorizeTest: requireServerControlledInvoiceTestAuthorization,
  inventoryHold: getInvoiceInventoryHold,
  accessToken: () => process.env.SIMPLOTEL_ACCESS_TOKEN,
  authenticate: authenticateGuest,
  repository: guestHistoryWriteRepository,
  revalidate: async (request, accessToken) => {
    const rooms = Array.from({ length: request.rooms }, (_, index) => ({
      id: index + 1, adults: request.adults, children: request.children,
      ...(request.children > 0 ? { childAge: request.childAge } : {}),
    }));
    const response = await fetch(`https://admin.simplotel.com/api/v1/hotel/${HOTEL_ID}/voice-bot/availability`, {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIn: request.checkIn, checkOut: request.checkOut, rooms, propertyId: HOTEL_ID }),
      cache: 'no-store',
    });
    if (!response.ok) throw new BookingExecutionError(
      'Live availability could not be revalidated. No invoice request was sent.', 'NO_LONGER_AVAILABLE', 409);
    return response.json();
  },
  submitInvoice: async (core, hold, accessToken) => {
    try {
      const result = await postToSimplotel({ endpoint: 'send-invoice', hotelId: HOTEL_ID, accessToken,
        payload: buildFullOnlineInvoicePayload(core, hold) });
      const verified = buildPaymentLinkResult(result);
      if (verified.invoice_id === undefined) throw new Error('Invoice identifier unavailable');
      return { bookingId: verified.booking_id, quoteId: verified.quote_id, invoiceId: verified.invoice_id };
    } catch (error) { throw classifyProviderError(error); }
  },
});
