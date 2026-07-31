import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useCallback, useState } from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import AdminBadge from "@/components/AdminBadge"
import { getCachedApiData } from "@/services/api"
import { getBookFeed, getMyBooks } from "@/services/books"
import { getMatches } from "@/services/matches"
import { getProfile, type Profile } from "@/services/profile"
import { getInbox, type InboxResponse } from "@/services/inbox"
import { getRandomHomeDisplayImage, getRandomQuote, type Quote } from "@/services/quotes"

export default function Home() {
  const router = useRouter()
  const cachedProfile = getCachedApiData<Profile>("/profile/me/")
  const cachedInbox = getCachedApiData<InboxResponse>("/inbox/")
  const { width, height } = useWindowDimensions()
  const isNarrow = width < 380
  const isCompact = height < 760
  const isWide = width >= 768
  const imageHeight = isWide ? 300 : isCompact ? 170 : Math.min(250, Math.max(190, height * 0.28))

  const [name, setName] = useState<string | null>(() => cachedProfile?.display_name ?? null)
  const [community, setCommunity] = useState<string | null>(() => cachedProfile?.community_name ?? null)
  const [communityLocation, setCommunityLocation] = useState<string | null>(() => cachedProfile?.community_location ?? null)
  const [isAdmin, setIsAdmin] = useState(() => cachedProfile?.admin ?? false)
  const [loading, setLoading] = useState(() => !cachedProfile || !cachedInbox)
  const [unreadCount, setUnreadCount] = useState(() => cachedInbox?.unread_count ?? 0)
  const [quote, setQuote] = useState<Quote>(() => getRandomQuote())
  const [displayImage, setDisplayImage] = useState(() => getRandomHomeDisplayImage())

  const loadProfile = useCallback(async () => {
    try {
      const [profile, inbox] = await Promise.all([getProfile(), getInbox()])

      setName(profile.display_name)
      setCommunity(profile.community_name)
      setCommunityLocation(profile.community_location)
      setIsAdmin(profile.admin)
      setUnreadCount(inbox.unread_count)

      // Warm the destinations linked from the dashboard. Calls are deduplicated
      // and use the short-lived cache, so an immediate click reuses this work.
      void Promise.allSettled([getMyBooks(), getBookFeed(), getMatches()])
    } catch (err) {
      console.error("Failed to load profile", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setQuote(getRandomQuote())
      setDisplayImage(getRandomHomeDisplayImage())
      loadProfile()
    }, [loadProfile])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#183153" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.container,
        isCompact && styles.compactContainer,
        isWide && styles.wideContainer,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerDetails}>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name ?? "User"}</Text>
            {isAdmin ? <AdminBadge /> : null}
          </View>
          {community ? (
            <Text style={styles.community}>{community}</Text>
          ) : (
            <Pressable onPress={() => router.push("/communities/search")} accessibilityRole="button">
              <Text style={styles.joinCommunityPrompt}>Not in a community yet? Click here to join one</Text>
            </Pressable>
          )}
          {communityLocation ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={15} color="#6D5D4B" />
              <Text style={styles.location}>{communityLocation}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.headerActions}>
          <Pressable style={styles.settingsButton} onPress={() => router.push("/inbox")} accessibilityLabel="Open inbox">
            <Ionicons name="mail-outline" size={22} color="#183153" />
            {unreadCount > 0 ? (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text></View>
            ) : null}
          </Pressable>
          <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")} accessibilityLabel="Open settings">
            <Ionicons name="settings-outline" size={22} color="#183153" />
          </Pressable>
        </View>
      </View>

      <View style={styles.quoteCard}>
        <View style={[styles.quoteImageWrap, { height: imageHeight }]}>
          <Image source={displayImage} style={styles.quoteImage} resizeMode="cover" />
          <View style={styles.quoteImageOverlay} />
          <Text style={styles.quoteLabel}>Shelf Note</Text>
        </View>

        <View style={[styles.quoteContent, isCompact && styles.compactQuoteContent]}>
          <Text style={[styles.quoteMark, isCompact && styles.compactQuoteMark]}>{"\u201c"}</Text>
          <Text style={[styles.quoteText, isCompact && styles.compactQuoteText]}>{quote.quote}</Text>
          <Text style={[styles.quoteAuthor, isCompact && styles.compactQuoteAuthor]}>- {quote.author}</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <View style={[styles.buttonRow, isNarrow && styles.narrowButtonRow]}>
          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/explore")}>
            <Ionicons name="compass-outline" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Explore</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/search")}>
            <Ionicons name="search" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Search</Text>
          </Pressable>
        </View>

        <View style={[styles.buttonRow, isNarrow && styles.narrowButtonRow]}>
          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/library")}>
            <Ionicons name="library-outline" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Library</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/matches")}>
            <Ionicons name="heart-outline" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Matches</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F2E8",
  },
  container: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: "#F7F2E8",
    gap: 24,
  },
  compactContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 16,
  },
  wideContainer: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 36,
    gap: 28,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerDetails: {
    flex: 1,
    marginRight: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#9A6B39",
    marginBottom: 6,
  },
  name: {
    fontSize: 30,
    fontWeight: "700",
    color: "#183153",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  community: {
    fontSize: 16,
    color: "#6D5D4B",
    marginTop: 6,
  },
  joinCommunityPrompt: {
    fontSize: 14,
    color: "#8A4522",
    fontWeight: "700",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    color: "#6D5D4B",
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9F0",
    borderWidth: 1,
    borderColor: "#E7D9C5",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  badge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#B54A35",
    borderWidth: 2,
    borderColor: "#F7F2E8",
  },
  badgeText: {
    color: "#FFF9F0",
    fontSize: 9,
    fontWeight: "800",
  },
  quoteCard: {
    backgroundColor: "#FFF9F0",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E7D9C5",
    shadowColor: "#74543C",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  quoteImageWrap: {
    justifyContent: "flex-end",
    padding: 18,
    backgroundColor: "#183153",
  },
  quoteImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  quoteImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 49, 83, 0.34)",
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#E7C38A",
    zIndex: 1,
  },
  quoteContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  compactQuoteContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  quoteMark: {
    fontSize: 44,
    lineHeight: 44,
    color: "#9A6B39",
    marginBottom: 8,
  },
  compactQuoteMark: {
    fontSize: 34,
    lineHeight: 32,
    marginBottom: 4,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 32,
    color: "#183153",
    fontWeight: "600",
  },
  compactQuoteText: {
    fontSize: 18,
    lineHeight: 26,
  },
  quoteAuthor: {
    marginTop: 18,
    fontSize: 15,
    color: "#6D5D4B",
    fontWeight: "600",
  },
  compactQuoteAuthor: {
    marginTop: 12,
    fontSize: 14,
  },
  buttons: {
    gap: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 14,
  },
  narrowButtonRow: {
    flexDirection: "column",
  },
  button: {
    minHeight: 58,
    flexDirection: "row",
    backgroundColor: "#C86C3A",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#8A4522",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  halfButton: {
    flex: 1,
  },
  buttonText: {
    color: "#FFF9F0",
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F2E8",
  },
})
