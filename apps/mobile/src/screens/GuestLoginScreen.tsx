import React, { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { guestAuth } from '../services/guestAuth';
import { colors } from '../theme/colors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function GuestLoginScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage(null);

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailError(null);
    setSubmitting(true);
    try {
      const result = await guestAuth.beginSignIn({ email: normalizedEmail });
      if (result.status === 'not_connected') {
        setMessage(result.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Guest Login</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground source={require('../../assets/hero-background.png')} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(3,25,16,0.08)', 'rgba(3,25,16,0.9)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>GUEST ACCOUNT</Text>
            <Text style={styles.heroTitle}>Your private resort space</Text>
            <Text style={styles.heroSubtitle}>Secure account access will keep personal stay information private.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.formCard}>
            <View style={styles.lockIcon}>
              <Ionicons name="lock-closed-outline" size={29} color={colors.forest} />
            </View>
            <Text style={styles.formEyebrow}>SECURE ACCESS</Text>
            <Text style={styles.formTitle}>Continue with email</Text>
            <Text style={styles.formIntro}>
              Enter your email address to begin. Passwords and verification codes are never collected until a
              secure authentication provider is connected.
            </Text>

            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <View style={[styles.inputWrap, emailError && styles.inputWrapError]}>
              <Ionicons name="mail-outline" size={20} color={colors.muted} />
              <TextInput
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                inputMode="email"
                keyboardType="email-address"
                onChangeText={(value) => {
                  setEmail(value);
                  if (emailError) setEmailError(null);
                  if (message) setMessage(null);
                }}
                onSubmitEditing={handleContinue}
                placeholder="you@example.com"
                placeholderTextColor="#909991"
                returnKeyType="next"
                style={styles.input}
                textContentType="emailAddress"
                value={email}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Continue to guest sign in"
              disabled={submitting}
              onPress={handleContinue}
              style={({ pressed }) => [styles.continueButton, pressed && styles.pressed, submitting && styles.disabled]}
            >
              <Text style={styles.continueText}>{submitting ? 'Checking…' : 'Continue'}</Text>
              <Ionicons name="arrow-forward" size={19} color={colors.white} />
            </Pressable>

            {message ? (
              <View accessibilityRole="alert" style={styles.unavailableCard}>
                <Ionicons name="information-circle-outline" size={21} color={colors.forest} />
                <Text style={styles.unavailableText}>{message}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.accountBenefits}>
            <Text style={styles.benefitsTitle}>Future guest account access</Text>
            {[
              ['shield-checkmark-outline', 'Authenticated access to your own stay information'],
              ['calendar-outline', 'Upcoming and past booking details when securely available'],
              ['person-outline', 'Personal information protected behind verified access'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Ionicons name={icon as any} size={19} color={colors.forest} />
                </View>
                <Text style={styles.benefitText}>{label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.privacyNote}>
            This screen does not create an account, authenticate a guest, or store the email address on the device.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: { height: 52, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 42 },
  hero: { height: 345, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 27 },
  eyebrow: { color: '#D6E4D8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 345, color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 335, color: '#E9F0EA', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  formCard: { marginTop: -1, padding: 20, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  lockIcon: { width: 58, height: 58, marginTop: -30, alignSelf: 'center', borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage, borderWidth: 4, borderColor: colors.cream },
  formEyebrow: { marginTop: 13, color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center' },
  formTitle: { marginTop: 7, color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '800', textAlign: 'center' },
  formIntro: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  fieldLabel: { marginTop: 22, marginBottom: 7, color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.9 },
  inputWrap: { height: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderRadius: 14, backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.line },
  inputWrapError: { borderColor: colors.danger },
  input: { flex: 1, height: '100%', marginLeft: 10, color: colors.ink, fontSize: 15 },
  errorText: { marginTop: 6, color: colors.danger, fontSize: 11 },
  continueButton: { marginTop: 15, minHeight: 52, paddingHorizontal: 17, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.forest },
  continueText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.62 },
  unavailableCard: { marginTop: 14, padding: 13, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 14, backgroundColor: colors.sage },
  unavailableText: { flex: 1, marginLeft: 9, color: colors.forest, fontSize: 12, lineHeight: 18 },
  accountBenefits: { marginTop: 17, padding: 17, borderRadius: 19, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  benefitsTitle: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  benefitRow: { marginTop: 13, flexDirection: 'row', alignItems: 'center' },
  benefitIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  benefitText: { flex: 1, marginLeft: 11, color: colors.muted, fontSize: 12, lineHeight: 18 },
  privacyNote: { marginTop: 15, paddingHorizontal: 8, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
