import { Ionicons } from "@expo/vector-icons"
import { useFocusEffect, useRouter } from "expo-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AccessibilityInfo,
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import AdminBadge from "@/components/AdminBadge"
import { BookDoodles } from "@/components/BookDoodles"
import GentleEntrance from "@/components/GentleEntrance"
import LandingBookRail from "@/components/LandingBookRail"
import { HOME_PREVIEW_BOOKS, HOME_PREVIEW_COVERS } from "@/constants/homePreviewBooks"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { searchBooks, type Book } from "@/services/books"
import { getInbox, type InboxResponse } from "@/services/inbox"
import { getProfile, type Profile } from "@/services/profile"
import { useTranslation } from "@/localization/LanguageContext"
import { subscribeToBackgroundActions } from "@/utils/backgroundAction"

type FeedOutcome = { books: Book[] } | { error: unknown }

const appIcon = require("../../assets/images/icon.png")

export default function Home() {
  const { t } = useTranslation()
  const router = useRouter()
  const { width } = useWindowDimensions()
  const isWide = width >= 880
  const cachedProfile = getCachedApiData<Profile>("/profile/me/")
  const cachedInbox = getCachedApiData<InboxResponse>("/inbox/")
  const cachedCommunityBooks = getCachedApiData<Book[]>("/books/search?scope=community")

  const [profile, setProfile] = useState<Profile | null>(() => cachedProfile ?? null)
  const profileRef = useRef<Profile | null>(cachedProfile ?? null)
  const [profileLoading, setProfileLoading] = useState(() => !cachedProfile)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(() => cachedInbox?.unread_count ?? 0)
  const [books, setBooks] = useState<Book[]>(() => {
    if (!cachedProfile) return []
    return cachedProfile.community_id ? cachedCommunityBooks ?? [] : HOME_PREVIEW_BOOKS
  })
  const [booksLoading, setBooksLoading] = useState(() => {
    if (!cachedProfile) return true
    return cachedProfile.community_id ? cachedCommunityBooks === undefined : false
  })
  const [booksError, setBooksError] = useState<string | null>(null)
  const [reduceMotion, setReduceMotion] = useState(false)
  const booksScope = useRef<string | null>(cachedProfile ? cachedProfile.community_id ?? "preview" : null)
  const booksHaveLoaded = useRef(Boolean(cachedProfile && (!cachedProfile.community_id || cachedCommunityBooks !== undefined)))
  const booksRefreshGeneration = useRef(0)
  const inboxUpdatePending = useRef(false)
  const inboxRefreshGeneration = useRef(0)

  const refreshInbox = useCallback((forceRefresh = false) => {
    const refreshGeneration = ++inboxRefreshGeneration.current
    void getInbox(forceRefresh)
      .then((inbox) => {
        if (!inboxUpdatePending.current && refreshGeneration === inboxRefreshGeneration.current) {
          setUnreadCount(inbox.unread_count)
        }
      })
      .catch((error) => console.error("Failed to load inbox summary", error))
  }, [])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)
    return () => subscription.remove()
  }, [])

  useEffect(() => subscribeToBackgroundActions((update) => {
    if (update.event !== "inbox-unread-count") return

    if (update.status === "pending" && typeof update.optimisticResult === "number") {
      inboxUpdatePending.current = true
      inboxRefreshGeneration.current += 1
      setUnreadCount(update.optimisticResult)
      return
    }

    inboxUpdatePending.current = false
    refreshInbox(true)
  }), [refreshInbox])

  const loadBooks = useCallback(async (currentProfile: Profile, pendingFeed?: Promise<FeedOutcome>) => {
    const nextScope = currentProfile.community_id ?? "preview"
    const refreshGeneration = ++booksRefreshGeneration.current
    const hasCurrentSnapshot = booksHaveLoaded.current && booksScope.current === nextScope

    if (!hasCurrentSnapshot) {
      if (booksScope.current !== nextScope) setBooks([])
      booksScope.current = nextScope
      booksHaveLoaded.current = false
      setBooksLoading(true)
    }
    setBooksError(null)

    try {
      let nextBooks = HOME_PREVIEW_BOOKS
      if (currentProfile.community_id) {
        const feedOutcome = pendingFeed ? await pendingFeed : { books: await searchBooks("", "community") }
        if ("error" in feedOutcome) throw feedOutcome.error
        nextBooks = feedOutcome.books
      }
      if (refreshGeneration !== booksRefreshGeneration.current) return

      booksScope.current = nextScope
      booksHaveLoaded.current = true
      setBooks(nextBooks)
    } catch (error) {
      if (refreshGeneration !== booksRefreshGeneration.current) return
      console.error("Failed to load landing-page books", error)
      if (!hasCurrentSnapshot) setBooks([])
      setBooksError(
        currentProfile.community_id
          ? "We couldn’t open your community shelf right now."
          : "We couldn’t open the community preview right now.",
      )
    } finally {
      if (refreshGeneration === booksRefreshGeneration.current) setBooksLoading(false)
    }
  }, [])

  const loadHome = useCallback(async () => {
    if (!profileRef.current) setProfileLoading(true)
    setProfileError(null)
    const knownCommunityId = profileRef.current?.community_id
    const pendingFeed: Promise<FeedOutcome> | undefined = knownCommunityId
      ? searchBooks("", "community").then((books) => ({ books }), (error) => ({ error }))
      : undefined

    let nextProfile: Profile
    try {
      nextProfile = await getProfile()
    } catch (error) {
      console.error("Failed to load profile", error)
      if (!profileRef.current) setProfileError("We couldn’t open your reading room right now.")
      setProfileLoading(false)
      return
    }

    profileRef.current = nextProfile
    setProfile(nextProfile)
    setProfileLoading(false)
    await loadBooks(
      nextProfile,
      knownCommunityId === nextProfile.community_id ? pendingFeed : undefined,
    )
  }, [loadBooks])

  useFocusEffect(useCallback(() => {
    refreshInbox()
    void loadHome()
  }, [loadHome, refreshInbox]))

  const hasCommunity = Boolean(profile?.community_id)
  const communityName = profile?.community_name || "your community"
  const shelfBooks = books
  const previewRows = useMemo(() => {
    const visible = shelfBooks.slice(0, 10)
    const midpoint = Math.max(1, Math.ceil(visible.length / 2))
    return [visible.slice(0, midpoint), visible.slice(midpoint)]
  }, [shelfBooks])

  if (profileLoading && !profile) return <MembershipLoading />

  if (!profile && profileError) {
    return (
      <View style={styles.fullState}>
        <BookDoodles compact />
        <Text style={styles.stateTitle}>{t("shelfTucked")}</Text>
        <Text style={styles.stateText}>{profileError}</Text>
        <PrimaryAction label={t("tryAgainAction")} icon="refresh" onPress={loadHome} />
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <HomeHeader
          profile={profile}
          unreadCount={unreadCount}
          onInbox={() => router.push("/inbox")}
          onSettings={() => router.push("/settings")}
          onFindCommunity={() => router.push("/communities/search")}
        />

        <View style={[styles.landingGrid, isWide && styles.landingGridWide]}>
          <GentleEntrance style={[styles.hero, isWide && styles.heroWide]}>
            <View style={styles.heroDecor} pointerEvents="none">
              <View style={styles.heroDot} />
              <View style={styles.heroDash} />
            </View>
            <View style={styles.heroEyebrowRow}>
              <Ionicons name={hasCommunity ? "library-outline" : "people-outline"} size={16} color={palette.accentDark} />
              <Text style={styles.heroEyebrow}>{hasCommunity ? t("communityShelf") : t("booksShared")}</Text>
            </View>

            {hasCommunity ? (
              <>
                <Text style={styles.heroTitle}>{t("nextFavorite")}</Text>
                <Text style={styles.heroBody}>{t("exploreCommunity", { name: communityName })}</Text>
                <View style={styles.heroActions}>
                  <PrimaryAction style={styles.heroAction} label={t("startSwiping")} icon="heart" onPress={() => router.push("/explore")} />
                </View>
              </>
            ) : (
              <>
                <Text style={styles.heroTitle}>{t("findReadingCommunity")}</Text>
                <Text style={styles.heroBody}>{t("joinCommunityBody")}</Text>
                <PrimaryAction label={t("findMyCommunity")} icon="navigate" onPress={() => router.push("/communities/search")} />
                <View style={styles.communityTypes} accessibilityLabel={t("communityTypesLabel")}>
                  <CommunityType icon="home-outline" label={t("neighborhood")} />
                  <CommunityType icon="business-outline" label={t("workplace")} />
                  <CommunityType icon="school-outline" label={t("school")} />
                </View>
              </>
            )}
          </GentleEntrance>

          <GentleEntrance delay={120} style={[styles.shelfSection, isWide && styles.shelfSectionWide]}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionEyebrow}>{hasCommunity ? t("sharedNearby") : t("peekInside")}</Text>
                <Text style={styles.sectionTitle}>{hasCommunity ? t("shelvesIn", { name: communityName }) : t("booksFindingReaders")}</Text>
              </View>
              {hasCommunity && shelfBooks.length > 0 ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => router.push("/explore")}
                  style={({ pressed }) => [styles.textLink, pressed && styles.pressed]}
                >
                  <Text style={styles.textLinkLabel}>{t("seeAllBooks")}</Text>
                  <Ionicons name="arrow-forward" size={16} color={palette.accentDark} />
                </Pressable>
              ) : null}
            </View>

            {booksError && books.length > 0 ? <Text style={styles.shelfRefreshError}>{booksError}</Text> : null}
            {booksLoading ? (
              <BookPreviewLoading />
            ) : booksError && books.length === 0 ? (
              <ShelfState
                icon="cloud-offline-outline"
                title="The shelf won’t open just yet."
                body={booksError}
                actionLabel="Try again"
                onAction={() => profile && loadBooks(profile)}
              />
            ) : shelfBooks.length === 0 ? (
              hasCommunity ? (
                <ShelfState
                  icon="library-outline"
                  title={t("communityShelfFirstStory")}
                  body={t("addBookDiscoverReader")}
                  actionLabel={t("addBookLabel")}
                  onAction={() => router.push("/books/new")}
                />
              ) : (
                <ShelfState
                  icon="people-outline"
                  title="Communities are filling their shelves."
                  body="Join one to start discovering books near you."
                  actionLabel="Find my community"
                  onAction={() => router.push("/communities/search")}
                />
              )
            ) : hasCommunity ? (
              <View style={styles.railPaper}>
                <LandingBookRail
                  books={shelfBooks.slice(0, 7)}
                  reduceMotion={reduceMotion}
                  onRailPress={() => router.push("/explore")}
                  railAccessibilityLabel={t("startSwiping")}
                />
                <View style={styles.shelfLine} />
                <Text style={styles.shelfHint}>{t("tapBook")}</Text>
              </View>
            ) : (
              <View style={styles.previewScene}>
                <LandingBookRail
                  books={previewRows[0]}
                  coverSources={HOME_PREVIEW_COVERS}
                  direction="left"
                  reduceMotion={reduceMotion}
                  showCommunity
                  onBookPress={() => router.push("/communities/search")}
                />
                {previewRows[1].length > 0 ? (
                  <LandingBookRail
                    books={previewRows[1]}
                    coverSources={HOME_PREVIEW_COVERS}
                    direction="right"
                    reduceMotion={reduceMotion}
                    showCommunity
                    onBookPress={() => router.push("/communities/search")}
                  />
                ) : null}
                <View style={styles.previewFooter}>
                  <Ionicons name="lock-closed-outline" size={14} color={palette.textMuted} />
                  <Text style={styles.previewFooterText}>{t("joinBeforeExchange")}</Text>
                </View>
              </View>
            )}
          </GentleEntrance>
        </View>
      </ScrollView>
    </View>
  )
}

