import React, { useState } from "react";
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { StayCard } from '../components/StayCard';
import { stays } from '../data/stays';
import { simplotel, LiveStayRate } from "../services/simplotel";

export function BookingScreen({ onBack }: { onBack: () => void }) {
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  const [rooms, setRooms] = useState("1");

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveRates, setLiveRates] = useState<LiveStayRate[]>([]);
  const [error, setError] = useState("");
  const formatDate = (date: Date | null) => {
  if (!date) return "DD-MM-YYYY";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
  const handleSearchAvailability = async () => {
  if (!checkIn || !checkOut) {
    setError("Please select check-in and check-out dates.");
    return;
  }

  if (checkOut <= checkIn) {
    setError("Check-out must be after check-in.");
    return;
  }

  try {
    setLoading(true);
    setError("");

    const rates = await simplotel.getAvailability({
      checkIn: formatApiDate(checkIn),
      checkOut: formatApiDate(checkOut),
      adults: Number(adults),
      children: Number(children),
      rooms: Number(rooms),
    });

    setLiveRates(rates);
    setSearched(true);
  } catch (err) {
    console.error(err);
    setError("Unable to load live availability. Please try again.");
    setLiveRates([]);
    setSearched(true);
  } finally {
    setLoading(false);
  }
};
  

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable>
        <Text style={styles.title}>Book your stay</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.headline}>Find your perfect stay</Text>
        <Text style={styles.sub}>Live availability and final rates will come from the resort's Simplotel booking system.</Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>Check-in</Text>
         <Pressable style={styles.input} onPress={() => setShowCheckInPicker(true)}>
  <Text>{formatDate(checkIn)}</Text>
</Pressable>

{showCheckInPicker && (
  <DateTimePicker
    value={checkIn ?? new Date()}
    mode="date"
    minimumDate={new Date()}
    onChange={(_, selectedDate) => {
      setShowCheckInPicker(false);
if (selectedDate) {
  setCheckIn(selectedDate);
  setCheckOut(null);
}
    }}
  />
)}
          <Text style={styles.label}>Check-out</Text>
          <Pressable style={styles.input} onPress={() => setShowCheckOutPicker(true)}>
  <Text>{formatDate(checkOut)}</Text>
</Pressable>

{showCheckOutPicker && (
  <DateTimePicker
    value={checkOut ?? checkIn ?? new Date()}
    mode="date"
    minimumDate={checkIn ?? new Date()}
    onChange={(_, selectedDate) => {
      setShowCheckOutPicker(false);
      if (selectedDate) setCheckOut(selectedDate);
    }}
  />
)}
          <Text style={styles.label}>Adults</Text>
<TextInput
  value={adults}
  onChangeText={setAdults}
  keyboardType="number-pad"
  style={styles.input}
/>

<Text style={styles.label}>Children</Text>
<TextInput
  value={children}
  onChangeText={setChildren}
  keyboardType="number-pad"
  style={styles.input}
/>

<Text style={styles.label}>Rooms</Text>
<TextInput
  value={rooms}
  onChangeText={setRooms}
  keyboardType="number-pad"
  style={styles.input}
/>

<Pressable style={styles.button} onPress={handleSearchAvailability}>
            <Text style={styles.buttonText}>Search availability</Text>
          </Pressable>
        </View>
        {loading ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>Checking live availability...</Text>
  </View>
) : null}

{error ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>{error}</Text>
  </View>
) : null}

{searched && !loading && !error ? (
  <View style={styles.notice}>
    <Text style={styles.noticeText}>
      Found {liveRates.length} live room options from Simplotel.
    </Text>
  </View>
) : null}
        {searched && !loading && !error ? (
  <>
    <Text style={styles.section}>Available rooms</Text>

    {liveRates.map((rate) => (
      <View key={rate.stayId} style={styles.roomCard}>
  <Text style={styles.roomName}>
    {rate.roomName.replace(" at Holistic Eco Resort and Ayurvedic Retreat", "")}
  </Text>

  <Text style={styles.roomMeta}>
    Available: {rate.availableUnits}
  </Text>

  <Text style={styles.roomMeta}>
    {rate.ratePlanName ?? "Rate plan"}
  </Text>

  <Text style={styles.roomPrice}>
    ₹{rate.totalAmount.toLocaleString("en-IN")}
  </Text>

  <Pressable style={styles.selectButton}>
    <Text style={styles.selectButtonText}>Select room</Text>
  </Pressable>
</View>
    ))}
  </>
) : null}

</ScrollView>
</View>
);
}

const styles = StyleSheet.create({
  roomCard: {
  marginTop: 14,
  padding: 18,
  borderRadius: 18,
  backgroundColor: colors.white,
  borderWidth: 1,
  borderColor: colors.line,
},

roomName: {
  fontSize: 20,
  fontWeight: "800",
  color: colors.ink,
  marginBottom: 8,
},

roomMeta: {
  fontSize: 14,
  color: colors.muted,
  marginBottom: 5,
},

roomPrice: {
  fontSize: 22,
  fontWeight: "800",
  color: colors.forest,
  marginTop: 8,
  marginBottom: 14,
},

selectButton: {
  backgroundColor: colors.forest,
  paddingVertical: 13,
  borderRadius: 12,
  alignItems: "center",
},

selectButtonText: {
  color: colors.white,
  fontSize: 15,
  fontWeight: "800",
},
  page: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 48, height: 100, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink },
  body: { padding: 20, paddingBottom: 45 },
  headline: { fontSize: 29, fontWeight: '800', color: colors.ink },
  sub: { marginTop: 7, fontSize: 14, lineHeight: 21, color: colors.muted },
  formCard: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  label: { marginTop: 8, marginBottom: 7, fontSize: 12, fontWeight: '800', color: colors.ink },
  input: { height: 48, borderRadius: 11, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, fontSize: 15, backgroundColor: '#FCFDFB' },
  button: { marginTop: 17, height: 50, borderRadius: 12, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  notice: { marginTop: 14, flexDirection: 'row', gap: 9, padding: 12, borderRadius: 12, backgroundColor: colors.sage },
  noticeText: { flex: 1, color: colors.forest, fontSize: 12.5, lineHeight: 18 },
  section: { marginTop: 26, marginBottom: 12, fontSize: 20, fontWeight: '800', color: colors.ink },
});
