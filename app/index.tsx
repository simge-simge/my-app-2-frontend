import { Ionicons } from "@expo/vector-icons"
import { Redirect, router } from "expo-router"
import Head from "expo-router/head"
import { useEffect, useRef, useState } from "react"
import { AccessibilityInfo, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"

import AppButton from "@/components/AppButton"
import GentleEntrance from "@/components/GentleEntrance"
import LandingBookRail from "@/components/LandingBookRail"
import LegalLinks from "@/components/LegalLinks"
import LanguageSwitch from "@/components/LanguageSwitch"
import { HOME_PREVIEW_BOOKS, HOME_PREVIEW_COVERS } from "@/constants/homePreviewBooks"
import { layout, palette, radii, shadows, spacing, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { useAuthSession } from "@/services/authSession"

const heroArt = require("../assets/images/welcome-hero.png")
const previewRows = [HOME_PREVIEW_BOOKS.slice(0, 5), HOME_PREVIEW_BOOKS.slice(5)]

export default function Index() {
  const { t } = useTranslation()
  const { session } = useAuthSession()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [previewY, setPreviewY] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const isWide = width >= 800

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)
    return () => subscription.remove()
  }, [])

  if (session) return <Redirect href="/home" />

  const openSignup = () => router.push("/signup")

  return (
    <>
      <Head>
        <title>{t("publicPageTitle")}</title>
        <meta name="description" content={t("publicPageDescription")} />
      </Head>
      <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, isWide && styles.topBarWide]}>
          <View style={styles.brandRow} accessibilityRole="header">
            <View style={styles.brandMark} />
            <Text style={styles.brandName}>CommonShelf</Text>
          </View>
          <View style={styles.topActions}>
            <LanguageSwitch />
            <Pressable accessibilityRole="link" onPress={() => router.push("/login")} style={({ pressed }) => [styles.loginLink, pressed && styles.pressed]}>
              <Text style={styles.loginLinkText}>{t("login")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.hero, isWide && styles.heroWide]}>
          <GentleEntrance style={[styles.copyColumn, isWide && styles.copyColumnWide]}>
            <View style={styles.eyebrowRow}>
              <Ionicons name="book-outline" size={17} color={palette.accentDark} />
              <Text style={styles.eyebrow}>{t("publicEyebrow")}</Text>
            </View>
            <Text accessibilityRole="header" style={[styles.title, !isWide && styles.mobileTitle]}>{t("heroTitle")}</Text>
            <Text style={styles.subtitle}>{t("heroSubtitle")}</Text>
            <View style={[styles.actions, isWide && styles.actionsWide]}>
              <AppButton title={t("createAccount")} onPress={openSignup} style={isWide ? styles.actionWide : undefined} />
              <AppButton title={t("seeAppPreview")} variant="secondary" onPress={() => scrollRef.current?.scrollTo({ y: previewY, animated: !reduceMotion })} style={isWide ? styles.actionWide : undefined} />
            </View>
            <Text style={styles.note}>{t("noAccountNeeded")}</Text>
          </GentleEntrance>

          <GentleEntrance delay={110} style={[styles.artColumn, isWide && styles.artColumnWide]}>
            <View style={[styles.skyDot, styles.skyDotOne]} />
            <View style={[styles.skyDot, styles.skyDotTwo]} />
            <View style={styles.artHalo} />
            <Image accessibilityLabel={t("heroImageLabel")} source={heroArt} style={styles.heroArt} resizeMode="contain" />
            <View style={styles.scribble} />
          </GentleEntrance>
        </View>

        <View onLayout={(event) => setPreviewY(event.nativeEvent.layout.y)} style={[styles.section, styles.previewSection]}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>{t("productPreview")}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t("previewTitle")}</Text>
            <Text style={styles.sectionBody}>{t("previewDescription")}</Text>
          </View>
          <View style={styles.previewWindow} accessibilityLabel={t("previewAccessibilityLabel")}>
            <View style={styles.previewTopBar}>
              <View style={styles.previewDots}><View style={styles.previewDotRose} /><View style={styles.previewDotYellow} /><View style={styles.previewDotGreen} /></View>
              <Text style={styles.previewWindowTitle}>{t("communityShelf")}</Text>
              <View style={styles.previewTopSpacer} />
            </View>
            <Text style={styles.previewNote}>{t("previewBooks")}</Text>
            <LandingBookRail books={previewRows[0]} reduceMotion={reduceMotion} showCommunity coverSources={HOME_PREVIEW_COVERS} onBookPress={openSignup} />
            <LandingBookRail books={previewRows[1]} direction="right" reduceMotion={reduceMotion} showCommunity coverSources={HOME_PREVIEW_COVERS} onBookPress={openSignup} />
            <View style={styles.previewFooter}>
              <Ionicons name="lock-closed-outline" size={14} color={palette.textMuted} />
              <Text style={styles.previewFooterText}>{t("samplePreviewNotice")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>{t("howItWorks")}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t("fromShelfToShare")}</Text>
          </View>
          <View style={[styles.featureGrid, isWide && styles.featureGridWide]}>
            <FeatureCard number="1" icon="library-outline" title={t("featureShelfTitle")} body={t("featureShelfBody")} color={palette.orangeSoft} />
            <FeatureCard number="2" icon="people-outline" title={t("featureCommunityTitle")} body={t("featureCommunityBody")} color={palette.blueSoft} />
            <FeatureCard number="3" icon="swap-horizontal-outline" title={t("featureMatchTitle")} body={t("featureMatchBody")} color={palette.roseSoft} />
          </View>
        </View>

        <View style={[styles.section, styles.dataCard, isWide && styles.dataCardWide]}>
          <View style={styles.dataIcon}><Ionicons name="shield-checkmark-outline" size={28} color={palette.accentDark} /></View>
          <View style={styles.dataCopy}>
            <Text style={styles.sectionKicker}>{t("yourData")}</Text>
            <Text accessibilityRole="header" style={styles.dataTitle}>{t("googleDataTitle")}</Text>
            <Text style={[styles.sectionBody, styles.dataBody]}>{t("googleDataBody")}</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push("/privacy")} style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
              <Text style={styles.inlineLinkText}>{t("readPrivacyPolicy")}</Text>
              <Ionicons name="arrow-forward" size={16} color={palette.accentDark} />
            </Pressable>
          </View>
        </View>

        <View style={styles.finalCta}>
          <Text accessibilityRole="header" style={styles.finalTitle}>{t("readyToShare")}</Text>
          <Text style={styles.finalBody}>{t("readyToShareBody")}</Text>
          <AppButton title={t("createAccount")} onPress={openSignup} style={styles.finalButton} />
          <Pressable accessibilityRole="link" onPress={() => router.push("/login")} style={({ pressed }) => [styles.existingAccount, pressed && styles.pressed]}>
            <Text style={styles.existingAccountText}>{t("alreadyAccount")}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>CommonShelf</Text>
          <Text style={styles.footerText}>{t("heroNote")}</Text>
          <LegalLinks />
        </View>
      </ScrollView>
    </>
  )
}

