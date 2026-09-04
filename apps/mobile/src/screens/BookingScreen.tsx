import React, { useEffect, useRef, useState } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import {
  simplotel,
  AvailabilityRequest,
  BookingGuestDetails,
  PaymentLinkResponse,
  BookingPreparationResponse,
  JsonValue,
  LiveStayRate,
} from "../services/simplotel";
import { classifyBookingFailure } from "../services/bookingUx";
import { clearBookingDraft, loadBookingDraft, saveBookingDraft } from "../services/bookingDraftStorage";

type BookingStep = "search" | "guest" | "summary" | "prepared" | "paymentPending";

function formatDisplayApiDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}-${month}-${year}`;
}

function getPenaltyText(penalty: JsonValue) {
  if (!penalty || Array.isArray(penalty) || typeof penalty !== "object") {
    return "Cancellation policy supplied by Simplotel";
  }
  const description = penalty.description;
  const name = penalty.name;
  return typeof description === "string"
    ? description
    : typeof name === "string"
      ? name
      : "Cancellation policy supplied by Simplotel";
}

function RoomGallery({ rate }: { rate: LiveStayRate }) {
  const [activeImage, setActiveImage] = useState(0);
  const { width } = useWindowDimensions();
  const imageWidth = width - 78;
  const gallery = rate.imageGallery?.length
    ? rate.imageGallery
    : rate.imageUrl
      ? [rate.imageUrl]
      : [];

  if (gallery.length === 0) return null;

  const handleScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    setActiveImage(
      Math.round(event.nativeEvent.contentOffset.x / imageWidth)
    );
  };

  return (
    <View style={styles.galleryWrap}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={{ width: imageWidth }}
      >
        {gallery.map((imageUrl) => (
          <Image
            key={imageUrl}
            source={{ uri: imageUrl }}
            style={[styles.roomImage, { width: imageWidth }]}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      {gallery.length > 1 ? (
        <View style={styles.galleryDots}>
          {gallery.map((imageUrl, index) => (
            <View
              key={imageUrl}
              style={[
                styles.galleryDot,
                index === activeImage && styles.galleryDotActive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryValueStrong]}>
        {value}
      </Text>
    </View>
  );
}

export function BookingScreen({ onBack }: { onBack: () => void }) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [childAges, setChildAges] = useState("");
  const [rooms, setRooms] = useState("1");

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveRates, setLiveRates] = useState<LiveStayRate[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState<BookingStep>("search");
  const [selectedRate, setSelectedRate] = useState<LiveStayRate | null>(null);
  const [searchRequest, setSearchRequest] = useState<AvailabilityRequest | null>(null);
  const [guest, setGuest] = useState<BookingGuestDetails>({
    name: "",
    email: "",
    phone: "+91",
  });
  const [preparing, setPreparing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flowError, setFlowError] = useState("");
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [uncertainOutcome, setUncertainOutcome] = useState(false);
  const [preparation, setPreparation] = useState<BookingPreparationResponse | null>(null);
  const [paymentLink, setPaymentLink] = useState<PaymentLinkResponse | null>(null);
  const submissionLock = useRef(false);
  const submissionId = useRef<string | null>(null);
  const formatDate = (date: Date | null) => {
  if (!date) return "DD-MM-YYYY";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
  useEffect(() => {
    let active = true;
    void loadBookingDraft().then((draft) => {
      if (!active || !draft) return;
      const localDate = (value: string) => {
        const parts = value.split("-");
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        return new Date(year, month - 1, day);
      };
      setCheckIn(localDate(draft.request.checkIn));
      setCheckOut(localDate(draft.request.checkOut));
      setAdults(String(draft.request.adults));
      setChildren(String(draft.request.children));
      setChildAges(draft.request.childAge.join(", "));
      setRooms(String(draft.request.rooms));
      setGuest(draft.guest);
      setRestoredDraft(true);
      if (draft.status === "uncertain") setUncertainOutcome(true);
    }).catch(() => {
      // Secure storage failure must not fall back to plaintext persistence.
    });
    return () => { active = false; };
  }, []);
  const handleSearchAvailability = async () => {
  if (!checkIn || !checkOut) {
    setError("Please select check-in and check-out dates.");
    return;
  }

  if (checkOut <= checkIn) {
    setError("Check-out must be after check-in.");
    return;
  }

  const adultCount = Number(adults);
  const childCount = Number(children);
  const roomCount = Number(rooms);
  const parsedChildAges = childCount > 0
    ? childAges.split(",").map((age) => Number(age.trim()))
    : [];

  if (
    !Number.isInteger(adultCount) || adultCount < 1 || adultCount > 4 ||
    !Number.isInteger(childCount) || childCount < 0 || childCount > 4 ||
    !Number.isInteger(roomCount) || roomCount < 1
  ) {
    setError("Enter valid room occupancy details.");
    return;
  }

  if (
    parsedChildAges.length !== childCount ||
    parsedChildAges.some((age) => !Number.isInteger(age) || age < 0 || age > 17)
  ) {
    setError("Enter one age from 0 to 17 for each child, separated by commas.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const request: AvailabilityRequest = {
      checkIn: formatApiDate(checkIn),
      checkOut: formatApiDate(checkOut),
      adults: adultCount,
      children: childCount,
      childAge: parsedChildAges,
      rooms: roomCount,
    };
    const rates = await simplotel.getAvailability(request);

    setLiveRates(rates);
    setSearchRequest(request);
    setSearched(true);
  } catch (err) {
    setError(classifyBookingFailure(err, "availability").message);
    setLiveRates([]);
    setSearched(true);
  } finally {
    setLoading(false);
  }
};

  const handleSelectRoom = (rate: LiveStayRate) => {
    if (!searchRequest || rate.availableUnits < searchRequest.rooms) {
      setError("The requested number of rooms is not available.");
      return;
    }
    setSelectedRate(rate);
    setFlowError("");
    setPreparation(null);
    setPaymentLink(null);
    submissionId.current = null;
    submissionLock.current = false;
    setStep("guest");
  };

  const handleGuestContinue = () => {
    const normalizedGuest = {
      name: guest.name.trim(),
      email: guest.email.trim(),
      phone: guest.phone.trim(),
    };
    if (
      !normalizedGuest.name ||
      !/^\S+@\S+\.\S+$/.test(normalizedGuest.email) ||
      !/^\+\d+$/.test(normalizedGuest.phone)
    ) {
      setFlowError(
        "Enter a name, valid email, and phone number with international country code."
      );
      return;
    }
    setGuest(normalizedGuest);
    if (searchRequest) {
      void saveBookingDraft({ status: "in_progress", request: searchRequest, guest: normalizedGuest }).catch(() => {
        // Continue without persistence if secure device storage is unavailable.
      });
    }
    setFlowError("");
    setStep("summary");
  };

  const handlePrepareBooking = async () => {
    if (!searchRequest || !selectedRate) return;
    try {
      setPreparing(true);
      setFlowError("");
      const prepared = await simplotel.prepareBooking({
        request: searchRequest,
        selectedRate,
        guest,
      });
      setPreparation(prepared);
      setStep("prepared");
    } catch (prepareError) {
      const failure = classifyBookingFailure(prepareError, "prepare");
      setFlowError(failure.message);
      if (failure.kind === "stale") setPreparation(null);
    } finally {
      setPreparing(false);
    }
  };

  const handleCreatePaymentLink = async () => {
    if (
      submissionLock.current ||
      !preparation?.paymentCreationEnabled ||
      !searchRequest ||
      !selectedRate
    ) return;

    submissionLock.current = true;
    setSubmitting(true);
    setFlowError("");
    submissionId.current ??=
      `mobile_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    let keepLocked = false;
    try {
      const result = await simplotel.createFullOnlinePayment({
        request: searchRequest,
        selectedRate,
        guest,
        submissionId: submissionId.current,
      });
      setPaymentLink(result);
      setStep("paymentPending");
      void clearBookingDraft().catch(() => {});
    } catch (bookingError) {
      const failure = classifyBookingFailure(bookingError, "invoice");
      if (failure.kind === "uncertain") {
        keepLocked = true;
        setUncertainOutcome(true);
        if (searchRequest) {
          void saveBookingDraft({ status: "uncertain", request: searchRequest, guest }).catch(() => {});
        }
      } else {
        setFlowError(failure.message);
        if (failure.kind === "stale") {
          setPreparation(null);
          setStep("summary");
        }
      }
    } finally {
      if (!keepLocked) submissionLock.current = false;
      setSubmitting(false);
    }
  };

  if (uncertainOutcome) {
    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.title}>Request being checked</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.uncertainCard}>
            <Ionicons name="alert-circle" size={48} color={colors.danger} />
            <Text style={styles.uncertainTitle}>Please do not retry</Text>
            <Text style={styles.uncertainText}>
              Do not open a payment link or attempt payment. The resort is checking whether your request reached the booking provider. Your booking is not confirmed and this incomplete attempt will not appear in My Stays.
            </Text>
          </View>
          <Pressable style={styles.button} onPress={onBack}>
            <Text style={styles.buttonText}>Return to home</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (step !== "search" && selectedRate && searchRequest) {
    const review = preparation?.summary;
    const displayRoomName = (review?.roomName ?? selectedRate.roomName).replace(
      " at Holistic Eco Resort and Ayurvedic Retreat",
      ""
    );
    const displayRoomPrice =
      review?.roomPrice ??
      Number(selectedRate.bookingSelection.totalPrice) * searchRequest.rooms;
    const displayTaxes =
      review?.taxesAndFees ??
      Number(selectedRate.bookingSelection.totalTaxesAndFees) *
        searchRequest.rooms;
    const displayTotal =
      review?.totalAmount ?? selectedRate.totalAmount * searchRequest.rooms;
    const displayGuest = review?.customerDetail ?? {
      ...guest,
      bookingForSelf: true as const,
    };

    return (
      <View style={styles.page}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              setFlowError("");
              if (step === "guest") setStep("search");
              else if (step === "summary") setStep("guest");
              else if (step === "paymentPending") setStep("prepared");
              else setStep("summary");
            }}
            style={styles.back}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>
            {step === "guest"
              ? "Guest details"
              : step === "summary"
                ? "Booking summary"
                : step === "paymentPending"
                  ? "Payment"
                  : "Final review"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          {step === "guest" ? (
            <>
              <Text style={styles.headline}>Who is staying?</Text>
              <Text style={styles.sub}>
                This flow currently supports bookings made for yourself.
              </Text>
              <View style={styles.formCard}>
                <Text style={styles.label}>Full name</Text>
                <TextInput
                  value={guest.name}
                  onChangeText={(name) => setGuest({ ...guest, name })}
                  autoCapitalize="words"
                  style={styles.input}
                />
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={guest.email}
                  onChangeText={(email) => setGuest({ ...guest, email })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Text style={styles.label}>Phone with country code</Text>
                <TextInput
                  value={guest.phone}
                  onChangeText={(phone) => setGuest({ ...guest, phone })}
                  keyboardType="phone-pad"
                  style={styles.input}
                />
                <Pressable style={styles.button} onPress={handleGuestContinue}>
                  <Text style={styles.buttonText}>Review booking</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.headline}>{displayRoomName}</Text>
              <View style={styles.summaryCard}>
                <SummaryRow
                  label="Check-in"
                  value={formatDisplayApiDate(review?.checkIn ?? searchRequest.checkIn)}
                />
                <SummaryRow
                  label="Check-out"
                  value={formatDisplayApiDate(review?.checkOut ?? searchRequest.checkOut)}
                />
                <SummaryRow label="Rooms" value={String(searchRequest.rooms)} />
                <SummaryRow
                  label="Guests per room"
                  value={`${searchRequest.adults} adult${searchRequest.adults === 1 ? "" : "s"}, ${searchRequest.children} children`}
                />
                {searchRequest.childAge.length > 0 ? (
                  <SummaryRow
                    label="Child ages"
                    value={searchRequest.childAge.join(", ")}
                  />
                ) : null}
                <SummaryRow
                  label="Rate plan"
                  value={review?.ratePlanName ?? selectedRate.ratePlanName ?? "Rate plan"}
                />
                <SummaryRow label="Payment method" value="Pay full online" />
                <SummaryRow label="Guest" value={displayGuest.name} />
                <SummaryRow label="Email" value={displayGuest.email} />
                <SummaryRow label="Phone" value={displayGuest.phone} />
                <View style={styles.summaryDivider} />
                <SummaryRow
                  label="Room price"
                  value={`₹${displayRoomPrice.toLocaleString("en-IN")}`}
                />
                <SummaryRow
                  label="Taxes and fees"
                  value={`₹${displayTaxes.toLocaleString("en-IN")}`}
                />
                <SummaryRow
                  label={step === "prepared" || step === "paymentPending" ? "Validated total" : "Displayed total"}
                  value={`₹${displayTotal.toLocaleString("en-IN")}`}
                  strong
                />
                <Text style={styles.policyText}>
                  {getPenaltyText(review?.penalty ?? selectedRate.bookingSelection.ratePlan.penalty)}
                </Text>
              </View>

              {step === "paymentPending" && paymentLink ? (
                <View style={styles.preparedCard}>
                  <Ionicons name="checkmark-circle" size={50} color={colors.leaf} />
                  <Text style={styles.preparedTitle}>Payment link created</Text>
                  <Text style={styles.preparedText}>
                    Simplotel created the invoice and payment link for the full validated amount.
                  </Text>
                  <SummaryRow label="Booking ID" value={paymentLink.booking_id} />
                  <SummaryRow label="Quote ID" value={paymentLink.quote_id} />
                  <SummaryRow label="Invoice ID" value={String(paymentLink.invoice_id)} strong />
                  <SummaryRow label="Booking status" value="Unconfirmed" />
                  <SummaryRow label="Payment status" value="Payment pending" />
                  <Text style={styles.notBookedText}>
                    Your room is temporarily held while payment is pending. The payment link is valid only until the inventory hold expires. Your booking remains unconfirmed until payment is completed successfully. Follow the payment link sent by Simplotel; creating the link does not mean payment has been received.
                  </Text>
                </View>
              ) : step === "summary" ? (
                <>
                  <View style={styles.warningNotice}>
                    <Text style={styles.warningText}>
                      This validates current availability and prepares the full-online payment request. It does not create an invoice or payment link.
                    </Text>
                  </View>
                  <Pressable
                    style={[styles.button, preparing && styles.buttonDisabled]}
                    onPress={handlePrepareBooking}
                    disabled={preparing}
                  >
                    <Text style={styles.buttonText}>
                      {preparing ? "Revalidating..." : "Validate booking details"}
                    </Text>
                  </Pressable>
                </>
              ) : preparation ? (
                <>
                  <View style={styles.preparedCard}>
                    <Ionicons
                      name="checkmark-circle"
                      size={42}
                      color={colors.leaf}
                    />
                    <Text style={styles.preparedTitle}>Ready to create a payment link</Text>
                    <Text style={styles.preparedText}>
                      Live availability was rechecked and {preparation.preservedBookingData.lineItemCount} complete room line item{preparation.preservedBookingData.lineItemCount === 1 ? " was" : "s were"} prepared for full online payment.
                    </Text>
                    <Text style={styles.notBookedText}>
                      No invoice or payment link has been created yet.
                      {"\n"}After the link is created, the room is temporarily held. Complete payment before the hold expires; the booking remains unconfirmed until successful payment.
                    </Text>
                  </View>
                  <Pressable
                    testID="booking-final-action"
                    style={[
                      styles.button,
                      (!preparation.paymentCreationEnabled || submitting || !searchRequest || !selectedRate) &&
                        styles.finalActionDisabled,
                    ]}
                    disabled={!preparation.paymentCreationEnabled || submitting || !searchRequest || !selectedRate}
                    onPress={handleCreatePaymentLink}
                    accessibilityRole="button"
                    accessibilityState={{
                      disabled: !preparation.paymentCreationEnabled || submitting || !searchRequest || !selectedRate,
                    }}
                  >
                    <Ionicons
                      name={preparation.paymentCreationEnabled ? "card" : "lock-closed"}
                      size={17}
                      color={colors.white}
                    />
                    <Text style={styles.buttonText}>
                      {submitting
                        ? "Creating payment link..."
                        : preparation.paymentCreationEnabled
                          ? "Pay full online"
                          : "Payment not yet enabled"}
                    </Text>
                  </Pressable>
                  <Text style={styles.finalActionNote}>
                    {preparation.paymentCreationEnabled
                      ? "Availability and the full total will be checked again before the invoice request is submitted."
                      : "Payment-link creation is disabled by the resort. No booking, inventory hold, or payment will be created."}
                  </Text>
                </>
              ) : null}
            </>
          )}

          {flowError ? (
            <View style={styles.errorNotice}>
              <Text style={styles.errorText}>{flowError}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }
  

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.title}>Book your stay</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
      {restoredDraft ? (
        <View style={styles.restoredNotice}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.forest} />
          <Text style={styles.restoredText}>
            Your contact and search details were securely restored. Room availability and prices were not restored; search and validate them again.
          </Text>
        </View>
      ) : null}
        <Text style={styles.headline}>Find your perfect stay</Text>
        <Text style={styles.sub}>Live availability and final rates will come from the resort's Simplotel booking system.</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Check-in</Text>
         <Pressable style={styles.input} onPress={() => setShowCheckInPicker(true)}>
  <Text>{formatDate(checkIn)}</Text>
