import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import Head from "expo-router/head"
import { useEffect, useRef, useState } from "react"
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View, type ImageSourcePropType } from "react-native"

import AppButton from "@/components/AppButton"
import GentleEntrance from "@/components/GentleEntrance"
import LandingBookRail from "@/components/LandingBookRail"
import LegalLinks from "@/components/LegalLinks"
import LanguageSwitch from "@/components/LanguageSwitch"
import { HOME_PREVIEW_BOOKS, HOME_PREVIEW_COVERS } from "@/constants/homePreviewBooks"
import { layout, lightPalette as palette, radii, shadows, spacing, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

const heroArt = require("../assets/images/welcome-hero.png")
const howImages = {
  add: require("../assets/images/home_display/add_your_books.png"),
  discover: require("../assets/images/home_display/discover_nearby_reads.png"),
  match: require("../assets/images/home_display/match_and_exchange.png"),
}
const previewRows = [HOME_PREVIEW_BOOKS.slice(0, 5), HOME_PREVIEW_BOOKS.slice(5)]

export default function Index() {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [problemY, setProblemY] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const isWide = width >= 800
  const isHowCompact = width < 800
  const isPhone = width < 600
  const isNarrowPhone = width < 380

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)
    return () => subscription.remove()
  }, [])

  const openApp = () => router.push("/app")

  return (
    <>
      <Head>
        <title>{t("publicPageTitle")}</title>
        <meta name="description" content={t("publicPageDescription")} />
      </Head>
      <Animated.ScrollView
        ref={scrollRef}
        style={styles.screen}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.topBar, isWide && styles.topBarWide, isPhone && styles.topBarPhone]}>
          <View style={styles.brandRow} accessibilityRole="header">
            <View style={styles.brandMark} />
            <Text style={styles.brandName}>CommonShelf</Text>
          </View>
          <View style={[styles.topActions, isPhone && styles.topActionsPhone, isNarrowPhone && styles.topActionsNarrow]}>
            <LanguageSwitch />
            <View style={styles.authLinks}>
              <Pressable accessibilityRole="link" onPress={() => router.push("/login")} style={({ pressed }) => [styles.authLink, pressed && styles.pressed]}>
                <Text style={styles.loginLinkText}>{t("login")}</Text>
              </Pressable>
              <Text style={styles.authSeparator} accessibilityElementsHidden>|</Text>
              <Pressable accessibilityRole="link" onPress={() => router.push("/signup")} style={({ pressed }) => [styles.authLink, pressed && styles.pressed]}>
                <Text style={styles.signupLinkText}>{t("signupNow")}</Text>
              </Pressable>
            </View>
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
              <AppButton title={t("openApp")} onPress={openApp} style={isWide ? styles.actionWide : undefined} />
            </View>
          </GentleEntrance>

          <GentleEntrance delay={110} style={[styles.artColumn, isWide && styles.artColumnWide]}>
            <View style={styles.artScene}>
              <View style={[styles.skyDot, styles.skyDotOne]} />
              <View style={[styles.skyDot, styles.skyDotTwo]} />
              <View style={styles.artHalo} />
              <Image accessibilityLabel={t("heroImageLabel")} source={heroArt} style={styles.heroArt} resizeMode="contain" />
              <View style={styles.scribble} />
            </View>
            <Pressable
              accessibilityRole="link"
              onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, problemY - 20), animated: !reduceMotion })}
              style={({ pressed }) => [styles.exploreCue, pressed && styles.pressed]}
            >
              <Text style={styles.exploreCueText}>{t("scrollDownExplore")}</Text>
              <Ionicons name="arrow-down" size={15} color={palette.accentDark} />
            </Pressable>
          </GentleEntrance>
        </View>

        <View onLayout={(event) => setProblemY(event.nativeEvent.layout.y)} style={[styles.problemSection, isWide && styles.problemSectionWide]}>
          <View style={styles.problemIcon}>
            <Ionicons name="book-outline" size={27} color={palette.accentDark} />
          </View>
          <View style={styles.problemCopy}>
            <Text style={[styles.sectionKicker, styles.problemKicker]}>{t("problemKicker")}</Text>
            <Text accessibilityRole="header" style={styles.problemTitle}>{t("problemTitle")}</Text>
            <Text style={styles.problemBody}>{t("problemBody")}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.howSection]}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>{t("howItWorks")}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t("fromShelfToShare")}</Text>
          </View>
          <View style={styles.howSteps}>
            <HowStep number="01" image={howImages.add} title={t("howStepOneTitle")} body={t("howStepOneBody")} compact={isHowCompact} phone={isPhone} narrow={isNarrowPhone} />
            <HowStep number="02" image={howImages.discover} title={t("howStepTwoTitle")} body={t("howStepTwoBody")} compact={isHowCompact} phone={isPhone} narrow={isNarrowPhone} />
            <HowStep number="03" image={howImages.match} title={t("howStepThreeTitle")} body={t("howStepThreeBody")} compact={isHowCompact} phone={isPhone} narrow={isNarrowPhone} />
          </View>
        </View>

        <View style={[styles.section, styles.featuresSection]}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>{t("featuresKicker")}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t("featuresTitle")}</Text>
          </View>
          <View style={styles.pageGrid}>
            <PageCard icon="compass-outline" title={t("explore")} body={t("explorePageBody")} color={palette.orangeSoft} isWide={isWide} />
            <PageCard icon="search-outline" title={t("search")} body={t("searchPageBody")} color={palette.blueSoft} isWide={isWide} />
            <PageCard icon="library-outline" title={t("library")} body={t("libraryPageBody")} color={palette.roseSoft} isWide={isWide} />
            <PageCard icon="swap-horizontal-outline" title={t("matches")} body={t("matchesPageBody")} color={palette.accentSoft} isWide={isWide} />
            <PageCard icon="settings-outline" title={t("settings")} body={t("settingsPageBody")} color={palette.yellow} isWide={isWide} />
            <PageCard icon="mail-unread-outline" title={t("inbox")} body={t("inboxPageBody")} color={palette.blueSoft} isWide={isWide} />
          </View>
        </View>

        <View style={[styles.section, styles.previewSection]}>
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
            <LandingBookRail books={previewRows[0]} reduceMotion={reduceMotion} showCommunity coverSources={HOME_PREVIEW_COVERS} onBookPress={openApp} />
            <LandingBookRail books={previewRows[1]} direction="right" reduceMotion={reduceMotion} showCommunity coverSources={HOME_PREVIEW_COVERS} onBookPress={openApp} />
            <View style={styles.previewFooter}>
              <Ionicons name="lock-closed-outline" size={14} color={palette.textMuted} />
              <Text style={styles.previewFooterText}>{t("samplePreviewNotice")}</Text>
            </View>
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
          <AppButton title={t("openApp")} onPress={openApp} style={styles.finalButton} />
          <Pressable accessibilityRole="link" onPress={() => router.push("/login")} style={({ pressed }) => [styles.existingAccount, pressed && styles.pressed]}>
            <Text style={styles.existingAccountText}>{t("alreadyAccount")}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>CommonShelf</Text>
          <Text style={styles.footerText}>{t("heroNote")}</Text>
          <LegalLinks />
        </View>
      </Animated.ScrollView>
    </>
  )
}