function FeatureCard({ number, icon, title, body, color }: { number: string; icon: keyof typeof Ionicons.glyphMap; title: string; body: string; color: typeof palette.orangeSoft }) {
  return (
    <View style={styles.featureCard}>
      <View style={[styles.featureIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={25} color={palette.ink} />
        <View style={styles.numberBadge}><Text style={styles.numberText}>{number}</Text></View>
      </View>
      <Text accessibilityRole="header" style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureBody}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  page: { flexGrow: 1, paddingBottom: 28 },
  topBar: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", minHeight: 72, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  topBarWide: { minHeight: 84 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandMark: { width: 15, height: 22, borderRadius: 4, backgroundColor: palette.orange, borderWidth: 1.5, borderColor: palette.borderStrong, transform: [{ rotate: "-6deg" }] },
  brandName: { fontFamily: typography.serif, fontSize: 18, fontWeight: "800", color: palette.ink },
  topActions: { flexDirection: "row", alignItems: "center" },
  loginLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 6 },
  loginLinkText: { color: palette.accentDark, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.65 },
  hero: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 20, paddingTop: 26, paddingBottom: 64 },
  heroWide: { minHeight: 610, flexDirection: "row", alignItems: "center", gap: 64, paddingTop: 18, paddingBottom: 72 },
  copyColumn: { width: "100%", maxWidth: 540, alignSelf: "center" },
  copyColumnWide: { flex: 0.95 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  eyebrow: { fontSize: 12, fontWeight: "800", color: palette.accentDark, textTransform: "uppercase", letterSpacing: 1.4 },
  title: { fontFamily: typography.serif, fontSize: 48, lineHeight: 52, fontWeight: "700", color: palette.ink, maxWidth: 530 },
  mobileTitle: { fontSize: 38, lineHeight: 42 },
  subtitle: { marginTop: 16, fontSize: 17, lineHeight: 26, color: palette.textMuted, maxWidth: 500 },
  actions: { marginTop: spacing.lg },
  actionsWide: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionWide: { flex: 1 },
  note: { color: palette.textMuted, fontSize: 12, marginTop: spacing.md, fontStyle: "italic" },
  artColumn: { height: 330, alignItems: "center", justifyContent: "center", marginTop: 24, position: "relative" },
  artColumnWide: { flex: 1.05, height: 520, marginTop: 0 },
  artHalo: { position: "absolute", width: "88%", aspectRatio: 1, maxWidth: 490, borderRadius: 999, backgroundColor: palette.yellow, opacity: 0.46, transform: [{ rotate: "-5deg" }] },
  heroArt: { width: "100%", height: "100%", zIndex: 2 },
  skyDot: { position: "absolute", borderWidth: 1.5, borderColor: palette.borderStrong, zIndex: 3 },
  skyDotOne: { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.blue, left: "7%", top: "16%" },
  skyDotTwo: { width: 13, height: 13, borderRadius: 7, backgroundColor: palette.rose, right: "5%", top: "28%" },
  scribble: { position: "absolute", bottom: 18, width: "62%", height: 6, borderRadius: 99, backgroundColor: palette.green, opacity: 0.7, transform: [{ rotate: "-2deg" }] },
  section: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 58 },
  previewSection: { paddingTop: 70 },
  sectionHeading: { maxWidth: 680, alignSelf: "center", alignItems: "center", marginBottom: 28 },
  sectionKicker: { color: palette.accentDark, fontSize: 12, fontWeight: "900", letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 9 },
  sectionTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 32, lineHeight: 38, fontWeight: "700", textAlign: "center" },
  sectionBody: { color: palette.textMuted, fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 10 },
  previewWindow: { width: "100%", maxWidth: 900, alignSelf: "center", backgroundColor: palette.roseSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, overflow: "hidden", paddingBottom: 8, ...shadows.lifted },
  previewTopBar: { minHeight: 48, paddingHorizontal: 14, backgroundColor: palette.paper, borderBottomWidth: 1, borderBottomColor: palette.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewDots: { flexDirection: "row", gap: 5, width: 48 },
  previewDotRose: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.rose },
  previewDotYellow: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.yellow },
  previewDotGreen: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.green },
  previewWindowTitle: { color: palette.ink, fontFamily: typography.serif, fontSize: 14, fontWeight: "700" },
  previewTopSpacer: { width: 48 },
  previewNote: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4, color: palette.textMuted, fontSize: 12, textAlign: "center", fontStyle: "italic" },
  previewFooter: { minHeight: 42, marginHorizontal: 12, marginTop: 5, paddingHorizontal: 10, borderTopWidth: 1, borderColor: palette.border, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  previewFooterText: { color: palette.textMuted, fontSize: 11, fontWeight: "700", textAlign: "center" },
  featureGrid: { gap: 14 },
  featureGridWide: { flexDirection: "row", alignItems: "stretch" },
  featureCard: { flex: 1, minHeight: 230, backgroundColor: palette.paper, padding: 22, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, ...shadows.soft },
  featureIcon: { width: 58, height: 58, borderRadius: 18, borderWidth: 1.5, borderColor: palette.borderStrong, alignItems: "center", justifyContent: "center", marginBottom: 20, position: "relative" },
  numberBadge: { position: "absolute", right: -8, top: -8, width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong },
  numberText: { color: palette.ink, fontSize: 11, fontWeight: "900" },
  featureTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 21, lineHeight: 25, fontWeight: "700" },
  featureBody: { color: palette.textMuted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  dataCard: { maxWidth: 920, backgroundColor: palette.accentSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, padding: 24, marginVertical: 46 },
  dataCardWide: { flexDirection: "row", alignItems: "center", gap: 26, paddingHorizontal: 34 },
  dataIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong, alignItems: "center", justifyContent: "center", alignSelf: "center", marginBottom: 18 },
  dataCopy: { flex: 1, alignItems: "flex-start" },
  dataTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 25, lineHeight: 30, fontWeight: "700", textAlign: "left" },
  dataBody: { textAlign: "left" },
  inlineLink: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  inlineLinkText: { color: palette.accentDark, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  finalCta: { width: "100%", maxWidth: 620, alignSelf: "center", alignItems: "center", paddingHorizontal: 20, paddingVertical: 70 },
  finalTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 32, lineHeight: 38, fontWeight: "700", textAlign: "center" },
  finalBody: { color: palette.textMuted, fontSize: 15, lineHeight: 23, textAlign: "center", marginTop: 10 },
  finalButton: { width: "100%", maxWidth: 340, marginTop: 22 },
  existingAccount: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10, marginTop: 4 },
  existingAccountText: { color: palette.accentDark, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  footer: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", alignItems: "center", paddingHorizontal: 20, paddingTop: 28, borderTopWidth: 1, borderColor: palette.border },
  footerBrand: { fontFamily: typography.serif, color: palette.ink, fontSize: 18, fontWeight: "800" },
  footerText: { color: palette.textMuted, fontSize: 12, textAlign: "center", marginTop: 5 },
})