function HomeHeader({
  profile,
  unreadCount,
  onInbox,
  onSettings,
  onFindCommunity,
}: {
  profile: Profile | null
  unreadCount: number
  onInbox: () => void
  onSettings: () => void
  onFindCommunity: () => void
}) {
  const { t } = useTranslation()
  return (
    <View style={styles.header}>
      <View style={styles.headerDetails}>
        <View style={styles.headerBrand}>
          <Image source={appIcon} style={styles.headerBrandIcon} resizeMode="contain" />
          <Text style={styles.headerEyebrow}>CommonShelf</Text>
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{t("helloReader", { name: profile?.display_name || t("reader") })}</Text>
          {profile?.admin ? <AdminBadge /> : null}
        </View>
        {profile?.community_name ? <Text style={styles.headerCommunity}>{profile.community_name}</Text> : (
          <Pressable onPress={onFindCommunity} accessibilityRole="link" style={styles.joinTarget}>
            <Text style={styles.joinCommunityPrompt}>{t("findCommunityNear")}</Text>
          </Pressable>
        )}
        {profile?.community_location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={palette.textMuted} />
            <Text numberOfLines={1} style={styles.location}>{profile.community_location.display_name}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.headerActions}>
        <HeaderAction icon="mail-outline" label={t("openMessages")} onPress={onInbox} badge={unreadCount} />
        <HeaderAction icon="settings-outline" label={t("openSettings")} onPress={onSettings} />
      </View>
    </View>
  )
}

