import React, { useMemo, useState } from 'react';
import {
  Image,
  ImageBackground,
  Modal,
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

type GalleryCategory = 'Resort' | 'Rooms' | 'Dining' | 'Wellness' | 'Activities';

type GalleryPhoto = {
  uri: string;
  category: GalleryCategory;
  title: string;
};

const photos: GalleryPhoto[] = [
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_63%2Cw_794%2Ch_446%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-eco-resort-kannur/facade-at-night',
    category: 'Resort',
    title: 'Holistic Eco-Resort',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3750/x_0%2Cy_527%2Cw_5000%2Ch_2810%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/IMG_0553_%281%29',
    category: 'Resort',
    title: 'Infinity swimming pool',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_0%2Cw_4032%2Ch_2266%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/IMG_0775',
    category: 'Resort',
    title: 'Swimming pool',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0,y_119,w_1280,h_719,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-3',
    category: 'Rooms',
    title: 'Forest View Room',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0,y_782,w_1200,h_674,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/forest-view-room-5',
    category: 'Rooms',
    title: 'Forest View Room',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0,y_120,w_1280,h_720,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133282_452bcf4c',
    category: 'Rooms',
    title: 'Tree House',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0,y_370,w_960,h_540,r_0,c_crop,q_80,fl_progressive/w_900,f_auto,c_fit/holistic-eco-resort-kannur/1000133283_e6c733d5',
    category: 'Rooms',
    title: 'Tree House',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Restaurant_2-11_jptwwe',
    category: 'Dining',
    title: 'Mom’s Kitchen',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort/Restaurant_1-11_eunu07',
    category: 'Dining',
    title: 'Mom’s Kitchen',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Ayurvedic_wellness_center_2-11',
    category: 'Wellness',
    title: 'Ayurvedic Wellness Center',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_156%2Cw_3000%2Ch_1688%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Ayurvedic_wellness_center_11',
    category: 'Wellness',
    title: 'Ayurvedic Wellness Center',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/x_0%2Cy_218%2Cw_4176%2Ch_2349%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_900%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/230A9475_lzcmdv',
    category: 'Activities',
    title: 'Day outing',
  },
  {
    uri: 'https://assets.simplotel.com/simplotel/image/upload/w_5000%2Ch_3333/x_834%2Cy_0%2Cw_3333%2Ch_3333%2Cr_0%2Cc_crop%2Cq_80%2Cfl_progressive/w_825%2Cf_auto%2Cc_fit/holistic-stay-eco-resort-kannur/Jeep_Ride_xq6mfy',
    category: 'Activities',
    title: 'Off-road jeep ride',
  },
];

const categories = ['All', 'Resort', 'Rooms', 'Dining', 'Wellness', 'Activities'] as const;