</Pressable>

{showCheckInPicker && (
  <DateTimePicker
    value={checkIn ?? new Date()}
    mode="date"
    minimumDate={new Date()}
    onChange={(_, selectedDate) => {
      setShowCheckInPicker(false);
if (selectedDate) {
  setCheckIn(selectedDate);
  setCheckOut(null);
}
    }}
  />
)}
          <Text style={styles.label}>Check-out</Text>
          <Pressable style={styles.input} onPress={() => setShowCheckOutPicker(true)}>
  <Text>{formatDate(checkOut)}</Text>
</Pressable>

{showCheckOutPicker && (
  <DateTimePicker
    value={checkOut ?? checkIn ?? new Date()}
    mode="date"
    minimumDate={checkIn ?? new Date()}
    onChange={(_, selectedDate) => {
      setShowCheckOutPicker(false);
      if (selectedDate) setCheckOut(selectedDate);
    }}
  />
)}
          <Text style={styles.label}>Adults</Text>
<TextInput
  value={adults}
  onChangeText={setAdults}
  keyboardType="number-pad"
  style={styles.input}
/>

<Text style={styles.label}>Children</Text>
<TextInput
  value={children}
  onChangeText={(value) => {
    setChildren(value);
    if (Number(value) === 0) setChildAges("");
  }}
  keyboardType="number-pad"
  style={styles.input}