function HeaderAction({ icon, label, onPress, badge = 0 }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} onPress={onPress} accessibilityLabel={label}>
      <Ionicons name={icon} size={21} color={palette.ink} />
      {badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text></View> : null}
    </Pressable>
  )
}

function PrimaryAction({ label, icon, onPress, style }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryAction, style, pressed && styles.actionPressed]}>
      <Text style={styles.primaryActionText}>{label}</Text>
      <Ionicons name={icon} size={19} color={palette.paper} />
    </Pressable>
  )
}

function SecondaryAction({ label, icon, onPress, style }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.secondaryAction, style, pressed && styles.actionPressed]}>
      <Ionicons name={icon} size={18} color={palette.ink} />
      <Text style={styles.secondaryActionText}>{label}</Text>
    </Pressable>
  )
}

function CommunityType({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return <View style={styles.communityType}><Ionicons name={icon} size={16} color={palette.ink} /><Text style={styles.communityTypeText}>{label}</Text></View>
}

function MembershipLoading() {
  const { t } = useTranslation()
  return (
    <View style={styles.fullState} accessibilityLabel={t("loadingMembership")}>
      <View style={styles.loadingBook}>
        <View style={styles.loadingBookmark} />
        <ActivityIndicator color={palette.accentDark} />
      </View>
      <Text style={styles.stateTitle}>{t("openingRoom")}</Text>
      <Text style={styles.stateText}>{t("findingShelf")}</Text>
    </View>
  )
}

function BookPreviewLoading() {
  const { t } = useTranslation()
  return (
    <View style={styles.loadingShelf} accessibilityLabel={t("loadingBooks")}>
      {[palette.blueSoft, palette.roseSoft, palette.accentSoft].map((color, index) => (
        <View key={index} style={[styles.skeletonBook, { backgroundColor: color, transform: [{ rotate: index === 1 ? "1deg" : "-1deg" }] }]}>
          <ActivityIndicator color={palette.textMuted} />
        </View>
      ))}
      <View style={styles.loadingShelfLine} />
    </View>
  )
}

function ShelfState({ icon, title, body, actionLabel, onAction }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; actionLabel: string; onAction: () => void }) {
  return (
    <View style={styles.shelfState}>
      <View style={styles.stateIllustration}>
        <Ionicons name={icon} size={31} color={palette.ink} />
        <View style={styles.stateBookmark} />
      </View>
      <Text style={styles.shelfStateTitle}>{title}</Text>
      <Text style={styles.shelfStateText}>{body}</Text>
      <SecondaryAction label={actionLabel} icon="arrow-forward" onPress={onAction} />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, width: "100%", maxWidth: layout.contentMax, alignSelf: "center", paddingHorizontal: 18, paddingTop: 14, paddingBottom: 112, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  headerDetails: { flex: 1, minWidth: 0 },
  headerBrand: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  headerBrandIcon: { width: 18, height: 18, borderRadius: 4 },
  headerEyebrow: { fontSize: 10, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: palette.accentDark },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { fontFamily: typography.serif, fontSize: 25, lineHeight: 31, fontWeight: "700", color: palette.ink },
  headerCommunity: { fontSize: 14, color: palette.textMuted, marginTop: 3 },
  joinTarget: { minHeight: 38, justifyContent: "center", alignSelf: "flex-start" },
  joinCommunityPrompt: { fontSize: 13, color: palette.accentDark, fontWeight: "800", textDecorationLine: "underline" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2, minWidth: 0 },
  location: { flexShrink: 1, fontSize: 12, color: palette.textMuted },
  headerActions: { flexDirection: "row", gap: 7 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong },
  pressed: { transform: [{ scale: 0.94 }] },
  badge: { position: "absolute", right: -4, top: -4, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: palette.danger, borderWidth: 2, borderColor: palette.background },
  badgeText: { color: palette.paper, fontSize: 9, fontWeight: "800" },
  landingGrid: { gap: 36 },
  landingGridWide: { flexDirection: "row", alignItems: "stretch", gap: 24, paddingTop: 18 },
  hero: { position: "relative", overflow: "hidden", backgroundColor: palette.yellow, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, borderCurve: "continuous", padding: 20, ...shadows.soft },
  heroWide: { flex: 0.84, justifyContent: "center", padding: 30, minHeight: 560 },
  heroDecor: { position: "absolute", inset: 0 },
  heroDot: { position: "absolute", width: 90, height: 90, borderRadius: 45, right: -30, top: -28, backgroundColor: palette.rose, opacity: 0.6 },
  heroDash: { position: "absolute", width: 82, height: 6, borderRadius: 4, right: 22, bottom: 20, backgroundColor: palette.orange, transform: [{ rotate: "-3deg" }], opacity: 0.75 },
  heroEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10 },
  heroEyebrow: { fontSize: 11, fontWeight: "900", letterSpacing: 1.3, textTransform: "uppercase", color: palette.accentDark },
  heroTitle: { maxWidth: 540, fontFamily: typography.serif, fontSize: 34, lineHeight: 38, fontWeight: "700", color: palette.ink },
  heroBody: { maxWidth: 510, marginTop: 12, fontSize: 15, lineHeight: 22, color: palette.textMuted },
  heroActions: { marginTop: 8, flexDirection: "row", alignItems: "stretch", gap: 10 },
  heroAction: { flex: 1, minWidth: 0, height: 48, minHeight: 48, marginTop: 16, paddingHorizontal: 10 },
  primaryAction: { minHeight: 52, marginTop: 16, paddingHorizontal: 19, borderRadius: radii.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: palette.accent, borderWidth: 1.5, borderColor: palette.accentDark, ...shadows.soft },
  primaryActionText: { color: palette.paper, fontSize: 15, fontWeight: "900" },
  secondaryAction: { minHeight: 48, marginTop: 10, paddingHorizontal: 16, borderRadius: radii.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong },
  secondaryActionText: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  actionPressed: { transform: [{ scale: 0.97 }], shadowOpacity: 0.03 },
  communityTypes: { marginTop: 14, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  communityType: { minHeight: 34, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 99, backgroundColor: "rgba(255,252,245,0.66)", borderWidth: 1, borderColor: palette.borderStrong },
  communityTypeText: { color: palette.ink, fontSize: 10, fontWeight: "700" },
  shelfSection: { minWidth: 0 },
  shelfSectionWide: { flex: 1.16, justifyContent: "center", minHeight: 560 },
  sectionHeadingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 9, paddingHorizontal: 2 },
  sectionHeadingCopy: { flex: 1, minWidth: 0 },
  sectionEyebrow: { color: palette.orange, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3 },
  sectionTitle: { fontFamily: typography.serif, color: palette.ink, fontSize: 21, lineHeight: 26, fontWeight: "700" },
  shelfRefreshError: { marginBottom: 9, color: palette.danger, fontSize: 12 },
  textLink: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingHorizontal: 4 },
  textLinkLabel: { color: palette.accentDark, fontSize: 12, fontWeight: "800", textDecorationLine: "underline" },
  railPaper: { backgroundColor: palette.blueSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, overflow: "hidden", paddingTop: 13, ...shadows.soft },
  shelfLine: { height: 9, marginTop: 4, marginHorizontal: 10, borderTopWidth: 2, borderColor: palette.borderStrong, backgroundColor: palette.orangeSoft, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  shelfHint: { textAlign: "center", color: palette.textMuted, fontSize: 11, paddingVertical: 9, fontStyle: "italic" },
  previewScene: { backgroundColor: palette.roseSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, overflow: "hidden", paddingVertical: 9, ...shadows.soft },
  previewFooter: { minHeight: 38, marginHorizontal: 10, marginTop: 3, paddingHorizontal: 10, borderTopWidth: 1, borderColor: palette.border, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  previewFooterText: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  fullState: { flex: 1, width: "100%", maxWidth: "100%", minWidth: 0, overflow: "hidden", alignItems: "center", justifyContent: "center", gap: 10, padding: 26, backgroundColor: palette.background },
  loadingBook: { width: 76, height: 58, borderRadius: 9, borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-3deg" }] },
  loadingBookmark: { position: "absolute", top: -2, right: 13, width: 11, height: 24, backgroundColor: palette.orange },
  stateTitle: { width: "100%", maxWidth: 440, color: palette.ink, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", textAlign: "center" },
  stateText: { width: "100%", maxWidth: 440, color: palette.textMuted, fontSize: 13, textAlign: "center" },
  loadingShelf: { height: 244, flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 12, backgroundColor: palette.surfaceMuted, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, paddingBottom: 18, overflow: "hidden" },
  skeletonBook: { width: 94, height: 180, borderRadius: radii.sm, borderWidth: 1.5, borderColor: palette.border, alignItems: "center", justifyContent: "center" },
  loadingShelfLine: { position: "absolute", left: 12, right: 12, bottom: 12, height: 7, borderRadius: 3, backgroundColor: palette.orange, borderWidth: 1, borderColor: palette.borderStrong },
  shelfState: { alignItems: "center", backgroundColor: palette.surfaceMuted, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, padding: 22, ...shadows.soft },
  stateIllustration: { width: 76, height: 58, alignItems: "center", justifyContent: "center", backgroundColor: palette.blue, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, transform: [{ rotate: "-2deg" }], marginBottom: 12 },
  stateBookmark: { position: "absolute", width: 10, height: 24, right: 11, top: -3, backgroundColor: palette.rose },
  shelfStateTitle: { maxWidth: 390, fontFamily: typography.serif, color: palette.ink, fontSize: 20, lineHeight: 25, fontWeight: "700", textAlign: "center" },
  shelfStateText: { maxWidth: 390, marginTop: 6, color: palette.textMuted, fontSize: 13, lineHeight: 19, textAlign: "center" },
})
