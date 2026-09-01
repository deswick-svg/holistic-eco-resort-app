export type StayState = 'upcoming' | 'current' | 'past';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled'
  | 'unknown';

export type PaymentStatus = 'not_required' | 'pending' | 'paid' | 'failed' | 'unknown';

export type TrustedBookingTotal = {
  amount: string;
  currency: string;
};

/**
 * Backend-neutral view model for a future authenticated guest-history service.
 * Dates must arrive as YYYY-MM-DD and are formatted for display by the screen.
 */
export type BookingHistoryRecord = {
  referenceId: string;
  guestName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  stayState: StayState;
  total?: TrustedBookingTotal;
};
