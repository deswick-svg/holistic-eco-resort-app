import React from 'react';
import {
  Alert,
  Image,
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

const attractions = [
  {
    name: 'St. Angelo’s Fort',
    mapQuery: 'St. Angelo Fort, Kannur, Kerala',
    icon: 'business-outline',
    category: 'HISTORY & COAST',
    description:
      'A historic laterite fort overlooking the sea, also known as Kannur Fort. Kerala Tourism identifies it as a protected monument under the Archaeological Survey of India.',
    verification: 'Listed by Holistic Eco-Resort · Verified by Kerala Tourism',
    sourceUrl: 'https://www.keralatourism.org/malabar/st-angelos-fort/105',
    accent: '#315F50',
    tint: '#E4EEE8',
  },
  {
    name: 'Muzhappilangad Drive-in Beach',
    mapQuery: 'Muzhappilangad Drive-in Beach, Kannur, Kerala',
    icon: 'car-sport-outline',
    category: 'BEACH & COAST',
    description:
      'Kerala’s drive-in beach, with a firm shoreline where vehicles can travel along the sand. Kerala Tourism also documents the natural black rocks along the shore.',
    verification: 'Listed by Holistic Eco-Resort · Verified by Kerala Tourism',
    sourceUrl: 'https://www.keralatourism.org/malabar/muzhappilangad-beach/115',
    accent: '#376C78',
    tint: '#E2EFF1',
  },
  {
    name: 'Arakkal Kettu Museum',
    mapQuery: 'Arakkal Kettu Museum, Ayikkara, Kannur, Kerala',
    icon: 'library-outline',
    category: 'MUSEUM & HERITAGE',
    description:
      'A government museum within the Arakkal Kettu at Ayikkara, presenting the history and maritime connections of the Arakkal Ali Rajas.',
    verification: 'Listed as Arakkal Museum by the resort · Verified by Kerala Tourism',
    sourceUrl: 'https://www.keralatourism.org/destination/arakkal-kettu-museum-kannur/84/',
    accent: '#80613E',
    tint: '#F1EADF',
  },
  {
    name: 'Parassinikkadavu Snake Park',
    mapQuery: 'Parassinikkadavu Snake Park, Kannur, Kerala',
    icon: 'leaf-outline',
    category: 'VISITOR ATTRACTION',
    description:
      'A visitor attraction at Parassinikkadavu included in Holistic Eco-Resort’s nearby-attractions guide and referenced by Kerala Tourism.',
    verification: 'Listed by Holistic Eco-Resort · Referenced by Kerala Tourism',
    sourceUrl: 'https://www.keralatourism.org/newsletter/news/2022/kerala-cuisine-contest-2020/2091',
    accent: '#4D6B38',
    tint: '#E8EFE1',
  },
] as const;

async function openExternal(url: string, fallbackMessage: string, fallbackUrl?: string) {
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

function openInMaps(query: string) {
  const encodedQuery = encodeURIComponent(query);
  const nativeUrl =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${encodedQuery}`
      : `geo:0,0?q=${encodedQuery}`;
  const fallbackUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
  return openExternal(nativeUrl, `Please search maps for ${query}.`, fallbackUrl);
}

export function LocalAttractionsScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Local Attractions</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <LinearGradient colors={['#184833', '#092D20']} style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.hillBack} />
          <View style={styles.hillFront} />
          <View style={styles.routeLine} />
          <View style={styles.routePin}>
            <Ionicons name="location" size={21} color={colors.white} />
          </View>
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>EXPLORE AROUND KANNUR</Text>
            <Text style={styles.heroTitle}>Places worth discovering</Text>
            <Text style={styles.heroSubtitle}>A carefully verified guide to attractions listed by the resort.</Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>BEYOND THE RESORT</Text>
              <Text style={styles.sectionTitle}>Explore nearby</Text>
            </View>
            <View style={styles.compassBadge}>
              <Ionicons name="compass-outline" size={27} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            These destinations appear in Holistic Eco-Resort’s official location guide and have been checked
            against official public tourism sources.
          </Text>

          <View style={styles.sourceLegend}>
            <View style={styles.legendItem}>
              <Ionicons name="home-outline" size={18} color={colors.forest} />
              <Text style={styles.legendText}>Resort-listed</Text>
            </View>
            <View style={styles.legendDivider} />
            <View style={styles.legendItem}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.forest} />
              <Text style={styles.legendText}>Externally verified</Text>
            </View>
          </View>

          <View style={styles.listHeading}>
            <Text style={styles.contentTitle}>Attractions</Text>
            <Text style={styles.countText}>{attractions.length} verified places</Text>
          </View>

          <View style={styles.attractionList}>
            {attractions.map((attraction, index) => (
              <View key={attraction.name} style={styles.attractionCard}>
                <View style={[styles.cardTop, { backgroundColor: attraction.tint }]}>
                  <View style={[styles.numberBadge, { backgroundColor: attraction.accent }]}>
                    <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
                  </View>
                  <View style={[styles.attractionIcon, { backgroundColor: attraction.accent }]}>
                    <Ionicons name={attraction.icon} size={27} color={colors.white} />
                  </View>
                  <Text style={[styles.categoryText, { color: attraction.accent }]}>{attraction.category}</Text>
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.attractionName}>{attraction.name}</Text>
                  <Text style={styles.description}>{attraction.description}</Text>

                  <View style={styles.verificationRow}>
                    <Ionicons name="checkmark-circle" size={17} color={colors.leaf} />
                    <Text style={styles.verificationText}>{attraction.verification}</Text>
                  </View>

                  <View style={styles.cardActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${attraction.name} in maps`}
                      onPress={() => openInMaps(attraction.mapQuery)}
                      style={({ pressed }) => [styles.mapsButton, pressed && styles.buttonPressed]}
                    >
                      <Ionicons name="navigate-outline" size={18} color={colors.white} />
                      <Text style={styles.mapsButtonText}>Open in Maps</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="link"
                      accessibilityLabel={`Read official information about ${attraction.name}`}
                      onPress={() => openExternal(attraction.sourceUrl, 'The official tourism page could not be opened.')}
                      style={({ pressed }) => [styles.sourceButton, pressed && styles.buttonPressed]}
                    >
                      <Ionicons name="open-outline" size={17} color={colors.forest} />
                      <Text style={styles.sourceButtonText}>Official source</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={23} color={colors.forest} />
            <Text style={styles.noteText}>
              Routes and local conditions can change. Check your maps app and the linked official source before
              setting out. Transport by the resort is not implied.
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
  hero: { height: 375, overflow: 'hidden', justifyContent: 'flex-end' },
  sun: { position: 'absolute', width: 160, height: 160, borderRadius: 80, top: 82, right: -24, backgroundColor: 'rgba(230,238,214,0.11)' },
  hillBack: { position: 'absolute', width: '125%', height: 180, left: -35, bottom: -80, borderRadius: 200, backgroundColor: '#2B6548', transform: [{ rotate: '-5deg' }] },
  hillFront: { position: 'absolute', width: '115%', height: 150, right: -45, bottom: -95, borderRadius: 180, backgroundColor: '#174A34', transform: [{ rotate: '7deg' }] },
  routeLine: { position: 'absolute', width: 145, height: 3, top: 180, right: 18, borderRadius: 2, backgroundColor: 'rgba(231,239,224,0.4)', transform: [{ rotate: '-20deg' }] },
  routePin: { position: 'absolute', top: 137, right: 43, width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.leaf, borderWidth: 3, borderColor: 'rgba(255,255,255,0.8)' },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 28 },
  eyebrow: { color: '#D6E4D8', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, maxWidth: 345, color: colors.white, fontSize: 35, lineHeight: 41, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, maxWidth: 335, color: '#E9F0EA', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  compassBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 11, color: colors.muted, fontSize: 14, lineHeight: 22 },
  sourceLegend: { marginTop: 18, minHeight: 54, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  legendText: { marginLeft: 7, color: colors.ink, fontSize: 11, fontWeight: '700' },
  legendDivider: { width: 1, height: 26, backgroundColor: colors.line },
  listHeading: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  contentTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  countText: { marginBottom: 2, color: colors.leaf, fontSize: 12, fontWeight: '800' },
  attractionList: { marginTop: 14 },
  attractionCard: { marginBottom: 14, overflow: 'hidden', borderRadius: 21, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  cardTop: { height: 104, padding: 15, justifyContent: 'flex-end' },
  numberBadge: { position: 'absolute', top: 12, left: 12, minWidth: 34, height: 25, paddingHorizontal: 8, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  numberText: { color: colors.white, fontSize: 10, fontWeight: '800' },
  attractionIcon: { position: 'absolute', right: 14, top: 14, width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  categoryText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  cardBody: { padding: 17 },
  attractionName: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '800' },
  description: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20 },
  verificationRow: { marginTop: 13, paddingTop: 12, flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  verificationText: { flex: 1, marginLeft: 7, color: colors.leaf, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  cardActions: { marginTop: 15, flexDirection: 'row' },
  mapsButton: { flex: 1, minHeight: 46, marginRight: 8, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.forest },
  mapsButtonText: { marginLeft: 7, color: colors.white, fontSize: 13, fontWeight: '800' },
  sourceButton: { minHeight: 46, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  sourceButtonText: { marginLeft: 6, color: colors.forest, fontSize: 12, fontWeight: '800' },
  buttonPressed: { opacity: 0.76 },
  noteCard: { marginTop: 2, padding: 15, flexDirection: 'row', alignItems: 'flex-start', borderRadius: 16, backgroundColor: colors.sage },
  noteText: { flex: 1, marginLeft: 10, color: colors.forest, fontSize: 12, lineHeight: 18 },
});
