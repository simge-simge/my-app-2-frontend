import { Image, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import GentleEntrance from "@/components/GentleEntrance"
import { layout, palette, spacing, typography } from "@/constants/theme"

const heroArt = require("../assets/images/welcome-hero.png")

export default function Index() {
  const { width, height } = useWindowDimensions()
  const isWide = width >= 800
  const isCompact = height < 720

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, isWide && styles.wideContainer]} showsVerticalScrollIndicator={false}>
      <View style={[styles.content, isWide && styles.wideContent]}>
        <GentleEntrance style={[styles.artColumn, isWide && styles.wideArtColumn]}>
          <View style={[styles.skyDot, styles.skyDotOne]} />
          <View style={[styles.skyDot, styles.skyDotTwo]} />
          <View style={styles.artHalo} />
          <Image accessibilityLabel="Two readers sharing a book" source={heroArt} style={[styles.heroArt, isCompact && !isWide && styles.compactArt]} resizeMode="contain" />
          <View style={styles.scribble} />
        </GentleEntrance>

        <GentleEntrance delay={110} style={[styles.copyColumn, !isWide && { maxWidth: width - 40 }, isWide && styles.wideCopyColumn]}>
          <View style={styles.brandRow}><View style={styles.brandMark} /><Text style={styles.eyebrow}>CommonShelf</Text></View>
          <Text style={[styles.title, !isWide && styles.mobileTitle]}>Good books find their way to good company.</Text>
          <Text style={styles.subtitle}>Share your shelf, discover reads nearby, and turn a match into a conversation.</Text>

          <View style={styles.actions}>
            <AppButton title="Log in" onPress={() => router.push("/login")} />
            <AppButton title="Create an account" variant="secondary" onPress={() => router.push("/signup")} />
          </View>
          <Text style={styles.note}>Made for curious readers and generous shelves.</Text>
        </GentleEntrance>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 20, paddingVertical: 20 },
  wideContainer: { paddingHorizontal: 48, paddingVertical: 36 },
  content: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center" },
  wideContent: { flexDirection: "row", alignItems: "center", gap: 64 },
  artColumn: { height: 315, alignItems: "center", justifyContent: "center", marginBottom: 8, position: "relative" },
  wideArtColumn: { flex: 1.05, height: 610, marginBottom: 0 },
  artHalo: { position: "absolute", width: "88%", aspectRatio: 1, maxWidth: 490, borderRadius: 999, backgroundColor: palette.yellow, opacity: 0.46, transform: [{ rotate: "-5deg" }] },
  heroArt: { width: "100%", height: "100%", zIndex: 2 },
  compactArt: { height: 265 },
  skyDot: { position: "absolute", borderWidth: 1.5, borderColor: palette.borderStrong, zIndex: 3 },
  skyDotOne: { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.blue, left: "7%", top: "16%" },
  skyDotTwo: { width: 13, height: 13, borderRadius: 7, backgroundColor: palette.rose, right: "5%", top: "28%" },
  scribble: { position: "absolute", bottom: 18, width: "62%", height: 6, borderRadius: 99, backgroundColor: palette.green, opacity: 0.7, transform: [{ rotate: "-2deg" }] },
  copyColumn: { width: "100%", maxWidth: 520, alignSelf: "center" },
  wideCopyColumn: { flex: 0.95 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  brandMark: { width: 15, height: 22, borderRadius: 4, backgroundColor: palette.orange, borderWidth: 1.5, borderColor: palette.borderStrong, transform: [{ rotate: "-6deg" }] },
  eyebrow: { fontSize: 12, fontWeight: "800", color: palette.accentDark, textTransform: "uppercase", letterSpacing: 1.5 },
  title: { fontFamily: typography.serif, fontSize: 39, lineHeight: 43, fontWeight: "700", color: palette.ink, maxWidth: 510 },
  mobileTitle: { fontSize: 35, lineHeight: 39 },
  subtitle: { marginTop: 14, fontSize: 16, lineHeight: 24, color: palette.textMuted, maxWidth: 470 },
  actions: { marginTop: spacing.lg },
  note: { textAlign: "center", color: palette.textMuted, fontSize: 12, marginTop: spacing.md, fontStyle: "italic" },
})
