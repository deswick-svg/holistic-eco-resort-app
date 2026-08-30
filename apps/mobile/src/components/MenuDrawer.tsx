import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { menuItems } from '../data/menu';
import { colors } from '../theme/colors';

export function MenuDrawer({ onClose, onSelect }: { onClose: () => void; onSelect: (key: string) => void }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.drawer}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.brand}>
            <Image source={require('../../assets/holistic-logo-white.png')} style={styles.logo} resizeMode="contain" />
          </View>
          <Text style={styles.greeting}>Hi Guest</Text>
          <View style={styles.authRow}>
            <Pressable style={styles.authButton} onPress={() => onSelect('login')}><Text style={styles.authText}>LOGIN</Text></Pressable>
            <Pressable style={styles.authButton} onPress={() => onSelect('employee-login')}><Text style={styles.authText}>EMPLOYEE LOGIN</Text></Pressable>
          </View>
          {menuItems.map((item) => (
            <Pressable key={item.key} style={styles.item} onPress={() => onSelect(item.key)}>
              <Ionicons name={item.icon as any} size={22} color={item.key === 'delete-account' ? colors.danger : colors.ink} />
              <Text style={[styles.itemText, item.key === 'delete-account' && { color: colors.danger }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={17} color={colors.muted} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <Pressable style={styles.scrim} onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, flexDirection: 'row' },
  drawer: { width: '86%', backgroundColor: colors.white },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  content: { paddingBottom: 30 },
  brand: { height: 125, backgroundColor: colors.forest, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 118, height: 94 },
  greeting: { paddingHorizontal: 20, paddingTop: 18, fontSize: 30, fontWeight: '750', color: colors.ink },
  authRow: { padding: 16, gap: 10 },
  authButton: { borderWidth: 1, borderColor: colors.ink, paddingVertical: 13, borderRadius: 10, alignItems: 'center' },
  authText: { fontSize: 16, fontWeight: '800', color: colors.ink },
  item: { minHeight: 58, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20 },
  itemText: { flex: 1, fontSize: 17, color: colors.ink },
});
