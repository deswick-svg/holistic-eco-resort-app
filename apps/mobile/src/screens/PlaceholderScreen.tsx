import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const detailCopy: Record<string, string> = {
  dining: 'Dining menus, meal timings, restaurant information and guest requests will live here.',
  activities: 'Show complimentary and paid resort activities, availability, prices and bookings.',
  spa: 'Show Ayurvedic treatments, duration, price and appointment options.',
  map: 'Interactive resort map with stays, pool, spa, restaurant, waterfalls and activity areas.',
  attractions: 'Nearby attractions with distance, description and directions.',
  reviews: 'Choose where to review the resort and make feedback easy for guests.',
  coupon: 'Display active coupons and eligible offers. Booking-time validation will be server-side.',
  gallery: 'Real Holistic Eco-Resort photos only, grouped by stays, wellness, dining and experiences.',
  contact: 'Phone, email, directions and WhatsApp support.',
  history: 'Previous stays, check-in records, booking references and invoices where available.',
  tripadvisor: 'Open the official TripAdvisor review destination.',
  'google-review': 'Open the official Google review destination.',
  login: 'Guest sign-in and account creation will be backed by Amazon Cognito.',
  'employee-login': 'Separate staff sign-in with role-based access.',
  'delete-account': 'Account deletion will require re-authentication and a clear confirmation flow.'
};

export function PlaceholderScreen({ screenKey, onBack }: { screenKey: string; onBack: () => void }) {
  const title = screenKey.split('-').map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.icon}><Ionicons name="leaf-outline" size={36} color={colors.forest} /></View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.copy}>{detailCopy[screenKey] ?? 'This module is included in the project and will be implemented in the next build step.'}</Text>
        <View style={styles.status}><Text style={styles.statusTitle}>Module status</Text><Text style={styles.statusText}>UI route created · production data/API connection pending</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 48, height: 100, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.ink },
  body: { padding: 25, paddingTop: 50 },
  icon: { width: 68, height: 68, borderRadius: 20, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 20, fontSize: 30, fontWeight: '800', color: colors.ink },
  copy: { marginTop: 12, fontSize: 16, lineHeight: 25, color: colors.muted },
  status: { marginTop: 30, padding: 18, backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.line },
  statusTitle: { fontWeight: '800', color: colors.ink, fontSize: 14 },
  statusText: { marginTop: 7, color: colors.leaf, fontSize: 13 },
});
