import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { guestAuth } from '../services/guestAuth';
import { prepareAccountDeletion } from '../services/accountDeletion';

const deletionRequestUrl = 'https://www.holisticecoresort.com/account-deletion';

export function AccountDeletionScreen({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    void guestAuth.restoreSession().then((result) => {
      if (active && result.status === 'authenticated') {
        setEmail(result.email);
        setSignedIn(true);
      }
    });
    return () => { active = false; };
  }, []);

  const deleteAccount = async () => {
    if (!signedIn || confirmation.trim() !== 'DELETE') return;
    Alert.alert('Delete guest account?',
      'This permanently deletes your Holistic Eco-Resort guest sign-in. Resort booking and transaction records may be retained where required and are not automatically deleted from Simplotel.', [
        { text: 'Keep account', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: async () => {
          setBusy(true);
          const prepared = await prepareAccountDeletion();
          if (!prepared.ok) {
            setBusy(false);
            Alert.alert('Deletion unavailable', prepared.message);
            return;
          }
          const result = await guestAuth.deleteAccount();
          setBusy(false);
          if (result.status === 'signed_out') {
            setConfirmation(''); setEmail(''); setSignedIn(false);
            Alert.alert('Account deleted', result.message ?? 'Your guest account has been deleted.', [{ text: 'Done', onPress: onBack }]);
          } else Alert.alert('Deletion unavailable', 'Your account was not deleted. Sign in again or contact the resort for assistance.');
        } },
      ]);
  };

  return <View style={styles.page}>
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
      <Text style={styles.headerTitle}>Delete Account</Text><View style={{ width: 48 }} />
    </View>
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Image source={require('../../assets/HER-_HER Logo Full.png')} style={styles.logo} resizeMode="contain" />
      <View style={styles.card}>
        <View style={styles.icon}><Ionicons name="shield-checkmark-outline" size={34} color={colors.forest} /></View>
        <Text style={styles.title}>Delete your guest account</Text>
        <Text style={styles.copy}>This deletes your Cognito guest sign-in and personal profile or account data controlled by this app after your authenticated request is verified.</Text>
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Booking records are handled separately</Text>
          <Text style={styles.noticeText}>Simplotel records are not automatically changed. Records required for business, accounting, tax, fraud prevention, disputes, or legal compliance may be retained only as long as necessary for that purpose.</Text>
        </View>
        {signedIn ? <>
          <Text style={styles.label}>SIGNED-IN EMAIL</Text><Text style={styles.email}>{email}</Text>
          <Text style={styles.label}>TYPE DELETE TO CONFIRM</Text>
          <TextInput accessibilityLabel="Type DELETE to confirm account deletion" autoCapitalize="characters" autoCorrect={false} editable={!busy} value={confirmation} onChangeText={setConfirmation} style={styles.input} />
          <Pressable accessibilityRole="button" disabled={busy || confirmation.trim() !== 'DELETE'} onPress={deleteAccount} style={({ pressed }) => [styles.deleteButton, (busy || confirmation.trim() !== 'DELETE') && styles.disabled, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.deleteText}>Delete my guest account</Text>}
          </Pressable>
        </> : <View style={styles.signInNotice}><Text style={styles.noticeTitle}>Sign in first</Text><Text style={styles.noticeText}>Return to Guest Login and sign in to submit a verified in-app deletion request.</Text></View>}
      </View>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL(deletionRequestUrl)} style={styles.webButton}><Text style={styles.webButtonText}>Account deletion help on the web</Text></Pressable>
      <Text style={styles.help}>You can also contact booking@holisticstay.in or +91 94 9585 0389 for deletion assistance.</Text>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream }, header: { height: 52, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }, headerTitle: { fontSize: 18, fontWeight: '800', color: colors.ink }, body: { padding: 22, paddingBottom: 48, alignItems: 'center' },
  logo: { width: 150, height: 112, marginTop: 20 }, card: { width: '100%', marginTop: 18, padding: 22, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  icon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' }, title: { marginTop: 18, fontSize: 25, lineHeight: 32, fontWeight: '800', color: colors.ink }, copy: { marginTop: 10, fontSize: 15, lineHeight: 23, color: colors.muted },
  notice: { marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.sage }, signInNotice: { marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: colors.cream }, noticeTitle: { fontSize: 14, fontWeight: '800', color: colors.forest }, noticeText: { marginTop: 7, fontSize: 13, lineHeight: 20, color: colors.ink },
  label: { marginTop: 20, marginBottom: 7, color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.8 }, email: { color: colors.ink, fontSize: 14, fontWeight: '700' }, input: { height: 52, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.cream, color: colors.ink, fontSize: 16 },
  deleteButton: { minHeight: 52, marginTop: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.danger }, deleteText: { color: '#fff', fontSize: 15, fontWeight: '800' }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.75 },
  webButton: { width: '100%', minHeight: 50, marginTop: 18, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.forest }, webButtonText: { color: colors.forest, fontSize: 14, fontWeight: '800' }, help: { marginTop: 15, color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
