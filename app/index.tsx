import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { router } from "expo-router"

import { palette } from "@/constants/theme"

const appIcon = require("../assets/images/icon.png")

export default function Index() {
  const { width, height } = useWindowDimensions()
  const isCompact = width < 380 || height < 650

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, isCompact && styles.compactContainer]} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <View style={[styles.heroCard, isCompact && styles.compactHeroCard]}>
          <View style={[styles.iconFrame, isCompact && styles.compactIconFrame]}>
            <Image
              accessibilityLabel="Book Tinder app icon"
              source={appIcon}
              style={styles.appIcon}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.eyebrow}>Book Tinder</Text>
          <Text style={[styles.title, isCompact && styles.compactTitle]}>Meet your next favorite read through your community.</Text>
          <Text style={[styles.subtitle, isCompact && styles.compactSubtitle]}>
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
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: palette.background,
  },
  compactContainer: {
    padding: 16,
  },
  content: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
  heroCard: {
    marginBottom: 32,
    backgroundColor: palette.surface,
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  compactHeroCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
  },
  iconFrame: {
    width: 112,
    height: 112,
    marginBottom: 20,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: palette.surfaceMuted,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: palette.accentDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 5,
  },
  compactIconFrame: {
    width: 88,
    height: 88,
    marginBottom: 16,
    borderRadius: 22,
  },
  appIcon: {
    width: "100%",
    height: "100%",
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
  compactTitle: {
    fontSize: 28,
    lineHeight: 35,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: palette.textMuted,
  },
  compactSubtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
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