/>

{Number(children) > 0 ? (
  <>
    <Text style={styles.label}>Child ages (comma-separated)</Text>
    <TextInput
      value={childAges}
      onChangeText={setChildAges}
      keyboardType="numbers-and-punctuation"
      placeholder="5, 10"
      style={styles.input}
    />
  </>
) : null}

<Text style={styles.label}>Rooms</Text>
<TextInput
  value={rooms}
  onChangeText={setRooms}
  keyboardType="number-pad"
  style={styles.input}
/>

<Pressable style={styles.button} onPress={handleSearchAvailability}>
            <Text style={styles.buttonText}>Search availability</Text>
          </Pressable>
        </View>
        {loading ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>Checking live availability...</Text>
  </View>
) : null}

{error ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>{error}</Text>
  </View>
) : null}

{searched && !loading && !error ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>
      Found {liveRates.length} live room options from Simplotel.
    </Text>
  </View>
) : null}
        {searched && !loading && !error ? (
  <>
    <Text style={styles.section}>Available rooms</Text>

    {liveRates.map((rate) => (
      <View key={rate.stayId} style={styles.roomCard}>
        <RoomGallery rate={rate} />
  <Text style={styles.roomName}>
    {rate.roomName.replace(" at Holistic Eco Resort and Ayurvedic Retreat", "")}
  </Text>

  <Text style={styles.roomMeta}>
    Available: {rate.availableUnits}
  </Text>

  <Text style={styles.roomMeta}>
    {rate.ratePlanName ?? "Rate plan"}
  </Text>

  <Text style={styles.roomPrice}>
    ₹{rate.totalAmount.toLocaleString("en-IN")}
  </Text>

  <Pressable
    style={styles.selectButton}
    onPress={() => handleSelectRoom(rate)}
  >
    <Text style={styles.selectButtonText}>Select room</Text>
  </Pressable>
</View>
    ))}
  </>
) : null}

