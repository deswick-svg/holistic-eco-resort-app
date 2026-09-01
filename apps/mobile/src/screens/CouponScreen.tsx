import React from 'react';
import { Alert, Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const officialPhoneUri = '+919495850389';
const officialEmail = 'booking@holisticstay.in';

async function openContact(url: string, fallbackMessage: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('Unsupported link');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', fallbackMessage);
  }
}

export function CouponScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Discount Coupon</Text>
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
            <Text style={styles.eyebrow}>OFFERS & UPDATES</Text>
            <Text style={styles.heroTitle}>Stay informed, book confidently</Text>
            <Text style={styles.heroSubtitle}>Only verified public coupons will appear here.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons name="pricetag-outline" size={29} color={colors.forest} />
            </View>
            <Text style={styles.statusEyebrow}>CURRENT COUPON STATUS</Text>
            <Text style={styles.statusTitle}>No active public coupon available</Text>
            <Text style={styles.statusText}>
              The resort’s official website currently lists promotional offers, but it does not publish a verified
              coupon code with complete validity and redemption terms.
            </Text>
            <View style={styles.statusDivider} />
            <View style={styles.safetyRow}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.leaf} />
              <Text style={styles.safetyText}>No coupon has been added or applied to booking prices.</Text>
            </View>
          </View>

          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.sectionEyebrow}>CHECK WITH THE RESORT</Text>
              <Text style={styles.sectionTitle}>Ask about current offers</Text>
            </View>
            <View style={styles.contactBadge}>
              <Ionicons name="chatbubble-ellipses-outline" size={25} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Contacting the resort does not guarantee a discount. The team can confirm whether any offer applies to
            your intended stay and explain its current terms.
          </Text>

          <View style={styles.contactList}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call the resort about current offers"
              onPress={() => openContact(`tel:${officialPhoneUri}`, 'The phone dialler could not be opened.')}
              style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="call-outline" size={23} color={colors.forest} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactTitle}>Call the resort</Text>
                <Text style={styles.contactDetail}>+91 94 9585 0389</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Email the resort about current offers"
              onPress={() =>
                openContact(
                  `mailto:${officialEmail}?subject=${encodeURIComponent('Current resort offers enquiry')}`,
                  'An email app could not be opened.',
                )
              }
              style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
            >
              <View style={styles.contactIcon}>
                <Ionicons name="mail-outline" size={23} color={colors.forest} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={styles.contactTitle}>Email the resort</Text>
                <Text style={styles.contactDetail}>{officialEmail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={23} color={colors.forest} />
            <Text style={styles.noteText}>
              Any offer confirmed by the resort remains separate from live room rates in this app. Eligibility and
              final pricing must be confirmed through an officially supported booking channel.
            </Text>
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
  statusCard: { marginTop: -1, padding: 20, alignItems: 'center', borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  statusIcon: { width: 58, height: 58, marginTop: -30, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage, borderWidth: 4, borderColor: colors.cream },
  statusEyebrow: { marginTop: 13, color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  statusTitle: { marginTop: 7, color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', textAlign: 'center' },
  statusText: { marginTop: 9, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  statusDivider: { width: '100%', height: StyleSheet.hairlineWidth, marginVertical: 15, backgroundColor: colors.line },
  safetyRow: { flexDirection: 'row', alignItems: 'center' },
  safetyText: { flex: 1, marginLeft: 7, color: colors.leaf, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  headingRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  headingCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  contactBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 9, color: colors.muted, fontSize: 13, lineHeight: 20 },
  contactList: { marginTop: 16 },
  contactCard: { minHeight: 72, marginBottom: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  contactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  contactCopy: { flex: 1, marginHorizontal: 12 },
  contactTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  contactDetail: { marginTop: 3, color: colors.muted, fontSize: 12 },
  pressed: { opacity: 0.76 },
  noteCard: { marginTop: 5, padding: 15, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 17, backgroundColor: colors.sage },
  noteText: { flex: 1, marginLeft: 10, color: colors.forest, fontSize: 12, lineHeight: 18 },
});
