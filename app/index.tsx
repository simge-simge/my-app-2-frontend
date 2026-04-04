import { Pressable, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"

import { palette } from "@/constants/theme"

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Book Tinder</Text>
        <Text style={styles.title}>Meet your next favorite read through your community.</Text>
        <Text style={styles.subtitle}>
          Swap shelves, discover books nearby, and turn matches into real conversations.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => router.push("/login")}>
          <Text style={styles.primaryButtonText}>Login</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.push("/signup")}>
          <Text style={styles.secondaryButtonText}>Create Account</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
    backgroundColor: palette.background,
  },
  heroCard: {
    marginTop: "auto",
    marginBottom: 40,
    backgroundColor: palette.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  title: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: "700",
    color: palette.text,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  actions: {
    gap: 14,
  },
  primaryButton: {
    backgroundColor: palette.accent,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
})
