import { authenticateGuest } from '../../../../../lib/guestHistory/cognito.ts';
import { guestHistoryWriteRepository } from '../../../../../lib/guestHistory/writeRepository.ts';
import { requireServerControlledInvoiceTestAuthorization } from '../../../../../lib/simplotel/invoiceTestAuthorization.ts';
import { buildFullOnlineInvoicePayload, getInvoiceInventoryHold } from '../../../../../lib/simplotel/bookingPreparation.ts';
import { BookingExecutionError, buildPaymentLinkResult, isFullOnlinePaymentEnabled, postToSimplotel } from '../../../../../lib/simplotel/bookingExecution.ts';
import { classifyProviderError, createSendInvoiceHandler } from '../../../../../lib/simplotel/sendInvoiceHandler.ts';
import { readSimplotelHotelId, simplotelVoiceBotUrl } from '../../../../../lib/simplotel/property.ts';

export const POST = createSendInvoiceHandler({
  enabled: isFullOnlinePaymentEnabled,
  authorizeTest: requireServerControlledInvoiceTestAuthorization,
  inventoryHold: getInvoiceInventoryHold,
  accessToken: () => process.env.SIMPLOTEL_ACCESS_TOKEN,
  authenticate: authenticateGuest,
  repository: guestHistoryWriteRepository,
  revalidate: async (request, accessToken) => {
    const hotelId = readSimplotelHotelId();
    const rooms = Array.from({ length: request.rooms }, (_, index) => ({
      id: index + 1, adults: request.adults, children: request.children,
      ...(request.children > 0 ? { childAge: request.childAge } : {}),
    }));
    const response = await fetch(simplotelVoiceBotUrl(hotelId, "availability"), {
      method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkIn: request.checkIn, checkOut: request.checkOut, rooms, propertyId: hotelId }),
      cache: 'no-store',
    });
    if (!response.ok) throw new BookingExecutionError(
      'Live availability could not be revalidated. No invoice request was sent.', 'NO_LONGER_AVAILABLE', 409);
    return response.json();
  },
  submitInvoice: async (core, hold, accessToken) => {
    try {
      const result = await postToSimplotel({ endpoint: 'send-invoice', hotelId: readSimplotelHotelId(), accessToken,
        payload: buildFullOnlineInvoicePayload(core, hold) });
      const verified = buildPaymentLinkResult(result);
      if (verified.invoice_id === undefined) throw new Error('Invoice identifier unavailable');
      return { bookingId: verified.booking_id, quoteId: verified.quote_id, invoiceId: verified.invoice_id };
    } catch (error) { throw classifyProviderError(error); }
  },
});
