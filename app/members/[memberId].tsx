import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AdminBadge from "@/components/AdminBadge"
import LibraryBrowser from "@/components/LibraryBrowser"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { ApiError } from "@/services/api"
import { getMemberLibrary, type MemberLibrary } from "@/services/profile"
import { useTranslation } from "@/localization/LanguageContext"

export default function MemberLibraryScreen() {
  const { language, t } = useTranslation()
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
          ? t("communityLibraryOnly")
          : t("memberLibraryLoadError"),
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [memberId, t])

  useFocusEffect(useCallback(() => { loadLibrary() }, [loadLibrary]))

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.accent} /></View>
  }

  if (!library) {
    return (
      <View style={styles.center}>
        <View style={styles.errorIcon}><Ionicons name="people-outline" size={34} color={palette.textSoft} /></View>
        <Text style={styles.errorTitle}>{t("libraryUnavailable")}</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    )
  }

  const { member } = library
  const displayName = member.display_name || t("unknownReader")

  return (
    <View style={styles.screen}>
      <LibraryBrowser
        books={library.books}
        eyebrow={t("publicShelf").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}
        title={t("personsLibrary", { name: displayName })}
        emptyTitle={t("emptyShelf")}
        emptyText={t("emptyMemberShelf", { name: displayName })}
        refreshing={refreshing}
        onRefresh={() => loadLibrary(true)}
        onBookPress={(book) => router.push({ pathname: "/books/[bookId]", params: { bookId: book.id } })}
        header={(
          <View style={styles.profileCard}>
            {member.avatar_url ? <Image source={{ uri: member.avatar_url }} style={styles.avatar} /> : <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text></View>}
            <View style={styles.profileText}>
              <View style={styles.nameRow}><Text style={styles.name}>{displayName}</Text>{member.admin ? <AdminBadge /> : null}</View>
              {member.community_name ? <View style={styles.metaRow}><Ionicons name="people-outline" size={15} color={palette.textMuted} /><Text style={styles.meta}>{member.community_name}</Text></View> : null}
              <Text style={styles.memberSince}>{t("memberSince", { date: formatMemberSince(member.created_at, language, t("recentlyLower")) })}</Text>
            </View>
          </View>
        )}
      />
    </View>
  )
}

function formatMemberSince(value: string, language: "en" | "tr", fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "long", year: "numeric" }).format(date)
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
  controlsCard: { gap: 14, marginTop: 18, padding: 14, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.soft },
  searchBox: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  searchInput: { flex: 1, minWidth: 0, color: palette.text, fontSize: 14, paddingVertical: 10 },
  clearButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  controlSection: { gap: 7 },
  controlLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: palette.border, borderRadius: radii.round, backgroundColor: palette.paper },
  chipSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  chipText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: palette.paper },
  optionsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 18 },
  compactControl: { flexDirection: "row", alignItems: "center", gap: 7 },
  compactLabel: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  compactOptions: { flexDirection: "row", gap: 5 },
  iconOption: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  iconOptionSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  pageSizeOption: { minWidth: 34, height: 32, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  pageSizeText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  pageSizeTextSelected: { color: palette.paper },
  libraryHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 22, marginBottom: 16, paddingHorizontal: 2 },
  eyebrow: { color: palette.accentDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginBottom: 5 },
  heading: { fontFamily: typography.serif, fontSize: 25, fontWeight: "700", color: palette.text },
  countPill: { minWidth: 36, height: 30, paddingHorizontal: 10, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  countText: { color: palette.accentDark, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  list: { flexDirection: "column", flexWrap: "nowrap" },
  bookCard: { width: "48%" },
  listBookCard: { width: "100%" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 8, paddingBottom: 12 },
  pageButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  pageButtonDisabled: { opacity: 0.38 },
  pageText: { minWidth: 110, textAlign: "center", color: palette.text, fontSize: 13, fontWeight: "700" },
  emptyCard: { alignItems: "center", padding: 32, gap: 8, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surfaceMuted },
  emptyTitle: { marginTop: 4, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
})
