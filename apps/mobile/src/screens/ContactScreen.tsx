import React from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const officialPhoneDisplay = '+91 94 9585 0389';
const officialPhoneUri = '+919495850389';
const officialEmail = 'booking@holisticstay.in';
const officialAddress =
  'No: 2/199, Paithalmala Rd, Pottenplave, Chandanakampara, Vanchiyam, Kerala 670582';

const heroImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_1237%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Front_Elevation-2_g2atok';

async function openDeviceAction(url: string, fallbackMessage: string, fallbackUrl?: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    if (fallbackUrl) {
      await Linking.openURL(fallbackUrl);
      return;
    }

    throw new Error('Unsupported link');
  } catch {
    Alert.alert('Unable to open', fallbackMessage);
  }
}

export function ContactScreen({ onBack }: { onBack: () => void }) {
  const encodedAddress = encodeURIComponent(officialAddress);
  const nativeMapsUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodedAddress}`
      : `geo:0,0?q=${encodedAddress}`;
  const browserMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Contact Us</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: heroImage }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(4,24,15,0.05)', 'rgba(4,24,15,0.84)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>HOLISTIC ECO-RESORT · KANNUR</Text>
            <Text style={styles.heroTitle}>We’re here to help</Text>
            <Text style={styles.heroSubtitle}>Call, email or find your way to the resort using its official details.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>REACH OUT</Text>
              <Text style={styles.sectionTitle}>Contact the resort</Text>
            </View>
            <View style={styles.contactBadge}>
              <Ionicons name="chatbubble-ellipses-outline" size={25} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Connect directly with the Holistic Eco-Resort team using the published contact information below.
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Call Holistic Eco-Resort at ${officialPhoneDisplay}`}
              onPress={() => openDeviceAction(`tel:${officialPhoneUri}`, `Please call ${officialPhoneDisplay}.`)}
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <View style={[styles.actionIcon, styles.callIcon]}>
                <Ionicons name="call-outline" size={24} color={colors.white} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionLabel}>CALL THE RESORT</Text>
                <Text style={styles.actionTitle}>{officialPhoneDisplay}</Text>
                <Text style={styles.actionHint}>Open your phone dialer</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Email Holistic Eco-Resort at ${officialEmail}`}
              onPress={() =>
                openDeviceAction(
                  `mailto:${officialEmail}?subject=Holistic%20Eco-Resort%20enquiry`,
                  `Please email ${officialEmail}.`,
                )
              }
              style={({ pressed }) => [styles.actionCard, pressed && styles.cardPressed]}
            >
              <View style={styles.actionIcon}>
                <Ionicons name="mail-outline" size={24} color={colors.forest} />
              </View>
              <View style={styles.actionCopy}>
                <Text style={styles.actionLabel}>EMAIL THE RESORT</Text>
                <Text numberOfLines={1} style={styles.actionTitle}>{officialEmail}</Text>
                <Text style={styles.actionHint}>Open your email app</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <View style={styles.locationHeading}>
            <Text style={styles.contentTitle}>Find Holistic Eco-Resort</Text>
            <Text style={styles.contentSubtitle}>Open the published resort address in your maps app</Text>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.mapArtwork}>
              <View style={styles.mapLineOne} />
              <View style={styles.mapLineTwo} />
              <View style={styles.mapLineThree} />
              <View style={styles.mapPin}>
                <Ionicons name="location" size={25} color={colors.white} />
              </View>
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationName}>Holistic Eco-Resort, Kannur</Text>
              <Text style={styles.address}>{officialAddress}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open Holistic Eco-Resort in maps"
                onPress={() =>
                  openDeviceAction(nativeMapsUrl, `Please search maps for ${officialAddress}.`, browserMapsUrl)
                }
                style={styles.directionsButton}
              >
                <Ionicons name="navigate-outline" size={19} color={colors.white} />
                <Text style={styles.directionsText}>Open in maps</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.officialNote}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.forest} />
            <View style={styles.officialNoteCopy}>
              <Text style={styles.officialNoteTitle}>Official resort details</Text>
              <Text style={styles.officialNoteText}>
                These contact details and this address are published by Holistic Eco-Resort on its official website.
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
  hero: { height: 375, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 28 },
  eyebrow: { color: '#E4EBDD', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, color: colors.white, fontSize: 35, lineHeight: 41, fontWeight: '800' },
  heroSubtitle: { marginTop: 7, maxWidth: 335, color: '#F3F6F2', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  contactBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 11, color: colors.muted, fontSize: 14, lineHeight: 22 },
  actions: { marginTop: 20 },
  actionCard: { minHeight: 94, marginBottom: 11, padding: 15, flexDirection: 'row', alignItems: 'center', borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  cardPressed: { opacity: 0.78 },
  actionIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  callIcon: { backgroundColor: colors.leaf },
  actionCopy: { flex: 1, marginHorizontal: 13 },
  actionLabel: { color: colors.leaf, fontSize: 9, fontWeight: '800', letterSpacing: 0.9 },
  actionTitle: { marginTop: 5, color: colors.ink, fontSize: 15, fontWeight: '800' },
  actionHint: { marginTop: 4, color: colors.muted, fontSize: 12 },
  locationHeading: { marginTop: 20 },
  contentTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  contentSubtitle: { marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 18 },
  locationCard: { marginTop: 14, overflow: 'hidden', borderRadius: 21, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  mapArtwork: { height: 145, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCE9DF' },
  mapLineOne: { position: 'absolute', width: '130%', height: 16, backgroundColor: '#F6F4EC', transform: [{ rotate: '-16deg' }] },
  mapLineTwo: { position: 'absolute', width: '120%', height: 10, top: 27, backgroundColor: '#C4D8C9', transform: [{ rotate: '12deg' }] },
  mapLineThree: { position: 'absolute', width: '100%', height: 8, bottom: 22, backgroundColor: '#C4D8C9', transform: [{ rotate: '20deg' }] },
  mapPin: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.leaf, borderWidth: 4, borderColor: colors.white, shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  locationCopy: { padding: 18 },
  locationName: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  address: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 21 },
  directionsButton: { minHeight: 48, marginTop: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colors.forest },
  directionsText: { marginLeft: 8, color: colors.white, fontSize: 14, fontWeight: '800' },
  officialNote: { marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, backgroundColor: colors.sage },
  officialNoteCopy: { flex: 1, marginLeft: 10 },
  officialNoteTitle: { color: colors.forest, fontSize: 13, fontWeight: '800' },
  officialNoteText: { marginTop: 4, color: colors.forest, fontSize: 12, lineHeight: 18 },
});