</ScrollView>
</View>
);
}

const styles = StyleSheet.create({
  galleryWrap: {
    marginBottom: 14,
  },
  roomImage: {
    height: 180,
    borderRadius: 14,
  },
  galleryDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 9,
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  galleryDotActive: {
    width: 18,
    backgroundColor: colors.forest,
  },
  summaryCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
    paddingVertical: 8,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.muted,
  },
  summaryValue: {
    flex: 1.4,
    fontSize: 14,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "right",
  },
  summaryValueStrong: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.forest,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 8,
  },
  policyText: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  warningNotice: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFF4D8",
    borderWidth: 1,
    borderColor: "#E8CE88",
  },
  warningText: {
    color: "#6B5317",
    fontSize: 13,
    lineHeight: 19,
  },
  preparedCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 18,
    backgroundColor: colors.sage,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
  },
  preparedTitle: {
    marginTop: 10,
    fontSize: 21,
    fontWeight: "800",
    color: colors.forest,
  },
  preparedText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
    textAlign: "center",
  },
  notBookedText: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    color: colors.danger,
    textAlign: "center",
  },
  errorNotice: {
    marginTop: 14,
    padding: 13,
    borderRadius: 12,
    backgroundColor: "#FBEAEA",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
  uncertainCard: {
    marginTop: 36,
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#FBEAEA",
    borderWidth: 1,
    borderColor: "#E8B8B8",
    alignItems: "center",
  },
  uncertainTitle: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: "800",
    color: colors.danger,
  },
  uncertainText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 23,
    color: colors.ink,
    textAlign: "center",
  },
  restoredNotice: {
    marginBottom: 16,
    padding: 13,
    borderRadius: 12,
    backgroundColor: colors.sage,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  restoredText: {
    flex: 1,
    color: colors.forest,
    fontSize: 12.5,
    lineHeight: 18,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  finalActionDisabled: {
    flexDirection: "row",
    gap: 8,
    opacity: 0.5,
  },
  finalActionNote: {
    marginTop: 10,
    paddingHorizontal: 8,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    textAlign: "center",
  },

  roomCard: {
  marginTop: 14,
  padding: 18,
  borderRadius: 18,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.line,
},

roomName: {
  fontSize: 20,
  fontWeight: "800",
  color: colors.ink,
  marginBottom: 8,
},

roomMeta: {
  fontSize: 14,
  color: colors.muted,
  marginBottom: 5,
},

roomPrice: {
  fontSize: 22,
  fontWeight: "800",
  color: colors.forest,
  marginTop: 8,
  marginBottom: 14,
},

selectButton: {
  backgroundColor: colors.forest,
  paddingVertical: 13,
  borderRadius: 12,
  alignItems: "center",
},

selectButtonText: {
  color: colors.white,
  fontSize: 15,
  fontWeight: "800",
},
  page: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 48, height: 100, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  body: { padding: 20, paddingBottom: 45 },
  headline: { fontSize: 29, fontWeight: '800', color: colors.ink },
  sub: { marginTop: 7, fontSize: 14, lineHeight: 21, color: colors.muted },
  formCard: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  label: { marginTop: 8, marginBottom: 7, fontSize: 12, fontWeight: '800', color: colors.ink },
  input: { height: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, fontSize: 15, backgroundColor: '#FCFDFB' },
  button: { marginTop: 17, height: 50, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  notice: { marginTop: 14, flexDirection: 'row', gap: 9, padding: 12, borderRadius: 12, backgroundColor: colors.sage },
  noticeText: { flex: 1, color: colors.forest, fontSize: 12.5, lineHeight: 18 },
  section: { marginTop: 26, marginBottom: 12, fontSize: 20, fontWeight: '800', color: colors.ink },
});