function HowStep({ number, image, title, body, compact, phone, narrow }: { number: string; image: ImageSourcePropType; title: string; body: string; compact: boolean; phone: boolean; narrow: boolean }) {
  return (
    <View style={[styles.howStep, compact && styles.howStepCompact, phone && styles.howStepPhone, narrow && styles.howStepNarrow]}>
      <View style={[styles.howStepVisual, compact && styles.howStepVisualCompact, phone && styles.howStepVisualPhone, narrow && styles.howStepVisualNarrow]}>
        <Image source={image} style={styles.howStepImage} resizeMode="contain" accessibilityLabel={title} />
      </View>
      <View style={styles.howStepCopy}>
        <Text style={styles.howStepNumber}>{number}</Text>
        <Text accessibilityRole="header" style={[styles.howStepTitle, phone && styles.howStepTitlePhone, narrow && styles.howStepTitleNarrow]}>{title}</Text>
        <Text style={[styles.howStepBody, phone && styles.howStepBodyPhone]}>{body}</Text>
      </View>
    </View>
  )
}

function PageCard({ icon, title, body, color, isWide }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; color: string; isWide: boolean }) {
  return (
    <View style={[styles.pageCard, isWide && styles.pageCardWide]}>
      <View style={styles.pageCardHeading}>
        <View style={[styles.pageCardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon} size={22} color={palette.ink} />
        </View>
        <Text accessibilityRole="header" style={styles.pageCardTitle}>{title}</Text>
      </View>
      <Text style={styles.pageCardBody}>{body}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  page: { flexGrow: 1, paddingBottom: 28 },
  topBar: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", minHeight: 72, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4 },
  topBarWide: { minHeight: 84 },
  topBarPhone: { minHeight: 0, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10, alignItems: "stretch", flexDirection: "column", gap: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandMark: { width: 15, height: 22, borderRadius: 4, backgroundColor: palette.orange, borderWidth: 1.5, borderColor: palette.borderStrong, transform: [{ rotate: "-6deg" }] },
  brandName: { fontFamily: typography.serif, fontSize: 18, fontWeight: "800", color: palette.ink },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  topActionsPhone: { width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 4 },
  topActionsNarrow: { flexDirection: "column", alignItems: "flex-end", justifyContent: "flex-start", gap: 0 },
  authLinks: { flexDirection: "row", alignItems: "center" },
  authLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 7 },
  authSeparator: { color: palette.borderStrong, fontSize: 14 },
  loginLinkText: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  signupLinkText: { color: palette.accentDark, fontSize: 13, fontWeight: "800" },
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
  exploreCue: { minHeight: 44, alignSelf: "flex-end", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 4 },
  exploreCueText: { color: palette.accentDark, fontSize: 13, fontWeight: "800" },
  artColumn: { width: "100%", height: 380, alignItems: "stretch", marginTop: 24 },
  artColumnWide: { flex: 1.05, height: 550, marginTop: 0 },
  artScene: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", position: "relative" },
  artHalo: { position: "absolute", width: "88%", aspectRatio: 1, maxWidth: 490, borderRadius: 999, backgroundColor: palette.yellow, opacity: 0.46, transform: [{ rotate: "-5deg" }] },
  heroArt: { width: "100%", height: "100%", zIndex: 2 },
  skyDot: { position: "absolute", borderWidth: 1.5, borderColor: palette.borderStrong, zIndex: 3 },
  skyDotOne: { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.blue, left: "7%", top: "16%" },
  skyDotTwo: { width: 13, height: 13, borderRadius: 7, backgroundColor: palette.rose, right: "5%", top: "28%" },
  scribble: { position: "absolute", bottom: 18, width: "62%", height: 6, borderRadius: 99, backgroundColor: palette.green, opacity: 0.7, transform: [{ rotate: "-2deg" }] },
  problemSection: { width: "90%", maxWidth: 920, alignSelf: "center", marginVertical: 34, paddingHorizontal: 24, paddingVertical: 30, backgroundColor: palette.accentDark, borderRadius: radii.lg, gap: 20 },
  problemSectionWide: { flexDirection: "row", alignItems: "center", paddingHorizontal: 40, paddingVertical: 38, gap: 30 },
  problemIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: palette.accentSoft, alignItems: "center", justifyContent: "center", alignSelf: "flex-start" },
  problemCopy: { flex: 1 },
  problemKicker: { color: palette.paper, opacity: 0.82 },
  problemTitle: { maxWidth: 720, fontFamily: typography.serif, color: palette.paper, fontSize: 29, lineHeight: 35, fontWeight: "700" },
  problemBody: { maxWidth: 720, color: palette.background, opacity: 0.78, fontSize: 15, lineHeight: 23, marginTop: 10 },
  section: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 58 },
  howSection: { backgroundColor: palette.background, paddingTop: 76, paddingBottom: 96 },
  howSteps: { width: "100%", maxWidth: 940, alignSelf: "center", gap: 76 },
  howStep: { width: "100%", minHeight: 290, flexDirection: "row", alignItems: "center", gap: 56 },
  howStepCompact: { minHeight: 220, gap: 36 },
  howStepPhone: { minHeight: 180, gap: 20 },
  howStepNarrow: { gap: 16 },
  howStepVisual: { width: 330, height: 300, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  howStepVisualCompact: { width: 230, height: 220 },
  howStepVisualPhone: { width: 165, height: 175 },
  howStepVisualNarrow: { width: 128, height: 145 },
  howStepImage: { width: "100%", height: "100%" },
  howStepCopy: { flex: 1, minWidth: 0, maxWidth: 510, justifyContent: "center", alignItems: "flex-start" },
  howStepNumber: { color: palette.accentDark, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 2, marginBottom: 9 },
  howStepTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 31, lineHeight: 38, fontWeight: "700" },
  howStepTitlePhone: { fontSize: 27, lineHeight: 32 },
  howStepTitleNarrow: { fontSize: 24, lineHeight: 29 },
  howStepBody: { color: palette.textMuted, fontSize: 15, lineHeight: 24, marginTop: 9, maxWidth: 470 },
  howStepBodyPhone: { fontSize: 14, lineHeight: 21 },
  featuresSection: { maxWidth: "100%", backgroundColor: palette.surfaceMuted, paddingHorizontal: 20 },
  pageGrid: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", gap: 14 },
  pageCard: { width: "100%", minHeight: 200, backgroundColor: palette.paper, padding: 22, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, ...shadows.soft },
  pageCardWide: { width: "31%", minWidth: 270, flexGrow: 1 },
  pageCardHeading: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 19 },
  pageCardIcon: { width: 52, height: 52, flexShrink: 0, borderRadius: 16, borderWidth: 1.5, borderColor: palette.borderStrong, alignItems: "center", justifyContent: "center" },
  pageCardTitle: { flex: 1, minWidth: 0, fontFamily: typography.serif, color: palette.ink, fontSize: 23, lineHeight: 28, fontWeight: "700" },
  pageCardBody: { color: palette.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
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
