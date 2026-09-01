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
import { employeeAuth } from '../services/employeeAuth';
import { colors } from '../theme/colors';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmployeeLoginScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setMessage(null);

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError('Enter a valid employee email address.');
      return;
    }

    setEmailError(null);
    setSubmitting(true);
    try {
      const result = await employeeAuth.beginSignIn({ email: normalizedEmail });
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
        <Text style={styles.headerTitle}>Employee Login</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <ImageBackground source={require('../../assets/hero-background.png')} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(3,25,16,0.12)', 'rgba(3,25,16,0.93)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>AUTHORIZED STAFF ONLY</Text>
            <Text style={styles.heroTitle}>Employee access</Text>
            <Text style={styles.heroSubtitle}>A future secure entry point for approved Holistic Eco-Resort staff.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.warningCard}>
            <View style={styles.warningIcon}>
              <Ionicons name="id-card-outline" size={25} color={colors.forest} />
            </View>
            <View style={styles.warningCopy}>
              <Text style={styles.warningTitle}>Employee-only area</Text>
              <Text style={styles.warningText}>
                This access point is intended only for authorized resort employees. Guest accounts use a separate
                sign-in flow.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formEyebrow}>STAFF SIGN IN</Text>
            <Text style={styles.formTitle}>Continue with work email</Text>
            <Text style={styles.formIntro}>
              Enter your employee email address to begin. No credentials are collected until an approved secure
              staff authentication provider is connected.
            </Text>

            <Text style={styles.fieldLabel}>EMPLOYEE EMAIL</Text>
            <View style={[styles.inputWrap, emailError && styles.inputWrapError]}>
              <Ionicons name="mail-outline" size={20} color={colors.muted} />
              <TextInput
                accessibilityLabel="Employee email address"
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
                placeholder="employee@example.com"
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
              accessibilityLabel="Continue to employee sign in"
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

          <View style={styles.securityCard}>
            <View style={styles.securityHeading}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.forest} />
              <Text style={styles.securityTitle}>Access remains locked</Text>
            </View>
            <Text style={styles.securityText}>
              This foundation does not authenticate employees or grant access to admin functions, guest data,
              bookings, payments, or resort operations.
            </Text>
          </View>

          <Text style={styles.privacyNote}>
            No account is created and the entered email address is not stored on this device.
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
  hero: { height: 335, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 27 },
  eyebrow: { color: '#D6E4D8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 345, color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 335, color: '#E9F0EA', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  warningCard: { marginTop: 20, padding: 15, flexDirection: 'row', borderRadius: 18, backgroundColor: colors.sage, borderWidth: 1, borderColor: '#D5E3D8' },
  warningIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  warningCopy: { flex: 1, marginLeft: 12 },
  warningTitle: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  warningText: { marginTop: 4, color: colors.forest2, fontSize: 12, lineHeight: 18 },
  formCard: { marginTop: 14, padding: 20, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  formEyebrow: { color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  formTitle: { marginTop: 7, color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  formIntro: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
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
  securityCard: { marginTop: 14, padding: 17, borderRadius: 19, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  securityHeading: { flexDirection: 'row', alignItems: 'center' },
  securityTitle: { marginLeft: 9, color: colors.ink, fontSize: 15, fontWeight: '800' },
  securityText: { marginTop: 10, color: colors.muted, fontSize: 12, lineHeight: 18 },
  privacyNote: { marginTop: 15, paddingHorizontal: 8, color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
