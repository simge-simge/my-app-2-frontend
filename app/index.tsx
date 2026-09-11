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
const appIcon = require("../assets/images/icon.png")
const howImages = {
  add: require("../assets/images/home_display/add_your_books.png"),
  discover: require("../assets/images/home_display/discover_nearby_reads.png"),
  match: require("../assets/images/home_display/match_and_exchange.png"),
}
const previewRows = [HOME_PREVIEW_BOOKS.slice(0, 5), HOME_PREVIEW_BOOKS.slice(5)]

export default function Index() {
  const { language, setLanguage, t } = useTranslation()
  const { width, height } = useWindowDimensions()
  const scrollRef = useRef<ScrollView>(null)
  const [problemY, setProblemY] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false)
  const isWide = width >= 800
  const isHowMobile = width < 768
  const isHowTablet = width >= 768 && width < 1000
  const isPhone = width < 600
  const isNarrowPhone = width < 380
  const mobileHeroStyle = isPhone
    ? { minHeight: Math.max(0, height - 78), paddingBottom: Math.max(18, Math.min(30, Math.round(height * 0.035))) }
    : undefined
  const mobileArtStyle = isPhone
    ? { height: Math.max(230, Math.min(390, Math.round(height * 0.42))) }
    : undefined

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
        <View style={[styles.topBar, isWide && styles.topBarWide, isPhone && styles.topBarPhone, isNarrowPhone && styles.topBarNarrow]}>
          <View style={[styles.brandRow, isPhone && styles.brandRowPhone, isNarrowPhone && styles.brandRowNarrow]} accessibilityRole="header">
            <Image source={appIcon} style={[styles.brandIcon, isPhone && styles.brandIconPhone, isNarrowPhone && styles.brandIconNarrow]} resizeMode="contain" />
            <Text style={[styles.brandName, isPhone && styles.brandNamePhone, isNarrowPhone && styles.brandNameNarrow]}>CommonShelf</Text>
          </View>
          {isPhone ? (
            <View style={[styles.mobileHeaderActions, isNarrowPhone && styles.mobileHeaderActionsNarrow]}>
              <View style={styles.mobileLanguageControl}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t("chooseLanguage")}
                  accessibilityState={{ expanded: mobileLanguageOpen }}
                  onPress={() => setMobileLanguageOpen((open) => !open)}
                  style={({ pressed }) => [styles.mobileLanguageButton, isNarrowPhone && styles.mobileLanguageButtonNarrow, pressed && styles.pressed]}
                >
                  <Text style={[styles.mobileLanguageLabel, isNarrowPhone && styles.mobileControlTextNarrow]}>{language.toUpperCase()}</Text>
                  <Ionicons name={mobileLanguageOpen ? "chevron-up" : "chevron-down"} size={12} color={palette.textMuted} />
                </Pressable>
                {mobileLanguageOpen ? (
                  <View style={styles.mobileLanguageMenu}>
                    {(["tr", "en"] as const).map((option) => (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected: language === option }}
                        onPress={() => {
                          setLanguage(option)
                          setMobileLanguageOpen(false)
                        }}
                        style={({ pressed }) => [styles.mobileLanguageOption, language === option && styles.mobileLanguageOptionActive, pressed && styles.pressed]}
                      >
                        <Text style={[styles.mobileLanguageOptionText, language === option && styles.mobileLanguageOptionTextActive]}>{option.toUpperCase()}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
              <Pressable accessibilityRole="link" onPress={() => router.push("/signup")} style={({ pressed }) => [styles.mobileSignupLink, pressed && styles.pressed]}>
                <Text style={[styles.headerLinkText, styles.mobileSignupText, isNarrowPhone && styles.mobileControlTextNarrow]}>{t("signupNow")}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.topActions}>
              <LanguageSwitch />
              <Pressable accessibilityRole="link" onPress={() => router.push("/signup")} style={({ pressed }) => [styles.authLink, pressed && styles.pressed]}>
                <Text style={styles.headerLinkText}>{t("signupNow")}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.hero, isWide && styles.heroWide, isPhone && styles.heroPhone, mobileHeroStyle]}>
          <GentleEntrance style={[styles.copyColumn, isWide && styles.copyColumnWide]}>
            <View style={[styles.eyebrowRow, isPhone && styles.eyebrowRowPhone]}>
              <Ionicons name="book-outline" size={17} color={palette.accentDark} />
              <Text style={styles.eyebrow}>{t("publicEyebrow")}</Text>
            </View>
            <Text accessibilityRole="header" style={[styles.title, !isWide && styles.mobileTitle]}>{t("heroTitle")}</Text>
            <Text style={styles.subtitle}>{t("heroSubtitle")}</Text>
            <View style={[styles.actions, isWide && styles.actionsWide]}>
              <AppButton title={t("openApp")} onPress={openApp} style={isWide ? styles.actionWide : undefined} />
            </View>
          </GentleEntrance>

          <GentleEntrance delay={110} style={[styles.artColumn, isWide && styles.artColumnWide, isPhone && styles.artColumnPhone, mobileArtStyle]}>
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
          <View style={styles.problemCopy}>
            <Text accessibilityRole="header" style={styles.problemTitle}>{t("problemTitle")}</Text>
            <Text style={styles.problemBody}>{t("problemBody")}</Text>
          </View>
        </View>

        <View style={[styles.section, styles.howSection]}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>{t("howItWorks")}</Text>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t("fromShelfToShare")}</Text>
          </View>
          <View style={[styles.howSteps, isHowMobile && styles.howStepsMobile]}>
            <HowStep number="01" image={howImages.add} title={t("howStepOneTitle")} body={t("howStepOneBody")} mobile={isHowMobile} tablet={isHowTablet} />
            <HowStep number="02" image={howImages.discover} title={t("howStepTwoTitle")} body={t("howStepTwoBody")} mobile={isHowMobile} tablet={isHowTablet} />
            <HowStep number="03" image={howImages.match} title={t("howStepThreeTitle")} body={t("howStepThreeBody")} mobile={isHowMobile} tablet={isHowTablet} />
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

