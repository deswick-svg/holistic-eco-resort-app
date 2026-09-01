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
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_218%2Cw_4176%2Ch_2349%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/230A9475_lzcmdv';

const jeepImage =
  'https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3333/x_834%2Cy_0%2Cw_3333%2Ch_3333%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_825%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Jeep_Ride_xq6mfy';

const activityGroups = [
  {
    id: 'waterfall',
    icon: 'water-outline',
    title: 'Waterfall & nature',
    summary: 'Private waterfall, jungle ponds, nature walks and bird watching.',
    details:
      'A hidden pathway leads to the resort’s private waterfall. The official activity list also includes two jungle ponds, nature walks and bird watching.',
  },
  {
    id: 'adventure',
    icon: 'trail-sign-outline',
    title: 'Rope adventures',
    summary: 'Burma Bridge, valley crossing, zipline, commando net and rope balancing.',
    details:
      'Take on the Burma Bridge, valley crossing, commando net, rope balancing and the zipline across the ravine. Target shooting is also listed by the resort.',
  },
  {
    id: 'farm',
    icon: 'leaf-outline',
    title: 'Farm experiences',
    summary: 'Organic farming, honey bee farming and the animal and bird farm tour.',
    details:
      'Explore organic farming, the honey bee farm and the animal and bird farm tour. The resort describes bee-keeping as a tradition kept alive by its bee keepers.',
  },
  {
    id: 'trails',
    icon: 'walk-outline',
    title: 'Trails & jeep ride',
    summary: 'Walkable trekking and an off-road jeep ride through the landscape.',
    details:
      'The resort lists walkable trekking alongside its off-road jeep ride, offering two different ways to experience the surrounding terrain.',
  },
  {
    id: 'family',
    icon: 'happy-outline',
    title: 'Family play',
    summary: 'Dinosaur Park, kids trampoline, carroms and badminton.',
    details:
      'The Jurassic-era themed Dinosaur Park adds a fun element for younger guests. The official list also includes a kids trampoline, carroms and a badminton court.',
  },
  {
    id: 'leisure',
    icon: 'sunny-outline',
    title: 'Pool & campsite',
    summary: 'Infinity swimming pool and campsite recreation activities.',
    details:
      'Slow the pace at the infinity swimming pool or explore the campsite recreation activities mentioned in the resort’s day-visit experience.',
  },
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

export function ActivitiesScreen({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const [expandedId, setExpandedId] = useState<string | null>('waterfall');
  const compact = width < 360;

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Activities</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: heroImage }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(4,24,15,0.04)', 'rgba(4,24,15,0.84)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ADVENTURE · NATURE · DISCOVERY</Text>
            <Text style={styles.heroTitle}>Experience the outdoors</Text>
            <Text style={styles.heroSubtitle}>
              From forest walks and a private waterfall to rope challenges and farm experiences.
            </Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>EXPLORE HOLISTIC</Text>
              <Text style={styles.sectionTitle}>Something for every pace</Text>
            </View>
            <View style={styles.compassBadge}>
              <Ionicons name="compass-outline" size={27} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Reconnect with the landscape through nature, adventure, farm and family experiences genuinely
            offered by Holistic Eco-Resort.
          </Text>

          <View style={[styles.quickStrip, compact && styles.quickStripCompact]}>
            {[
              ['water-outline', 'Nature'],
              ['trail-sign-outline', 'Adventure'],
              ['leaf-outline', 'Farm'],
            ].map(([icon, label]) => (
              <View key={label} style={styles.quickItem}>
                <Ionicons name={icon as any} size={19} color={colors.forest} />
                <Text style={styles.quickText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.headingRow}>
            <View style={styles.headingCopy}>
              <Text style={styles.contentTitle}>Explore activities</Text>
              <Text style={styles.contentSubtitle}>Tap a card for more information</Text>
            </View>
            <Text style={styles.activityCount}>{activityGroups.length} groups</Text>
          </View>

          <View style={styles.activityList}>
            {activityGroups.map((activity) => {
              const expanded = expandedId === activity.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded }}
                  key={activity.id}
                  onPress={() => setExpandedId(expanded ? null : activity.id)}
                  style={[styles.activityCard, expanded && styles.activityCardExpanded]}
                >
                  <View style={styles.activityTopRow}>
                    <View style={[styles.activityIcon, expanded && styles.activityIconExpanded]}>
                      <Ionicons name={activity.icon} size={23} color={expanded ? colors.white : colors.forest} />
                    </View>
                    <View style={styles.activityCopy}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySummary}>{activity.summary}</Text>
                    </View>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={19}
                      color={colors.leaf}
                    />
                  </View>
                  {expanded ? (
                    <View style={styles.detailsWrap}>
                      <Text style={styles.detailsText}>{activity.details}</Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.featureHeading}>
            <Text style={styles.contentTitle}>Go beyond the trail</Text>
            <Text style={styles.contentSubtitle}>An official glimpse of the resort’s off-road experience</Text>
          </View>
          <ImageBackground source={{ uri: jeepImage }} style={styles.featureImage} imageStyle={styles.featureImageRadius}>
            <LinearGradient colors={['transparent', 'rgba(4,24,15,0.8)']} style={styles.featureShade} />
            <View style={styles.featureCopy}>
              <View style={styles.featureBadge}>
                <Ionicons name="car-sport-outline" size={16} color={colors.forest} />
                <Text style={styles.featureBadgeText}>OFF-ROAD JEEP RIDE</Text>
              </View>
              <Text style={styles.featureTitle}>A different view of the landscape</Text>
            </View>
          </ImageBackground>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={23} color={colors.forest} />
            <Text style={styles.noteText}>
              Activity access and arrangements can vary. Contact the resort directly for current information.
            </Text>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactEyebrow}>ACTIVITY ENQUIRIES</Text>
            <Text style={styles.contactTitle}>Plan your experience</Text>
            <Text style={styles.contactCopy}>
              Ask the Holistic Eco-Resort team about the activities you would like to explore during your visit.
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
                onPress={() => openContact('mailto:booking@holisticstay.in?subject=Activity%20enquiry')}
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
  eyebrow: { color: '#E4EBDD', fontSize: 11, fontWeight: '800', letterSpacing: 1.25 },
  heroTitle: { marginTop: 7, maxWidth: 340, color: colors.white, fontSize: 35, lineHeight: 41, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 340, color: '#F3F6F2', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  compassBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 13, color: colors.muted, fontSize: 15, lineHeight: 24 },
  quickStrip: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  quickStripCompact: { paddingHorizontal: 4 },
  quickItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  quickText: { marginLeft: 6, color: colors.ink, fontSize: 12, fontWeight: '700' },
  headingRow: { marginTop: 30, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  headingCopy: { flex: 1 },
  contentTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  contentSubtitle: { marginTop: 4, color: colors.muted, fontSize: 12, lineHeight: 18 },
  activityCount: { marginLeft: 12, marginBottom: 2, color: colors.leaf, fontSize: 12, fontWeight: '800' },
  activityList: { marginTop: 14 },
  activityCard: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  activityCardExpanded: { borderColor: '#B8D2BF' },
  activityTopRow: { flexDirection: 'row', alignItems: 'center' },
  activityIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  activityIconExpanded: { backgroundColor: colors.leaf },
  activityCopy: { flex: 1, marginHorizontal: 13 },
  activityTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  activitySummary: { marginTop: 4, color: colors.muted, fontSize: 13, lineHeight: 19 },
  detailsWrap: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  detailsText: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  featureHeading: { marginTop: 21 },
  featureImage: { height: 280, marginTop: 14, justifyContent: 'flex-end', overflow: 'hidden' },
  featureImageRadius: { borderRadius: 20 },
  featureShade: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  featureCopy: { padding: 18 },
  featureBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', borderRadius: 20, backgroundColor: '#EAF2EC' },
  featureBadgeText: { marginLeft: 6, color: colors.forest, fontSize: 10, fontWeight: '800', letterSpacing: 0.7 },
  featureTitle: { marginTop: 10, maxWidth: 280, color: colors.white, fontSize: 23, lineHeight: 28, fontWeight: '800' },
  noteCard: { marginTop: 16, padding: 15, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, backgroundColor: colors.sage },
  noteText: { flex: 1, marginLeft: 10, color: colors.forest, fontSize: 13, lineHeight: 19 },
  contactCard: { marginTop: 28, padding: 21, borderRadius: 21, backgroundColor: colors.forest },
  contactEyebrow: { color: '#CFE0D2', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  contactTitle: { marginTop: 7, color: colors.white, fontSize: 23, fontWeight: '800' },
  contactCopy: { marginTop: 8, color: '#E5EEE7', fontSize: 14, lineHeight: 21 },
  contactActions: { marginTop: 18, flexDirection: 'row' },
  callButton: {
    flex: 1,
    minHeight: 48,
    marginRight: 9,
    paddingHorizontal: 14,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.leaf,
  },
  callButtonText: { marginLeft: 8, color: colors.white, fontSize: 14, fontWeight: '800' },
  emailButton: {
    minWidth: 108,
    minHeight: 48,
    paddingHorizontal: 15,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  emailButtonText: { marginLeft: 7, color: colors.forest, fontSize: 14, fontWeight: '800' },
});
