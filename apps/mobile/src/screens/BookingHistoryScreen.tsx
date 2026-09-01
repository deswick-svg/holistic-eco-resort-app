import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import type { BookingHistoryRecord, StayState } from '../types/bookingHistory';

const sectionOrder: Array<{ key: StayState; title: string }> = [
  { key: 'current', title: 'Current stay' },
  { key: 'upcoming', title: 'Upcoming stays' },
  { key: 'past', title: 'Past stays' },
];

const bookingStatusLabels: Record<BookingHistoryRecord['bookingStatus'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_in: 'Checked in',
  checked_out: 'Checked out',
  cancelled: 'Cancelled',
  unknown: 'Status unavailable',
};

const paymentStatusLabels: Record<BookingHistoryRecord['paymentStatus'], string> = {
  not_required: 'No advance required',
  pending: 'Payment pending',
  paid: 'Paid',
  failed: 'Payment failed',
  unknown: 'Payment status unavailable',
};

function formatDisplayDate(isoDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : 'Date unavailable';
}

function formatTotal(record: BookingHistoryRecord) {
  if (!record.total) return null;
  const prefix = record.total.currency.toUpperCase() === 'INR' ? '₹' : `${record.total.currency.toUpperCase()} `;
  return `${prefix}${record.total.amount}`;
}

function StayCard({ record }: { record: BookingHistoryRecord }) {
  const [expanded, setExpanded] = useState(false);
  const guestCount = record.adults + record.children;
  const total = formatTotal(record);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${record.roomType}. ${expanded ? 'Hide' : 'Show'} booking details`}
      onPress={() => setExpanded((value) => !value)}
      style={({ pressed }) => [styles.stayCard, expanded && styles.stayCardExpanded, pressed && styles.pressed]}
    >
      <View style={styles.stayTopRow}>
        <View style={styles.roomIcon}>
          <Ionicons name="bed-outline" size={23} color={colors.forest} />
        </View>
        <View style={styles.stayHeading}>
          <Text style={styles.roomType}>{record.roomType}</Text>
          <Text style={styles.reference}>Reference {record.referenceId}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.dateLabel}>CHECK-IN</Text>
          <Text style={styles.dateValue}>{formatDisplayDate(record.checkInDate)}</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={colors.leaf} />
        <View style={[styles.dateBlock, styles.dateBlockRight]}>
          <Text style={styles.dateLabel}>CHECK-OUT</Text>
          <Text style={styles.dateValue}>{formatDisplayDate(record.checkOutDate)}</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guest</Text>
            <Text style={styles.detailValue}>{record.guestName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Guests</Text>
            <Text style={styles.detailValue}>{guestCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking</Text>
            <Text style={styles.detailValue}>{bookingStatusLabels[record.bookingStatus]}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment</Text>
            <Text style={styles.detailValue}>{paymentStatusLabels[record.paymentStatus]}</Text>
          </View>
          {total ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total</Text>
              <Text style={styles.detailValue}>{total}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

export function BookingHistoryScreen({
  onBack,
  records = [],
}: {
  onBack: () => void;
  records?: readonly BookingHistoryRecord[];
}) {
  const hasRecords = records.length > 0;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking History</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={require('../../assets/hero-background.png')} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(3,25,16,0.08)', 'rgba(3,25,16,0.9)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR STAYS</Text>
            <Text style={styles.heroTitle}>Stay details, all in one place</Text>
            <Text style={styles.heroSubtitle}>A private home for current and past booking information.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          {hasRecords ? (
            sectionOrder.map((section) => {
              const sectionRecords = records.filter((record) => record.stayState === section.key);
              if (sectionRecords.length === 0) return null;
              return (
                <View key={section.key} style={styles.section}>
                  <View style={styles.sectionHeading}>
                    <Text style={styles.sectionTitle}>{section.title}</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{sectionRecords.length}</Text>
                    </View>
                  </View>
                  {sectionRecords.map((record) => (
                    <StayCard key={record.referenceId} record={record} />
                  ))}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="calendar-outline" size={34} color={colors.forest} />
              </View>
              <Text style={styles.emptyEyebrow}>BOOKING HISTORY</Text>
              <Text style={styles.emptyTitle}>No booking history available yet</Text>
              <Text style={styles.emptyText}>
                A secure guest-history service is not connected yet. No stay records are stored or displayed on
                this device.
              </Text>
            </View>
          )}

          <View style={styles.privacyCard}>
            <Ionicons name="lock-closed-outline" size={23} color={colors.forest} />
            <View style={styles.privacyCopy}>
              <Text style={styles.privacyTitle}>Designed for private records</Text>
              <Text style={styles.privacyText}>
                Future booking history will require authenticated guest access before any personal stay details are
                retrieved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: { height: 52, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 42 },
  hero: { height: 355, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 27 },
  eyebrow: { color: '#D6E4D8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 345, color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 335, color: '#E9F0EA', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  emptyCard: { marginTop: 24, paddingHorizontal: 22, paddingVertical: 28, alignItems: 'center', borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  emptyEyebrow: { marginTop: 17, color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  emptyTitle: { marginTop: 7, color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  emptyText: { marginTop: 9, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  section: { marginTop: 27 },
  sectionHeading: { marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  countBadge: { minWidth: 30, height: 30, paddingHorizontal: 9, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  countText: { color: colors.forest, fontSize: 12, fontWeight: '800' },
  stayCard: { marginBottom: 12, padding: 15, borderRadius: 19, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  stayCardExpanded: { borderColor: '#B7D2BE' },
  stayTopRow: { flexDirection: 'row', alignItems: 'center' },
  roomIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  stayHeading: { flex: 1, marginHorizontal: 12 },
  roomType: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  reference: { marginTop: 4, color: colors.muted, fontSize: 11 },
  dateRow: { marginTop: 14, paddingTop: 13, flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  dateBlock: { flex: 1 },
  dateBlockRight: { alignItems: 'flex-end' },
  dateLabel: { color: colors.leaf, fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  dateValue: { marginTop: 4, color: colors.ink, fontSize: 13, fontWeight: '700' },
  details: { marginTop: 13, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  detailRow: { minHeight: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailLabel: { color: colors.muted, fontSize: 12 },
  detailValue: { maxWidth: '65%', color: colors.ink, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  pressed: { opacity: 0.76 },
  privacyCard: { marginTop: 14, padding: 16, flexDirection: 'row', borderRadius: 18, backgroundColor: colors.sage },
  privacyCopy: { flex: 1, marginLeft: 11 },
  privacyTitle: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  privacyText: { marginTop: 4, color: colors.forest2, fontSize: 12, lineHeight: 18 },
});
