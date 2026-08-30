import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stay } from '../data/stays';
import { colors } from '../theme/colors';

export function StayCard({ stay }: { stay: Stay }) {
  return (
    <View style={styles.card}>
      {stay.imageUrl ? (
        <Image source={{ uri: stay.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Ionicons name="image-outline" size={30} color={colors.muted} />
          <Text style={styles.photoNote}>Real resort photo pending</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{stay.name}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{stay.guests} guests</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>{stay.size}</Text>
        </View>
        <Text style={styles.description} numberOfLines={2}>{stay.description}</Text>
        <Text style={styles.availability}>{stay.units} unit{stay.units === 1 ? '' : 's'} at resort</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 278, backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden', marginRight: 14, borderWidth: 1, borderColor: colors.line },
  image: { height: 150, width: '100%' },
  imagePlaceholder: { height: 150, backgroundColor: colors.sage, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoNote: { fontSize: 12, color: colors.muted },
  body: { padding: 14 },
  name: { fontSize: 19, fontWeight: '800', color: colors.ink },
  metaRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  meta: { fontSize: 12, color: colors.muted },
  dot: { color: colors.muted },
  description: { marginTop: 9, lineHeight: 19, color: colors.ink, fontSize: 13 },
  availability: { marginTop: 9, color: colors.leaf, fontWeight: '700', fontSize: 12 },
});
