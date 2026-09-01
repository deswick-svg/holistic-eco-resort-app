import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const heroImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Ayurvedic_wellness_center_2-11';

const wellnessGalleryImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Ayurvedic_wellness_center_11';

const singleTherapyImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_0%2Cw_1080%2Ch_1080%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_825%2Cf_auto%2Cc_fit/holistic-eco-resort-kannur/holistic_website_%283%29_6f88817b';

const ayurPackImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_0%2Cw_1080%2Ch_1080%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_825%2Cf_auto%2Cc_fit/holistic-eco-resort-kannur/holistic_website_%284%29_547dc7f2';

const therapies = [
  { name: 'Abhyangam & Nasyam', description: 'Nasal cleansing with medicated oil.' },
  { name: 'Njavarakizhi', description: 'Massage using warm rice pudding in muslin cloth.' },
  { name: 'Pizhichil', description: 'Warm medicated oil poured over the body.' },
  { name: 'Shirodhara', description: 'A continuous stream of medicated oil on the forehead.' },
  { name: 'Herbal Steam Bath', description: 'Steam therapy using herbal infusions.' },
  { name: 'Facial Treatment', description: 'Herbal rejuvenation for skin care.' },
] as const;

async function openContact(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) throw new Error('Unsupported link');
    await Linking.openURL(url);
  } catch {
    Alert.alert('Unable to open', 'Please contact the resort at booking@holisticstay.in.');
  }
}

