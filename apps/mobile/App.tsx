import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './src/screens/HomeScreen';
import { BookingScreen } from './src/screens/BookingScreen';
import { DiningScreen } from './src/screens/DiningScreen';
import { ActivitiesScreen } from './src/screens/ActivitiesScreen';
import { SpaScreen } from './src/screens/SpaScreen';
import { GalleryScreen } from './src/screens/GalleryScreen';
import { ContactScreen } from './src/screens/ContactScreen';
import { LocalAttractionsScreen } from './src/screens/LocalAttractionsScreen';
import { PropertyMapScreen } from './src/screens/PropertyMapScreen';
import { ReviewScreen } from './src/screens/ReviewScreen';
import { CouponScreen } from './src/screens/CouponScreen';
import { BookingHistoryScreen } from './src/screens/BookingHistoryScreen';
import { GuestLoginScreen } from './src/screens/GuestLoginScreen';
import { PlaceholderScreen } from './src/screens/PlaceholderScreen';
import { MenuDrawer } from './src/components/MenuDrawer';
import { colors } from './src/theme/colors';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);

  const select = (key: string) => {
    setMenuOpen(false);
    setScreen(key);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style={screen === 'home' ? 'light' : 'dark'} />
      {screen === 'home' ? (
        <HomeScreen onMenu={() => setMenuOpen(true)} onSelect={select} />
      ) : screen === 'booking' ? (
        <BookingScreen onBack={() => setScreen('home')} />
      ) : screen === 'dining' ? (
        <DiningScreen onBack={() => setScreen('home')} />
      ) : screen === 'activities' ? (
        <ActivitiesScreen onBack={() => setScreen('home')} />
      ) : screen === 'spa' ? (
        <SpaScreen onBack={() => setScreen('home')} />
      ) : screen === 'gallery' ? (
        <GalleryScreen onBack={() => setScreen('home')} />
      ) : screen === 'contact' ? (
        <ContactScreen onBack={() => setScreen('home')} />
      ) : screen === 'attractions' ? (
        <LocalAttractionsScreen onBack={() => setScreen('home')} />
      ) : screen === 'map' ? (
        <PropertyMapScreen onBack={() => setScreen('home')} />
      ) : screen === 'reviews' ? (
        <ReviewScreen onBack={() => setScreen('home')} />
      ) : screen === 'coupon' ? (
        <CouponScreen onBack={() => setScreen('home')} />
      ) : screen === 'history' ? (
        <BookingHistoryScreen onBack={() => setScreen('home')} />
      ) : screen === 'login' ? (
        <GuestLoginScreen onBack={() => setScreen('home')} />
      ) : (
        <PlaceholderScreen screenKey={screen} onBack={() => setScreen('home')} />
      )}
      {menuOpen ? <MenuDrawer onClose={() => setMenuOpen(false)} onSelect={select} /> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.cream },
});