function HowStep({ number, image, title, body, mobile, tablet }: { number: string; image: ImageSourcePropType; title: string; body: string; mobile: boolean; tablet: boolean }) {
  return (
    <View style={[styles.howStep, tablet && styles.howStepTablet, mobile && styles.howStepMobile]}>
      <View style={[styles.howStepVisual, tablet && styles.howStepVisualTablet, mobile && styles.howStepVisualMobile]}>
        <Image source={image} style={styles.howStepImage} resizeMode="contain" accessibilityLabel={title} />
      </View>
      <View style={[styles.howStepCopy, mobile && styles.howStepCopyMobile]}>
        <Text style={styles.howStepNumber}>{number}</Text>
        <Text accessibilityRole="header" style={[styles.howStepTitle, mobile && styles.howStepTitleMobile]}>{title}</Text>
        <Text style={styles.howStepBody}>{body}</Text>
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
  topBar: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", minHeight: 72, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.lg },
  topBarWide: { minHeight: 84 },
  topBarPhone: { minHeight: 78, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 6, zIndex: 10 },
  topBarNarrow: { paddingHorizontal: 10, paddingVertical: 8, flexWrap: "wrap", rowGap: spacing.xs },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandRowPhone: { gap: 9 },
  brandRowNarrow: { gap: spacing.sm },
  brandIcon: { width: 34, height: 34 },
  brandIconPhone: { width: 27, height: 27 },
  brandIconNarrow: { width: 24, height: 24 },
  brandName: { fontFamily: typography.serif, fontSize: 18, fontWeight: "800", color: palette.ink },
  brandNamePhone: { fontSize: 21, fontWeight: "700" },
  brandNameNarrow: { fontSize: 19 },
  topActions: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  authLink: { minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  headerLinkText: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  mobileHeaderActions: { marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 6 },
  mobileHeaderActionsNarrow: { gap: spacing.xs },
  mobileSignupLink: { minHeight: 36, justifyContent: "center", paddingHorizontal: 12, backgroundColor: palette.accent, borderWidth: 1, borderColor: palette.accentDark, borderRadius: radii.round },
  mobileSignupText: { color: palette.paper, fontWeight: "800" },
  mobileLanguageControl: { position: "relative", zIndex: 20 },
  mobileLanguageButton: { minWidth: 42, minHeight: 40, paddingHorizontal: 5, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 2, borderRadius: radii.sm },
  mobileLanguageButtonNarrow: { minWidth: 36, paddingHorizontal: 2 },
  mobileLanguageLabel: { color: palette.textMuted, fontSize: 12, fontWeight: "800", letterSpacing: 0.4 },
  mobileLanguageMenu: { position: "absolute", top: 40, right: 0, width: 58, paddingVertical: 4, overflow: "hidden", backgroundColor: palette.paper, borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, shadowColor: palette.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  mobileLanguageOption: { minHeight: 36, alignItems: "center", justifyContent: "center" },
  mobileLanguageOptionActive: { backgroundColor: palette.accentSoft },
  mobileLanguageOptionText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  mobileLanguageOptionTextActive: { color: palette.accentDark, fontWeight: "900" },
  mobileControlTextNarrow: { fontSize: 11 },
  pressed: { opacity: 0.65 },
  hero: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 20, paddingTop: 26, paddingBottom: 64 },
  heroWide: { minHeight: 610, flexDirection: "row", alignItems: "center", gap: 64, paddingTop: 18, paddingBottom: 72 },
  heroPhone: { paddingTop: 28 },
  copyColumn: { width: "100%", maxWidth: 540, alignSelf: "center" },
  copyColumnWide: { flex: 0.95 },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  eyebrowRowPhone: { marginBottom: spacing.sm },
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
  artColumnPhone: { minHeight: 0, marginTop: "auto" },
  artScene: { flex: 1, width: "100%", alignItems: "center", justifyContent: "center", position: "relative" },
  artHalo: { position: "absolute", height: "88%", aspectRatio: 1, maxWidth: 490, borderRadius: 999, backgroundColor: palette.yellow, opacity: 0.46, transform: [{ rotate: "-5deg" }] },
  heroArt: { width: "100%", height: "100%", zIndex: 2 },
  skyDot: { position: "absolute", borderWidth: 1.5, borderColor: palette.borderStrong, zIndex: 3 },
  skyDotOne: { width: 18, height: 18, borderRadius: 9, backgroundColor: palette.blue, left: "7%", top: "16%" },
  skyDotTwo: { width: 13, height: 13, borderRadius: 7, backgroundColor: palette.rose, right: "5%", top: "28%" },
  scribble: { position: "absolute", bottom: 18, width: "62%", height: 6, borderRadius: 99, backgroundColor: palette.green, opacity: 0.7, transform: [{ rotate: "-2deg" }] },
  problemSection: { width: "90%", maxWidth: 920, alignSelf: "center", marginVertical: 34, paddingHorizontal: 24, paddingVertical: 30, backgroundColor: palette.accentDark, borderRadius: radii.lg, gap: 20 },
  problemSectionWide: { flexDirection: "row", alignItems: "center", paddingHorizontal: 40, paddingVertical: 38, gap: 30 },
  problemCopy: { flex: 1 },
  problemTitle: { maxWidth: 720, fontFamily: typography.serif, color: palette.paper, fontSize: 29, lineHeight: 35, fontWeight: "700" },
  problemBody: { maxWidth: 720, color: palette.background, opacity: 0.78, fontSize: 15, lineHeight: 23, marginTop: 10 },
  section: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 20, paddingVertical: 58 },
  howSection: { backgroundColor: palette.background, paddingTop: 32, paddingBottom: 72 },
  howSteps: { width: "100%", maxWidth: 940, alignSelf: "center", gap: 44 },
  howStepsMobile: { gap: 6 },
  howStep: { width: "100%", minHeight: 380, flexDirection: "row", alignItems: "center", gap: 56 },
  howStepTablet: { gap: 32 },
  howStepMobile: { minHeight: 0, flexDirection: "column", alignItems: "stretch", gap: 22 },
  howStepVisual: { width: "44%", maxWidth: 420, aspectRatio: 1, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  howStepVisualTablet: { width: "44%", maxWidth: 360 },
  howStepVisualMobile: { width: "100%", maxWidth: 520, alignSelf: "center" },
  howStepImage: { width: "100%", height: "100%" },
  howStepCopy: { flex: 1, minWidth: 0, maxWidth: 510, justifyContent: "center", alignItems: "flex-start" },
  howStepCopyMobile: { flex: 0, width: "100%", maxWidth: 600, alignSelf: "center" },
  howStepNumber: { color: palette.accentDark, fontSize: 11, lineHeight: 15, fontWeight: "900", letterSpacing: 2, marginBottom: 9 },
  howStepTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 31, lineHeight: 38, fontWeight: "700" },
  howStepTitleMobile: { fontSize: 27, lineHeight: 32 },
  howStepBody: { color: palette.textMuted, fontSize: 15, lineHeight: 24, marginTop: 9, maxWidth: 470 },
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
  dataCard: { width: "90%", maxWidth: 920, backgroundColor: palette.accentSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, padding: 24, marginVertical: 46 },
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
