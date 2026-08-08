import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AdminBadge from "@/components/AdminBadge"
import BookDisplay from "@/components/BookDisplay"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { ApiError } from "@/services/api"
import { getMemberLibrary, type MemberLibrary } from "@/services/profile"

export default function MemberLibraryScreen() {
  const { memberId } = useLocalSearchParams<{ memberId: string }>()
  const [library, setLibrary] = useState<MemberLibrary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadLibrary = useCallback(async (refresh = false) => {
    if (!memberId) return
    if (refresh) setRefreshing(true)
    else setLoading(true)
    try {
      setError(null)
      setLibrary(await getMemberLibrary(memberId))
    } catch (err) {
      console.error("Failed to load member library", err)
      setLibrary(null)
      setError(
        err instanceof ApiError && err.status === 403
          ? "You can only view libraries belonging to members of your community."
          : "This member library could not be loaded.",
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [memberId])

  useFocusEffect(useCallback(() => { loadLibrary() }, [loadLibrary]))

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.accent} /></View>
  }

  if (!library) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}><Ionicons name="people-outline" size={34} color={palette.textSoft} /></View>
        <Text style={styles.errorTitle}>Library unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  const { member, books } = library
  const displayName = member.display_name || "Unknown reader"

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadLibrary(true)} tintColor={palette.accent} />}
    >
      <View style={styles.profileCard}>
        {member.avatar_url ? (
          <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.profileText}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{displayName}</Text>
            {member.admin ? <AdminBadge /> : null}
          </View>
          {member.community_name ? (
            <View style={styles.metaRow}>
              <Ionicons name="people-outline" size={15} color={palette.textMuted} />
              <Text style={styles.meta}>{member.community_name}</Text>
            </View>
          ) : null}
          <Text style={styles.memberSince}>Member since {formatMemberSince(member.created_at)}</Text>
        </View>
      </View>

      <View style={styles.libraryHeading}>
        <View>
          <Text style={styles.eyebrow}>PUBLIC SHELF</Text>
          <Text style={styles.heading}>{displayName}&apos;s library</Text>
        </View>
        <View style={styles.countPill}><Text style={styles.countText}>{books.length}</Text></View>
      </View>

      {books.length ? (
        <View style={styles.grid}>
          {books.map((book) => (
            <BookDisplay
              key={book.id}
              book={book}
              onPress={() => router.push({ pathname: "/books/[bookId]", params: { bookId: book.id } })}
              style={styles.bookCard}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="library-outline" size={36} color={palette.textSoft} />
          <Text style={styles.emptyTitle}>The shelf is empty</Text>
          <Text style={styles.emptyText}>{displayName} has not added any public books yet.</Text>
        </View>
      )}
    </ScrollView>
  )
}

function formatMemberSince(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "recently"
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", padding: 20, paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: palette.background },
  errorIcon: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: palette.blueSoft, marginBottom: 14 },
  errorTitle: { fontFamily: typography.serif, fontSize: 23, fontWeight: "700", color: palette.text, marginBottom: 8 },
  errorText: { maxWidth: 340, textAlign: "center", color: palette.textMuted, fontSize: 15, lineHeight: 22 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 18, padding: 20, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, backgroundColor: palette.paper, ...shadows.soft },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.blueSoft, borderWidth: 1.5, borderColor: palette.borderStrong },
  avatarText: { fontFamily: typography.serif, fontSize: 34, fontWeight: "700", color: palette.textSoft },
  profileText: { flex: 1, minWidth: 0, gap: 7 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  name: { flexShrink: 1, fontFamily: typography.serif, fontSize: 28, lineHeight: 33, fontWeight: "700", color: palette.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: palette.textMuted, fontSize: 14, fontWeight: "600" },
  memberSince: { color: palette.textMuted, fontSize: 13 },
  libraryHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 30, marginBottom: 16, paddingHorizontal: 2 },
  eyebrow: { color: palette.accentDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  heading: { fontFamily: typography.serif, fontSize: 25, fontWeight: "700", color: palette.text },
  countPill: { minWidth: 36, height: 30, paddingHorizontal: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  countText: { color: palette.accentDark, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  bookCard: { width: "48%" },
  emptyCard: { alignItems: "center", padding: 32, gap: 8, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surfaceMuted },
  emptyTitle: { marginTop: 4, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
})
