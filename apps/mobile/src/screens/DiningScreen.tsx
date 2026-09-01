import React, { useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
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
  'https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3333/x_0%2Cy_694%2Cw_5000%2Ch_1945%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_1650%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Restaurant_%282%29';

const diningImages = [
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Restaurant_2-11_jptwwe',
  'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Restaurant_1-11_eunu07',
] as const;

const highlights = [
  {
    icon: 'restaurant-outline',
    title: 'Traditional Indian',
    copy: 'Authentic flavours, aromatic curries and biryanis prepared with time-honoured recipes.',
  },
  {
    icon: 'leaf-outline',
    title: 'Fresh ingredients',
    copy: 'Meals are made daily with local vegetables and carefully selected natural spices.',
  },
  {
    icon: 'home-outline',
    title: 'Home-style warmth',
    copy: 'Simple, warm cooking served in a relaxed setting for couples and families.',
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

export function DiningScreen({ onBack }: { onBack: () => void }) {
  const { width } = useWindowDimensions();
  const [activeImage, setActiveImage] = useState(0);
  const galleryWidth = Math.min(Math.max(width - 40, 280), 560);

  const updateGalleryIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActiveImage(Math.round(event.nativeEvent.contentOffset.x / galleryWidth));
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Dining</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: heroImage }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(4,24,15,0.06)', 'rgba(4,24,15,0.82)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>HOLISTIC ECO-RESORT · KANNUR</Text>
            <Text style={styles.heroTitle}>Mom’s Kitchen</Text>
            <Text style={styles.heroSubtitle}>Traditional Indian food with authentic, home-style flavours.</Text>
          </View>
        </ImageBackground>

        <View style={styles.body}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>A NOURISHING TABLE</Text>
              <Text style={styles.sectionTitle}>Fresh food, thoughtfully prepared</Text>
            </View>
            <View style={styles.leafBadge}>
              <Ionicons name="leaf" size={24} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>
            Discover freshly prepared Indian meals rooted in Ayurvedic principles—light, balanced and made
            with local vegetables and natural spices.
          </Text>

          <View style={styles.hoursCard}>
            <View style={styles.hoursIcon}>
              <Ionicons name="time-outline" size={23} color={colors.forest} />
            </View>
            <View style={styles.hoursCopy}>
              <Text style={styles.hoursLabel}>Published dining hours</Text>
              <Text style={styles.hoursValue}>8:00 AM – 9:00 PM</Text>
            </View>
          </View>

          <Text style={styles.contentTitle}>What to expect</Text>
          <View style={styles.highlightList}>
            {highlights.map((item) => (
              <View key={item.title} style={styles.highlightCard}>
                <View style={styles.highlightIcon}>
                  <Ionicons name={item.icon} size={22} color={colors.forest} />
                </View>
                <View style={styles.highlightCopy}>
                  <Text style={styles.highlightTitle}>{item.title}</Text>
                  <Text style={styles.highlightText}>{item.copy}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.galleryHeading}>
            <View>
              <Text style={styles.contentTitle}>The dining experience</Text>
              <Text style={styles.gallerySubtitle}>Moments from the resort’s official gallery</Text>
            </View>
            <Text style={styles.galleryCount}>{activeImage + 1} / {diningImages.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          snapToInterval={galleryWidth}
          onMomentumScrollEnd={updateGalleryIndex}
          contentContainerStyle={styles.galleryTrack}
        >
          {diningImages.map((uri, index) => (
            <Image
              key={uri}
              source={{ uri }}
              accessibilityLabel={`Mom's Kitchen dining photo ${index + 1}`}
              style={[styles.galleryImage, { width: galleryWidth }]}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        <View style={styles.body}>
          <View style={styles.dots}>
            {diningImages.map((uri, index) => (
              <View key={uri} style={[styles.dot, activeImage === index && styles.dotActive]} />
            ))}
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.contactEyebrow}>DINING ENQUIRIES</Text>
            <Text style={styles.contactTitle}>Contact the resort</Text>
            <Text style={styles.contactCopy}>
              For current dining information or a guest request, speak directly with the Holistic Eco-Resort team.
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
                onPress={() => openContact('mailto:booking@holisticstay.in?subject=Dining%20enquiry')}
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
  hero: { height: 385, justifyContent: 'flex-end', backgroundColor: colors.forest },
  heroShade: { ...StyleSheet.absoluteFillObject },
  logo: { position: 'absolute', top: 18, alignSelf: 'center', width: 138, height: 92 },
  heroCopy: { paddingHorizontal: 20, paddingBottom: 28 },
  eyebrow: { color: '#E4EBDD', fontSize: 11, fontWeight: '800', letterSpacing: 1.25 },
  heroTitle: { marginTop: 7, color: colors.white, fontSize: 36, lineHeight: 42, fontWeight: '800' },
  heroSubtitle: { marginTop: 7, maxWidth: 330, color: '#F3F6F2', fontSize: 15, lineHeight: 22 },
  body: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  leafBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 13, color: colors.muted, fontSize: 15, lineHeight: 24 },
  hoursCard: {
    marginTop: 20,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  hoursIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  hoursCopy: { marginLeft: 13 },
  hoursLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  hoursValue: { marginTop: 3, color: colors.ink, fontSize: 16, fontWeight: '800' },
  contentTitle: { marginTop: 30, color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800' },
  highlightList: { marginTop: 13 },
  highlightCard: {
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
  },
  highlightIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  highlightCopy: { flex: 1, marginLeft: 13 },
  highlightTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  highlightText: { marginTop: 4, color: colors.muted, fontSize: 13, lineHeight: 19 },
  galleryHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  gallerySubtitle: { marginTop: 4, color: colors.muted, fontSize: 12 },
  galleryCount: { marginBottom: 2, color: colors.leaf, fontSize: 12, fontWeight: '800' },
  galleryTrack: { paddingHorizontal: 20, marginTop: 14 },
  galleryImage: { height: 230, borderRadius: 20, backgroundColor: colors.sage },
  dots: { marginTop: 13, flexDirection: 'row', justifyContent: 'center' },
  dot: { width: 7, height: 7, marginHorizontal: 4, borderRadius: 4, backgroundColor: '#C9D2CB' },
  dotActive: { width: 22, backgroundColor: colors.leaf },
  contactCard: { marginTop: 30, padding: 21, borderRadius: 21, backgroundColor: colors.forest },
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
