import React from 'react';
import { Alert, Image, ImageBackground, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const googleProfileUrl =
  'https://www.google.com/travel/hotels/entity/ChoIp9mricLmmbngARoNL2cvMTFwOW10YjNmMBAB';
const tripAdvisorProfileUrl =
  'https://www.tripadvisor.com/Hotel_Review-g9734133-d23707221-Reviews-Holistic_Eco_Resort-Taliparamba_Kannur_District_Kerala.html';

async function openReviewProfile(url: string, platformName: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('Unsupported link');
    }
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', `The ${platformName} review page could not be opened on this device.`);
  }
}

const reviewOptions = [
  {
    name: 'Google',
    title: 'Review us on Google',
    description: 'Open the verified Google profile for Holistic Eco-Resort.',
    icon: 'logo-google',
    url: googleProfileUrl,
    color: '#356B50',
    tint: '#E5F0E9',
  },
  {
    name: 'TripAdvisor',
    title: 'Review us on TripAdvisor',
    description: 'Open the verified TripAdvisor profile for Holistic Eco-Resort.',
    icon: 'glasses-outline',
    url: tripAdvisorProfileUrl,
    color: '#1A6B5A',
    tint: '#E1F0EC',
  },
] as const;

export function ReviewScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Review Us</Text>
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
            <Text style={styles.eyebrow}>SHARE YOUR EXPERIENCE</Text>
            <Text style={styles.heroTitle}>Your story, in your own words</Text>
            <Text style={styles.heroSubtitle}>Choose a verified platform if you would like to leave a review.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>THANK YOU FOR VISITING</Text>
              <Text style={styles.sectionTitle}>Share your stay</Text>
            </View>
            <View style={styles.heartBadge}>
              <Ionicons name="heart-outline" size={25} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Reviews are entirely voluntary. If you choose to leave one, please share an honest account of your
            genuine experience at Holistic Eco-Resort.
          </Text>

          <View style={styles.optionList}>
            {reviewOptions.map((option) => (
              <View key={option.name} style={styles.reviewCard}>
                <View style={[styles.platformPanel, { backgroundColor: option.tint }]}>
                  <View style={[styles.platformIcon, { backgroundColor: option.color }]}>
                    <Ionicons name={option.icon} size={28} color={colors.white} />
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.leaf} />
                    <Text style={styles.verifiedText}>VERIFIED PROFILE</Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{option.title}</Text>
                  <Text style={styles.cardDescription}>{option.description}</Text>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={option.title}
                    onPress={() => openReviewProfile(option.url, option.name)}
                    style={({ pressed }) => [styles.reviewButton, { backgroundColor: option.color }, pressed && styles.pressed]}
                  >
                    <Text style={styles.reviewButtonText}>Open {option.name}</Text>
                    <Ionicons name="open-outline" size={18} color={colors.white} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.promiseCard}>
            <View style={styles.promiseIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.forest} />
            </View>
            <View style={styles.promiseCopy}>
              <Text style={styles.promiseTitle}>Your review is yours</Text>
              <Text style={styles.promiseText}>
                The app does not pre-fill wording, select a rating, or offer an incentive. You decide whether and
                what to share directly on the review platform.
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
  hero: { height: 365, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 27 },
  eyebrow: { color: '#D6E4D8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 345, color: colors.white, fontSize: 34, lineHeight: 40, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 335, color: '#E9F0EA', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  heartBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 22 },
  optionList: { marginTop: 22 },
  reviewCard: { marginBottom: 15, overflow: 'hidden', borderRadius: 21, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  platformPanel: { height: 94, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  platformIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { paddingHorizontal: 10, height: 30, borderRadius: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white },
  verifiedText: { marginLeft: 5, color: colors.leaf, fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  cardBody: { padding: 17 },
  cardTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  cardDescription: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 20 },
  reviewButton: { marginTop: 15, minHeight: 48, paddingHorizontal: 16, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewButtonText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.76 },
  promiseCard: { marginTop: 2, padding: 16, flexDirection: 'row', borderRadius: 18, backgroundColor: colors.sage },
  promiseIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  promiseCopy: { flex: 1, marginLeft: 12 },
  promiseTitle: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  promiseText: { marginTop: 4, color: colors.forest2, fontSize: 12, lineHeight: 18 },
});
