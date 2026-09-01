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
