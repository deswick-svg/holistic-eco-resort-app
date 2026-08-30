import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { SectionTitle } from '../components/SectionTitle';
import { StayCard } from '../components/StayCard';
import { stays } from '../data/stays';

const quickActions = [
  ['Booking', 'calendar-outline', 'booking'],
  ['Dining', 'restaurant-outline', 'dining'],
  ['Activities', 'bicycle-outline', 'activities'],
  ['Ayurveda', 'leaf-outline', 'spa'],
] as const;

export function HomeScreen({ onMenu, onSelect }: { onMenu: () => void; onSelect: (key: string) => void }) {
  return (
    <View style={styles.page}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroWrap}>
          <Image source={require('../../assets/hero-background.png')} style={styles.hero} resizeMode="cover" />
          <Image source={require('../../assets/HER-_HER Logo All White.png')} style={styles.logo} resizeMode="contain" />
          <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.75)']} style={styles.heroShade} />
          <Pressable style={styles.menuButton} onPress={onMenu}><Ionicons name="menu" size={27} color={colors.white} /></Pressable>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>HOLISTIC ECO-RESORT · KANNUR</Text>
            <Text style={styles.heroTitle}>Reconnect with nature.</Text>
            <Text style={styles.heroSubtitle}>Stay, wellness and memorable experiences in the Western Ghats.</Text>
            <Pressable style={styles.primaryButton} onPress={() => onSelect('booking')}>
              <Text style={styles.primaryText}>Search Availability</Text><Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.quickGrid}>
            {quickActions.map(([label, icon, key]) => (
              <Pressable key={key} style={styles.quickCard} onPress={() => onSelect(key)}>
                <View style={styles.iconCircle}><Ionicons name={icon as any} size={22} color={colors.forest} /></View>
                <Text style={styles.quickLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <SectionTitle title="Featured stays" action="See all" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: -20 }}>
            {stays.slice(0, 4).map((stay) => <StayCard key={stay.id} stay={stay} />)}
          </ScrollView>

          <View style={styles.spacer} />
          <SectionTitle title="Explore the resort" />
          <View style={styles.exploreList}>
            {[
              ['Property Map', 'map-outline', 'map'],
              ['Local Attractions', 'location-outline', 'attractions'],
              ['Gallery', 'images-outline', 'gallery'],
              ['Discount Coupons', 'pricetag-outline', 'coupon'],
            ].map(([label, icon, key]) => (
              <Pressable key={key} style={styles.exploreRow} onPress={() => onSelect(key as string)}>
                <View style={styles.rowIcon}><Ionicons name={icon as any} size={21} color={colors.forest} /></View>
                <Text style={styles.exploreText}>{label}</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <Pressable style={styles.whatsapp} onPress={() => onSelect('contact')}><Ionicons name="logo-whatsapp" size={31} color={colors.white} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingBottom: 45 },
  heroWrap: { height: 500, position: 'relative', backgroundColor: colors.forest },
  hero: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  logo: {
  position: 'absolute',
  top: 48,
  alignSelf: 'center',
  width: 180,
  height: 120,
  zIndex: 3,
},
  heroShade: { ...StyleSheet.absoluteFillObject },
  menuButton: { position: 'absolute', top: 52, left: 18, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  heroCopy: { position: 'absolute', left: 20, right: 20, bottom: 28 },
  eyebrow: { color: '#E4EBDD', fontWeight: '800', letterSpacing: 1.2, fontSize: 11 },
  heroTitle: { marginTop: 8, color: colors.white, fontSize: 34, lineHeight: 39, fontWeight: '800' },
  heroSubtitle: { marginTop: 8, color: '#F2F4F1', lineHeight: 21, fontSize: 14, maxWidth: 325 },
  primaryButton: { marginTop: 18, alignSelf: 'flex-start', flexDirection: 'row', gap: 9, alignItems: 'center', backgroundColor: colors.leaf, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 13 },
  primaryText: { color: colors.white, fontWeight: '800', fontSize: 14 },
  body: { paddingHorizontal: 20, paddingTop: 18 },
  quickGrid: { flexDirection: 'row', gap: 9, marginBottom: 25 },
  quickCard: { flex: 1, minHeight: 94, backgroundColor: colors.white, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line },
  iconCircle: { width: 43, height: 43, borderRadius: 22, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { marginTop: 8, fontSize: 12, fontWeight: '700', color: colors.ink },
  spacer: { height: 26 },
  exploreList: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
  exploreRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  exploreText: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  whatsapp: { position: 'absolute', right: 18, bottom: 20, width: 58, height: 58, borderRadius: 29, backgroundColor: '#1FA855', alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
});
