import React, { useState } from 'react';
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';

const receptionImage =
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_1237%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Front_Elevation-2_g2atok';

const propertyAreas = [
  {
    id: 'reception',
    title: 'Reception',
    label: 'ARRIVAL & ASSISTANCE',
    icon: 'help-buoy-outline',
    summary: 'The resort’s official contact page identifies and photographs the reception facade.',
  },
  {
    id: 'stays',
    title: 'Accommodation',
    label: 'STAY AREAS',
    icon: 'bed-outline',
    summary: 'The property offers its officially published range of rooms, suites, villas and nature stays.',
  },
  {
    id: 'dining',
    title: 'Mom’s Kitchen',
    label: 'DINING',
    icon: 'restaurant-outline',
    summary: 'The resort’s official dining venue serves its documented freshly prepared Indian meals.',
  },
  {
    id: 'wellness',
    title: 'Ayurvedic Wellness Centre',
    label: 'WELLNESS',
    icon: 'leaf-outline',
    summary: 'A dedicated Ayurvedic wellness setting documented by the resort on its official website.',
  },
  {
    id: 'pool-meeting',
    title: 'Pool & open-air meeting space',
    label: 'LEISURE & GATHERINGS',
    icon: 'water-outline',
    summary: 'The official resort overview documents an infinity pool and an open meeting area.',
  },
  {
    id: 'nature-activities',
    title: 'Nature & activity areas',
    label: 'OUTDOOR EXPERIENCES',
    icon: 'trail-sign-outline',
    summary: 'Official resort material documents a private waterfall, jungle ponds and outdoor activities.',
  },
] as const;

export function PropertyMapScreen({ onBack }: { onBack: () => void }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Property Map</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: receptionImage }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(3,25,16,0.1)', 'rgba(3,25,16,0.88)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>YOUR ON-PROPERTY GUIDE</Text>
            <Text style={styles.heroTitle}>Find your resort experience</Text>
            <Text style={styles.heroSubtitle}>A guide to officially documented areas at Holistic Eco-Resort.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.notice}>
            <View style={styles.noticeIcon}>
              <Ionicons name="information-circle-outline" size={23} color={colors.forest} />
            </View>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Property guide</Text>
              <Text style={styles.noticeText}>
                An official site plan is not currently published. This guide lists verified resort areas without
                implying their position, distance or walking route.
              </Text>
            </View>
          </View>

          <View style={styles.headingRow}>
            <View>
              <Text style={styles.sectionEyebrow}>AROUND THE PROPERTY</Text>
              <Text style={styles.sectionTitle}>Places at the resort</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{propertyAreas.length}</Text>
            </View>
          </View>

          <Text style={styles.introText}>Tap an area to view its verified description.</Text>

          <View style={styles.areaList}>
            {propertyAreas.map((area, index) => {
              const expanded = expandedId === area.id;
              return (
                <Pressable
                  key={area.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${area.title}. ${expanded ? 'Hide' : 'Show'} information`}
                  onPress={() => setExpandedId(expanded ? null : area.id)}
                  style={({ pressed }) => [styles.areaCard, expanded && styles.areaCardExpanded, pressed && styles.pressed]}
                >
                  <View style={styles.areaTopRow}>
                    <View style={[styles.areaIcon, expanded && styles.areaIconExpanded]}>
                      <Ionicons name={area.icon} size={23} color={expanded ? colors.white : colors.forest} />
                    </View>
                    <View style={styles.areaHeading}>
                      <Text style={styles.areaLabel}>{area.label}</Text>
                      <Text style={styles.areaTitle}>{area.title}</Text>
                    </View>
                    <Text style={styles.areaNumber}>{String(index + 1).padStart(2, '0')}</Text>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color={colors.muted} />
                  </View>
                  {expanded ? (
                    <View style={styles.areaDetails}>
                      <Text style={styles.areaSummary}>{area.summary}</Text>
                      <View style={styles.verifiedRow}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.leaf} />
                        <Text style={styles.verifiedText}>Verified from official resort material</Text>
                      </View>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.helpCard}>
            <Ionicons name="navigate-circle-outline" size={31} color="#CFE0D2" />
            <View style={styles.helpCopy}>
              <Text style={styles.helpTitle}>Need directions on property?</Text>
              <Text style={styles.helpText}>Please ask the resort team at reception for current on-site directions.</Text>
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
  notice: { marginTop: 22, padding: 15, flexDirection: 'row', borderRadius: 18, backgroundColor: colors.sage, borderWidth: 1, borderColor: '#D7E5D9' },
  noticeIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  noticeCopy: { flex: 1, marginLeft: 12 },
  noticeTitle: { color: colors.forest, fontSize: 14, fontWeight: '800' },
  noticeText: { marginTop: 4, color: colors.forest2, fontSize: 12, lineHeight: 18 },
  headingRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionEyebrow: { color: colors.leaf, fontSize: 10, fontWeight: '800', letterSpacing: 1.15 },
  sectionTitle: { marginTop: 6, color: colors.ink, fontSize: 25, lineHeight: 31, fontWeight: '800' },
  countBadge: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest },
  countText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  introText: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 19 },
  areaList: { marginTop: 15 },
  areaCard: { marginBottom: 11, padding: 15, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  areaCardExpanded: { borderColor: '#B7D2BE' },
  areaTopRow: { flexDirection: 'row', alignItems: 'center' },
  areaIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  areaIconExpanded: { backgroundColor: colors.leaf },
  areaHeading: { flex: 1, marginHorizontal: 12 },
  areaLabel: { color: colors.leaf, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  areaTitle: { marginTop: 3, color: colors.ink, fontSize: 15, lineHeight: 20, fontWeight: '800' },
  areaNumber: { marginRight: 9, color: '#A5AEA8', fontSize: 11, fontWeight: '800' },
  areaDetails: { marginTop: 14, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  areaSummary: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  verifiedRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  verifiedText: { marginLeft: 6, color: colors.leaf, fontSize: 10, fontWeight: '700' },
  pressed: { opacity: 0.76 },
  helpCard: { marginTop: 5, padding: 18, flexDirection: 'row', alignItems: 'center', borderRadius: 19, backgroundColor: colors.forest },
  helpCopy: { flex: 1, marginLeft: 13 },
  helpTitle: { color: colors.white, fontSize: 15, fontWeight: '800' },
  helpText: { marginTop: 4, color: '#D5E3D8', fontSize: 12, lineHeight: 18 },
});
