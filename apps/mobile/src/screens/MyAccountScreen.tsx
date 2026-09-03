import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { MyStaysSection } from '../components/MyStaysSection';

/** Signed-in guest content inside the existing branded Guest Login shell. */
export function MyAccountScreen({ account, onSignOut, busy }: {
  account: { email: string; emailVerified: true };
  onSignOut: () => void;
  busy: boolean;
}) {
  return <View>
    <Text accessibilityRole="header" style={styles.title}>My Account</Text>
    <Text style={styles.intro}>Your secure space at Holistic Eco-Resort.</Text>
    <View style={styles.details}>
      <Text style={styles.label}>EMAIL ADDRESS</Text>
      <Text style={styles.email}>{account.email}</Text>
      <View style={styles.status}>
        <Ionicons name="checkmark-circle-outline" size={20} color={colors.forest} />
        <Text style={styles.verified}>Email status: {account.emailVerified ? 'Verified' : 'Not verified'}</Text>
      </View>
    </View>
    <Text style={styles.note}>You are signed in. Your account details are shown only while your guest session is active.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Sign out" accessibilityState={{ disabled: busy }} disabled={busy} onPress={onSignOut}
      style={({ pressed }) => [styles.button, (pressed || busy) && styles.dimmed]}>
      <Ionicons name="log-out-outline" size={21} color={colors.white} />
      <Text style={styles.buttonText}>{busy ? 'Please wait…' : 'Sign out'}</Text>
    </Pressable>
    <Text style={styles.footer}>Signing out clears this device’s account session.</Text>
    <MyStaysSection />
  </View>;
}

const styles = StyleSheet.create({
  title: { marginTop: 7, color: colors.ink, fontSize: 26, lineHeight: 33, fontWeight: '800' },
  intro: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  details: { marginTop: 22, padding: 17, borderRadius: 16, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
  label: { color: colors.forest, fontSize: 10, letterSpacing: 0.9, fontWeight: '800' },
  email: { marginTop: 9, color: colors.ink, fontSize: 16, lineHeight: 24, flexShrink: 1 },
  status: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  verified: { color: colors.forest, fontSize: 13, fontWeight: '700', flexShrink: 1 },
  note: { marginTop: 18, color: colors.muted, fontSize: 13, lineHeight: 20 },
  button: { marginTop: 20, minHeight: 52, padding: 14, borderRadius: 14, flexDirection: 'row', gap: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  dimmed: { opacity: 0.6 },
  footer: { marginTop: 12, color: colors.muted, fontSize: 11, lineHeight: 17 },
});