export function SpaScreen({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const [expandedTherapy, setExpandedTherapy] = useState<string | null>(null);
  const serviceCardWidth = Math.min(Math.max(width - 64, 276), 480);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Ayurvedic Spa</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: heroImage }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(4,24,15,0.06)', 'rgba(4,24,15,0.86)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>TRADITION · NATURE · SLOW LIVING</Text>
            <Text style={styles.heroTitle}>Ayurvedic wellness, naturally</Text>
            <Text style={styles.heroSubtitle}>
              A peaceful wellness experience rooted in traditional Ayurveda and natural living.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>WELLNESS IN KANNUR</Text>
              <Text style={styles.sectionTitle}>Care shaped around you</Text>
            </View>
            <View style={styles.lotusBadge}>
              <Ionicons name="leaf-outline" size={27} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Holistic Eco-Resort documents personalised therapies, guided yoga and meditation in a setting
            designed to work in harmony with nature.
          </Text>

          <View style={styles.experienceStrip}>
            {[
              ['body-outline', 'Therapies'],
              ['fitness-outline', 'Yoga'],
              ['sparkles-outline', 'Meditation'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.experienceItem}>
                <View style={styles.experienceIcon}>
                  <Ionicons name={icon as any} size={20} color={colors.forest} />
                </View>
                <Text style={styles.experienceLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.contentHeading}>
            <Text style={styles.contentTitle}>Wellness pathways</Text>
            <Text style={styles.contentSubtitle}>Two experiences documented by the resort</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={serviceCardWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={styles.serviceTrack}
        >
          <View style={[styles.serviceCard, { width: serviceCardWidth }]}>
            <Image source={{ uri: singleTherapyImage }} style={styles.serviceImage} resizeMode="cover" />
            <View style={styles.serviceCopy}>
              <View style={styles.serviceIcon}>
                <Ionicons name="flower-outline" size={21} color={colors.forest} />
              </View>
              <Text style={styles.serviceTitle}>Single Therapy</Text>
              <Text style={styles.serviceText}>Choose one treatment for a specific concern or personal goal.</Text>
            </View>
          </View>
          <View style={[styles.serviceCard, { width: serviceCardWidth }]}>
            <Image source={{ uri: ayurPackImage }} style={styles.serviceImage} resizeMode="cover" />
            <View style={styles.serviceCopy}>
              <View style={styles.serviceIcon}>
                <Ionicons name="layers-outline" size={21} color={colors.forest} />
              </View>
              <Text style={styles.serviceTitle}>Holistic Ayur Pack</Text>
              <Text style={styles.serviceText}>Multi-session care combining therapies, yoga and clean meals.</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.body}>
          <View style={styles.contentHeading}>
            <Text style={styles.contentTitle}>Documented therapies</Text>
            <Text style={styles.contentSubtitle}>Tap a therapy to see the resort’s neutral description</Text>
          </View>
          <View style={styles.therapyList}>
            {therapies.map((therapy) => {
              const expanded = expandedTherapy === therapy.name;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  key={therapy.name}
                  onPress={() => setExpandedTherapy(expanded ? null : therapy.name)}
                  style={[styles.therapyCard, expanded && styles.therapyCardExpanded]}
                >
                  <View style={styles.therapyRow}>
                    <View style={[styles.therapyDot, expanded && styles.therapyDotExpanded]} />
                    <Text style={styles.therapyName}>{therapy.name}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.leaf}
                    />
                  </View>
                  {expanded ? <Text style={styles.therapyDescription}>{therapy.description}</Text> : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.galleryHeading}>
            <Text style={styles.contentTitle}>A setting for slow living</Text>
            <Text style={styles.contentSubtitle}>From the resort’s official Ayurvedic Wellness Center gallery</Text>
          </View>
          <Image source={{ uri: wellnessGalleryImage }} style={styles.galleryImage} resizeMode="cover" />

          <View style={styles.principlesCard}>
            <Text style={styles.principlesEyebrow}>THE HOLISTIC SETTING</Text>
            <Text style={styles.principlesTitle}>Stay well, eat well, live simply</Text>
            <Text style={styles.principlesText}>
              The resort pairs its wellness setting with peaceful spaces, nature and vegetarian meals prepared
              daily using local, organic ingredients.
            </Text>
            <View style={styles.principleRows}>
              {[
                ['leaf-outline', 'Traditional Ayurveda'],
                ['restaurant-outline', 'Ayurvedic-principled meals'],
                ['partly-sunny-outline', 'Peaceful natural setting'],
              ].map(([icon, label]) => (
                <View key={label} style={styles.principleRow}>
                  <Ionicons name={icon as any} size={18} color="#CFE0D2" />
                  <Text style={styles.principleLabel}>{label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={23} color={colors.forest} />
            <Text style={styles.noteText}>
              Treatment choice is personal. Contact the wellness team for current information and an appropriate
              discussion before arranging a therapy.
            </Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactEyebrow}>WELLNESS ENQUIRIES</Text>
            <Text style={styles.contactTitle}>Speak with the resort</Text>
            <Text style={styles.contactCopy}>
              Ask the Holistic Eco-Resort team about its documented therapies and wellness experiences.
            </Text>
            <View style={styles.contactActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => openContact('tel:+919495850389')}
                style={styles.callButton}
              >
                <Ionicons name="call-outline" size={18} color={colors.white} />
                <Text style={styles.callButtonText}>Call resort</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => openContact('mailto:booking@holisticstay.in?subject=Ayurvedic%20wellness%20enquiry')}
                style={styles.emailButton}
              >
                <Ionicons name="mail-outline" size={18} color={colors.forest} />
                <Text style={styles.emailButtonText}>Email</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: {
    height: 52,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  scrollContent: { paddingBottom: 42 },
  hero: { height: 390, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 28 },
  eyebrow: { color: '#E4EBDD', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 350, color: colors.white, fontSize: 35, lineHeight: 41, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 340, color: '#F3F6F2', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  lotusBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 13, color: colors.muted, fontSize: 15, lineHeight: 24 },
  experienceStrip: {
    marginTop: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  experienceItem: { flex: 1, alignItems: 'center' },
  experienceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  experienceLabel: { marginTop: 6, color: colors.ink, fontSize: 11, fontWeight: '700' },
  contentHeading: { marginTop: 30 },
  contentTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  contentSubtitle: { marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 18 },
  serviceTrack: { paddingHorizontal: 20, paddingTop: 14, paddingRight: 32 },
  serviceCard: { marginRight: 12, overflow: 'hidden', borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  serviceImage: { width: '100%', height: 190, backgroundColor: colors.sage },
  serviceCopy: { padding: 17, paddingTop: 30 },
  serviceIcon: { position: 'absolute', top: -22, left: 17, width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage, borderWidth: 3, borderColor: colors.white },
  serviceTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' },
  serviceText: { marginTop: 6, color: colors.muted, fontSize: 13, lineHeight: 20 },
  therapyList: { marginTop: 14 },
  therapyCard: { marginBottom: 9, padding: 15, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  therapyCardExpanded: { borderColor: '#B8D2BF' },
  therapyRow: { flexDirection: 'row', alignItems: 'center' },
  therapyDot: { width: 9, height: 9, marginRight: 11, borderRadius: 5, backgroundColor: '#BDD3C2' },
  therapyDotExpanded: { backgroundColor: colors.leaf },
  therapyName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: '800' },
  therapyDescription: { marginTop: 10, marginLeft: 20, color: colors.muted, fontSize: 13, lineHeight: 19 },
  galleryHeading: { marginTop: 21 },
  galleryImage: { width: '100%', height: 235, marginTop: 14, borderRadius: 20, backgroundColor: colors.sage },
  principlesCard: { marginTop: 24, padding: 21, borderRadius: 21, backgroundColor: colors.forest },
  principlesEyebrow: { color: '#CFE0D2', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  principlesTitle: { marginTop: 7, color: colors.white, fontSize: 23, lineHeight: 29, fontWeight: '800' },
  principlesText: { marginTop: 8, color: '#E5EEE7', fontSize: 14, lineHeight: 21 },
  principleRows: { marginTop: 16 },
  principleRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center' },
  principleLabel: { marginLeft: 9, color: colors.white, fontSize: 13, fontWeight: '600' },
  noteCard: { marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, backgroundColor: colors.sage },
  noteText: { flex: 1, marginLeft: 10, color: colors.forest, fontSize: 13, lineHeight: 19 },
  contactCard: { marginTop: 28, padding: 21, borderRadius: 21, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  contactEyebrow: { color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  contactTitle: { marginTop: 7, color: colors.ink, fontSize: 23, fontWeight: '800' },
  contactCopy: { marginTop: 8, color: colors.muted, fontSize: 14, lineHeight: 21 },
  contactActions: { marginTop: 18, flexDirection: 'row' },
  callButton: { flex: 1, minHeight: 48, marginRight: 9, paddingHorizontal: 14, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.leaf },
  callButtonText: { marginLeft: 8, color: colors.white, fontSize: 14, fontWeight: '800' },
  emailButton: { minWidth: 108, minHeight: 48, paddingHorizontal: 15, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  emailButtonText: { marginLeft: 7, color: colors.forest, fontSize: 14, fontWeight: '800' },
});
