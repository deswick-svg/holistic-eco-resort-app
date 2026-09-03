import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadGuestHistory } from '../services/guestHistory';
import type { HistoryState } from '../services/guestHistoryCore';
import { colors } from '../theme/colors';

export function MyStaysSection() {
  const [state, setState] = useState<HistoryState | 'loading'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState('loading');
    void loadGuestHistory(controller.signal).then(result => {
      if (!controller.signal.aborted) setState(result);
    });
    return () => controller.abort();
  }, [attempt]);
  const message = state === 'empty' ? 'No app-linked bookings yet. Your stays will appear here once securely linked to your account.'
    : state === 'signed_out' ? 'Your session could not be verified. Please sign in again to view your stays.'
    : state === 'forbidden' ? 'Booking history is not available for this account.'
    : state === 'unavailable' ? 'Booking history is temporarily unavailable. Please try again later.'
    : 'Checking your app-linked stays…';
  return <View style={styles.card}>
    <Ionicons name="calendar-outline" size={25} color={colors.forest} />
    <Text accessibilityRole="header" style={styles.title}>My Stays</Text>
    <Text style={styles.subtitle}>BOOKING HISTORY</Text>
    {state === 'loading' && <ActivityIndicator color={colors.forest} style={styles.spinner} />}
    <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text>
    {state === 'unavailable' && <Pressable accessibilityRole="button" onPress={() => { setState('loading'); setAttempt(value => value + 1); }} style={styles.retry}>
      <Text style={styles.retryText}>Try again</Text>
    </Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  card: { marginTop: 22, padding: 18, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.cream },
  title: { marginTop: 10, color: colors.ink, fontSize: 20, fontWeight: '800' },
  subtitle: { marginTop: 5, color: colors.forest, fontSize: 10, letterSpacing: 0.8, fontWeight: '700' },
  message: { marginTop: 12, color: colors.muted, fontSize: 13, lineHeight: 21 },
  spinner: { marginTop: 12, alignSelf: 'flex-start' },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: 6 },
  retryText: { color: colors.forest, fontSize: 13, fontWeight: '700' },
});