export function GalleryScreen({ onBack }: { onBack: () => void }) {
  const { width, height } = useWindowDimensions();
  const [activeCategory, setActiveCategory] = useState<(typeof categories)[number]>('All');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const gridGap = 10;
  const tileWidth = (width - 40 - gridGap) / 2;
  const tileHeight = Math.max(150, Math.min(tileWidth * 1.2, 225));

  const visiblePhotos = useMemo(
    () => photos.filter((photo) => activeCategory === 'All' || photo.category === activeCategory),
    [activeCategory],
  );

  const selectCategory = (category: (typeof categories)[number]) => {
    setActiveCategory(category);
    setViewerOpen(false);
    setViewerIndex(0);
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerStartIndex(index);
    setViewerOpen(true);
  };

  const updateViewerIndex = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setViewerIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Gallery</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground source={{ uri: photos[0]!.uri }} style={styles.hero} resizeMode="cover">
          <LinearGradient colors={['rgba(4,24,15,0.08)', 'rgba(4,24,15,0.84)']} style={styles.heroShade} />
          <Image
            source={require('../../assets/HER-_HER Logo All White.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>HOLISTIC ECO-RESORT · KANNUR</Text>
            <Text style={styles.heroTitle}>A closer look</Text>
            <Text style={styles.heroSubtitle}>Browse genuine moments and spaces from across the resort.</Text>
          </View>
        </ImageBackground>

        <View style={styles.intro}>
          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={styles.sectionEyebrow}>OFFICIAL RESORT PHOTOGRAPHY</Text>
              <Text style={styles.sectionTitle}>Explore Holistic</Text>
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="images-outline" size={25} color={colors.forest} />
            </View>
          </View>
          <Text style={styles.bodyCopy}>Select a category, then tap any photograph for a full-screen view.</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTrack}
        >
          {categories.map((category) => {
            const selected = activeCategory === category;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={category}
                onPress={() => selectCategory(category)}
                style={[styles.categoryPill, selected && styles.categoryPillActive]}
              >
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{category}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.gridHeading}>
          <Text style={styles.gridTitle}>{activeCategory === 'All' ? 'All photographs' : activeCategory}</Text>
          <Text style={styles.gridCount}>{visiblePhotos.length} photos</Text>
        </View>

        <View style={[styles.grid, { columnGap: gridGap }]}>
          {visiblePhotos.map((photo, index) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${photo.title} photograph`}
              key={photo.uri}
              onPress={() => openViewer(index)}
              style={[styles.tile, { width: tileWidth, height: tileHeight }]}
            >
              <Image source={{ uri: photo.uri }} style={styles.tileImage} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(4,24,15,0.76)']} style={styles.tileShade} />
              <View style={styles.tileCopy}>
                <Text style={styles.tileCategory}>{photo.category.toUpperCase()}</Text>
                <Text numberOfLines={1} style={styles.tileTitle}>{photo.title}</Text>
              </View>
              <View style={styles.expandIcon}>
                <Ionicons name="expand-outline" size={15} color={colors.white} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Modal visible={viewerOpen} transparent animationType="fade" onRequestClose={() => setViewerOpen(false)}>
        <View style={styles.viewer}>
          <View style={styles.viewerTopBar}>
            <View style={styles.viewerCounterWrap}>
              <Text style={styles.viewerCounter}>{viewerIndex + 1} / {visiblePhotos.length}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close photograph"
              onPress={() => setViewerOpen(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={25} color={colors.white} />
            </Pressable>
          </View>

          <ScrollView
            key={`${activeCategory}-${viewerStartIndex}-${viewerOpen}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: viewerStartIndex * width, y: 0 }}
            onMomentumScrollEnd={updateViewerIndex}
            style={styles.viewerPager}
          >
            {visiblePhotos.map((photo) => (
              <View key={photo.uri} style={[styles.viewerSlide, { width, height }]}>
                <Image source={{ uri: photo.uri }} style={styles.viewerImage} resizeMode="contain" />
              </View>
            ))}
          </ScrollView>

          {visiblePhotos[viewerIndex] ? (
            <View style={styles.viewerCaption}>
              <Text style={styles.viewerCategory}>{visiblePhotos[viewerIndex].category.toUpperCase()}</Text>
              <Text style={styles.viewerTitle}>{visiblePhotos[viewerIndex].title}</Text>
              <Text style={styles.swipeHint}>Swipe to browse</Text>
            </View>
          ) : null}
        </View>
      </Modal>
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
  eyebrow: { color: '#E4EBDD', fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { marginTop: 7, color: colors.white, fontSize: 36, lineHeight: 42, fontWeight: '800' },
  heroSubtitle: { marginTop: 7, maxWidth: 330, color: '#F3F6F2', fontSize: 15, lineHeight: 22 },
  intro: { paddingHorizontal: 20 },
  introRow: { marginTop: 28, flexDirection: 'row', alignItems: 'flex-start' },
  introCopy: { flex: 1, paddingRight: 16 },
  sectionEyebrow: { color: colors.leaf, fontSize: 11, fontWeight: '800', letterSpacing: 1.15 },
  sectionTitle: { marginTop: 7, color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  cameraBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  bodyCopy: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 22 },
  categoryTrack: { paddingHorizontal: 20, paddingVertical: 20 },
  categoryPill: { minHeight: 40, marginRight: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  categoryPillActive: { backgroundColor: colors.forest, borderColor: colors.forest },
  categoryText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  categoryTextActive: { color: colors.white },
  gridHeading: { paddingHorizontal: 20, marginBottom: 13, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  gridTitle: { color: colors.ink, fontSize: 20, fontWeight: '800' },
  gridCount: { color: colors.leaf, fontSize: 12, fontWeight: '800' },
  grid: { paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap' },
  tile: { marginBottom: 10, overflow: 'hidden', borderRadius: 17, backgroundColor: colors.sage },
  tileImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  tileShade: { ...StyleSheet.absoluteFillObject },
  tileCopy: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  tileCategory: { color: '#D9E6DC', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  tileTitle: { marginTop: 3, paddingRight: 15, color: colors.white, fontSize: 13, fontWeight: '800' },
  expandIcon: { position: 'absolute', top: 9, right: 9, width: 29, height: 29, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.38)' },
  viewer: { flex: 1, backgroundColor: '#07120D' },
  viewerTopBar: { position: 'absolute', zIndex: 3, top: 0, left: 0, right: 0, paddingTop: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewerCounterWrap: { minHeight: 38, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.42)' },
  viewerCounter: { color: colors.white, fontSize: 13, fontWeight: '800' },
  closeButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.46)' },
  viewerPager: { flex: 1 },
  viewerSlide: { alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '100%', height: '74%' },
  viewerCaption: { position: 'absolute', left: 20, right: 20, bottom: 38, alignItems: 'center' },
  viewerCategory: { color: '#CFE0D2', fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  viewerTitle: { marginTop: 5, color: colors.white, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  swipeHint: { marginTop: 8, color: '#AAB8AF', fontSize: 12 },
});
