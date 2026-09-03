/** Backend-owned mapping. Never populate owner fields from request parameters. */
export type GuestIdentity = { issuer: string; sub: string };

export type BookingSummary = {
  referenceId: string;
  guestName: string;
  roomType: string;
  checkInDate: string; // YYYY-MM-DD; mobile displays DD-MM-YYYY.
  checkOutDate: string;
  adults: number;
  children: number;
  bookingStatus: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'unknown';
  paymentStatus: 'not_required' | 'pending' | 'paid' | 'failed' | 'unknown';
  stayState: 'upcoming' | 'current' | 'past';
  total?: { amount: string; currency: string };
};

export type OwnedBookingRecord = {
  owner: GuestIdentity;
  propertyId: number;
  provenance: 'test_fixture' | 'verified_backend';
  simplotelIdentifiers?: { bookingId: string; quoteId?: string; invoiceId?: number };
  summary: BookingSummary;
};

export interface GuestBookingRepository {
  /** Future database adapter MUST scope its query by issuer, sub AND propertyId. */
  listOwned(identity: GuestIdentity, propertyId: number): Promise<readonly OwnedBookingRecord[]>;
}

/** No live ingestion or persistence yet. Test fixtures are never imported here. */
export const emptyGuestBookingRepository: GuestBookingRepository = {
  async listOwned() { return []; },
};
