import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function AccountDeletionScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to home" onPress={onBack} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Delete Account</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Image source={require("../../assets/HER-_HER Logo Full.png")} style={styles.logo} resizeMode="contain" />
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name="shield-checkmark-outline" size={34} color={colors.forest} />
          </View>
          <Text style={styles.title}>Account deletion is not connected yet</Text>
          <Text style={styles.copy}>
            Secure in-app account deletion will be added after the authenticated deletion service and identity checks are ready.
          </Text>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Your account has not been changed</Text>
            <Text style={styles.noticeText}>
              Opening this screen does not delete or disable your account. Signing out also does not delete your account.
            </Text>
          </View>
        </View>
        <Pressable accessibilityRole="button" style={styles.button} onPress={onBack}>
          <Text style={styles.buttonText}>Return to home</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.cream },
  header: { paddingTop: 48, height: 100, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  body: { padding: 22, paddingBottom: 48, alignItems: "center" },
  logo: { width: 150, height: 112, marginTop: 20 },
  card: { width: "100%", marginTop: 18, padding: 22, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  icon: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.sage, alignItems: "center", justifyContent: "center" },
  title: { marginTop: 18, fontSize: 25, lineHeight: 32, fontWeight: "800", color: colors.ink },
  copy: { marginTop: 10, fontSize: 15, lineHeight: 23, color: colors.muted },
  notice: { marginTop: 22, padding: 16, borderRadius: 14, backgroundColor: colors.sage },
  noticeTitle: { fontSize: 14, fontWeight: "800", color: colors.forest },
  noticeText: { marginTop: 7, fontSize: 13, lineHeight: 20, color: colors.ink },
  button: { width: "100%", height: 50, marginTop: 18, borderRadius: 12, backgroundColor: colors.forest, alignItems: "center", justifyContent: "center" },
  buttonText: { color: colors.white, fontSize: 15, fontWeight: "800" },
});
