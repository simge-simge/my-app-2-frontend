import { router, useFocusEffect } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  type ViewStyle,
  View,
} from "react-native"

import AdminBadge from "@/components/AdminBadge"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getMatches, type Match, type MatchBook } from "@/services/matches"
import { subscribeToBackgroundActions } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

const webBookGrid = Platform.OS === "web" ? {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 32px minmax(0, 1fr)",
  columnGap: 0,
  alignItems: "start",
} as unknown as ViewStyle : null

function isOptimisticMatchDelete(value: unknown): value is { match: Match; index?: number } {
  return Boolean(value && typeof value === "object" && "match" in value && (value.match as Match)?.match_id)
}

type SwapMatchGroup = { kind: "swap-group"; key: string; matches: Match[] }
type MatchListItem = SwapMatchGroup | { kind: "match"; key: string; match: Match }

export default function MatchesScreen() {
  const { t } = useTranslation()
  const cachedMatches = getCachedApiData<Match[]>("/matches/")
  const [matches, setMatches] = useState<Match[]>(() => cachedMatches ?? [])
  const [loading, setLoading] = useState(() => cachedMatches === undefined)
  const hasLoaded = useRef(cachedMatches !== undefined)
  const matchesRevision = useRef(0)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const matchItems = useMemo<MatchListItem[]>(() => {
    const items: MatchListItem[] = []
    const groups = new Map<string, SwapMatchGroup>()
    const reservedBookIds = new Set(
      matches
        .filter((match) => Boolean(match.approved_at && match.my_book && match.their_book))
        .flatMap((match) => [match.my_book!.id, match.their_book!.id]),
    )
    for (const match of matches) {
      if (match.approved_at || !match.my_book || !match.their_book) {
        items.push({ kind: "match", key: `match:${match.match_id}`, match })
        continue
      }
      if (reservedBookIds.has(match.my_book.id) || reservedBookIds.has(match.their_book.id)) continue

      const key = `swap:${match.other_user.id}:${match.their_book.id}`
      const existing = groups.get(key)
      if (existing) {
        existing.matches.push(match)
      } else {
        const group: SwapMatchGroup = { kind: "swap-group", key, matches: [match] }
        groups.set(key, group)
        items.push(group)
      }
    }

    return items.map((item) => item.kind === "swap-group" && item.matches.length === 1
      ? { kind: "match", key: `match:${item.matches[0].match_id}`, match: item.matches[0] }
      : item)
  }, [matches])

  const loadMatches = useCallback(async (showLoader = false) => {
    const revisionAtStart = matchesRevision.current
    if (showLoader && !hasLoaded.current) setLoading(true)

    try {
      setError(null)
      const response = await getMatches()
      if (revisionAtStart === matchesRevision.current) setMatches(response)
    } catch (err) {
      console.error("Failed to load matches", err)
      if (revisionAtStart === matchesRevision.current) {
        setError(t("couldNotLoadMatches"))
      }
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useFocusEffect(useCallback(() => { loadMatches(true) }, [loadMatches]))

  useEffect(() => subscribeToBackgroundActions((update) => {
    if (update.event !== "match-deleted" || !isOptimisticMatchDelete(update.optimisticResult)) return
    const { match: deletedMatch, index = 0 } = update.optimisticResult
    matchesRevision.current += 1

    if (update.status === "pending") {
      setMatches((items) => items.filter((item) => item.match_id !== deletedMatch.match_id))
    } else if (update.status === "failed") {
      setMatches((items) => {
        if (items.some((item) => item.match_id === deletedMatch.match_id)) return items
        const next = [...items]
        next.splice(Math.min(index, next.length), 0, deletedMatch)
        return next
      })
    } else if (update.status === "completed") {
      void loadMatches()
    }
  }), [loadMatches])

  const handleRefresh = () => {
    setRefreshing(true)
    loadMatches()
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("myMatches")}</Text>
      <Text style={styles.subtitle}>{t("matchSubtitle")}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matchItems}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => item.kind === "swap-group" ? <SwapChoiceCard group={item} /> : <MatchRow match={item.match} />}
        contentContainerStyle={[styles.listContent, matchItems.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.text} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{t("noMatchesYet")}</Text>
            <Text style={styles.emptyText}>{t("noMatchesHint")}</Text>
          </View>
        }
      />
    </View>
  )
}

function SwapChoiceCard({ group }: { group: SwapMatchGroup }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const first = group.matches[0]
  const theirBook = first.their_book!
  const displayName = first.other_user.display_name || t("unknownReader")

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        testID={`match-group-${theirBook.id}`}
        onPress={() => setExpanded((value) => !value)}
        style={styles.groupSummary}
      >
        <Ionicons name="book-outline" size={22} color={palette.textMuted} />
        <View style={styles.groupBookCopy}>
          <Text numberOfLines={2} style={styles.groupBookTitle}>{theirBook.title}</Text>
          {theirBook.author ? <Text numberOfLines={1} style={styles.bookAuthor}>{theirBook.author}</Text> : null}
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={palette.textMuted} />
      </Pressable>

      <View style={styles.groupFooter}>
        <View style={styles.optionsPill}>
          <Ionicons name="layers-outline" size={15} color={palette.success} />
          <Text style={styles.optionsPillText}>{t("exchangeOptionsWith", { count: group.matches.length, name: displayName })}</Text>
        </View>
      </View>

      {expanded ? (
        <View style={styles.optionsPanel}>
          <Text style={styles.optionsTitle}>{t("booksTheyWantFromYou", { name: displayName })}</Text>
          {group.matches.map((match) => (
            <Pressable
              key={match.match_id}
              accessibilityRole="button"
              testID={`match-choice-${match.match_id}`}
              onPress={() => router.push({ pathname: "/matches/[matchId]", params: { matchId: match.match_id } })}
              style={styles.choiceRow}
            >
              <Text numberOfLines={2} style={styles.choiceBookTitle}>{match.my_book?.title}</Text>
              <Ionicons name="swap-horizontal" size={18} color={palette.success} />
              <Text numberOfLines={2} style={styles.choiceBookTitle}>{theirBook.title}</Text>
              <Ionicons name="chevron-forward" size={18} color={palette.textMuted} />
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function MatchRow({ match }: { match: Match }) {
  const { language, t } = useTranslation()
  const displayName = match.other_user.display_name || t("unknownReader")
  const matchedAt = formatMatchDate(match.created_at, language === "tr" ? "tr-TR" : "en-US", t("recentlyMatched"))
  const isBorrowMatch = !match.my_book || !match.their_book
  const borrowedBook = match.my_book ?? match.their_book
  const borrowLabel = match.my_book ? t("youAreLending") : t("youAreBorrowing")
  const isApprovedSwap = Boolean(match.approved_at && match.my_book && match.their_book)
  const myBookUnavailable = Boolean(isApprovedSwap && ["lent", "matched"].includes(match.my_book?.status ?? ""))
  const theirBookUnavailable = Boolean(isApprovedSwap && ["lent", "matched"].includes(match.their_book?.status ?? ""))
  const exchangeIsUnderway = myBookUnavailable || theirBookUnavailable

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${displayName}: ${match.my_book?.title ?? ""} ${match.their_book?.title ?? ""}`.trim()}
      testID={`match-card-${match.match_id}`}
      style={[styles.card, exchangeIsUnderway && styles.committedCard]}
      onPress={() => router.push({ pathname: "/matches/[matchId]", params: { matchId: match.match_id } })}
    >
      {isBorrowMatch && borrowedBook ? (
        <View style={styles.singleBookRow}>
          <Text style={styles.borrowMatchLabel}>{borrowLabel}</Text>
          <BookSummary label={match.my_book ? t("yourBook") : t("personsBook", { name: displayName })} book={borrowedBook} />
        </View>
      ) : match.my_book && match.their_book ? (
        <View style={[styles.booksRow, webBookGrid]}>
          <BookSummary label={t("yourBook")} book={match.my_book} />
          <View style={styles.exchangeColumn}>
            <View style={styles.exchangeTitleArea}><Ionicons name="swap-horizontal" size={20} color={palette.success} /></View>
          </View>
          <BookSummary label={t("theirBook")} book={match.their_book} />
        </View>
      ) : null}

      <View style={styles.matchFooter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("viewLibrary", { name: displayName })}
          onPress={(event) => {
            event.stopPropagation()
            router.push({ pathname: "/members/[memberId]", params: { memberId: match.other_user.id } })
          }}
          style={styles.footerMeta}
        >
          <View style={styles.footerItem}>
            <Ionicons name="person-outline" size={15} color={palette.textMuted} />
            <Text numberOfLines={1} style={styles.footerText}>{displayName}</Text>
            {match.other_user.admin ? <AdminBadge /> : null}
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerItem}>
            <Ionicons name="calendar-outline" size={14} color={palette.textMuted} />
            <Text numberOfLines={1} style={styles.footerText}>{matchedAt}</Text>
          </View>
        </Pressable>
        <View style={[styles.statusBadge, (match.revealed || isApprovedSwap) ? styles.revealedBadge : styles.pendingBadge]}>
          {(match.revealed || isApprovedSwap) ? <Ionicons name="checkmark-circle" size={13} color={palette.success} /> : null}
          <Text style={[styles.statusText, (match.revealed || isApprovedSwap) ? styles.revealedText : styles.pendingText]}>
            {isApprovedSwap ? t("approved") : match.revealed ? t("revealed") : t("pending")}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color={palette.textMuted} />
      </View>
    </Pressable>
  )
}

function BookSummary({ label, book }: { label: string; book: MatchBook }) {
  return (
    <View style={styles.bookColumn}>
      <View style={styles.bookLabelRow}>
        <Ionicons name="book-outline" size={16} color={palette.textMuted} />
        <Text style={styles.bookLabel}>{label}</Text>
      </View>
      <View style={styles.bookTitleArea}><Text numberOfLines={2} style={styles.bookTitle}>{book.title}</Text></View>
      {book.author ? <Text numberOfLines={1} style={styles.bookAuthor}>{book.author}</Text> : null}
    </View>
  )
}

function formatMatchDate(value: string, locale: string, fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", backgroundColor: palette.background, paddingHorizontal: 18, paddingTop: 18 },
  title: { fontFamily: typography.serif, fontSize: 30, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 15, color: palette.textMuted, marginTop: 6, marginBottom: 18 },
  error: { color: palette.danger, marginBottom: 12 },
  listContent: { paddingBottom: 24, gap: 14 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  emptyState: { alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontFamily: typography.serif, fontSize: 21, fontWeight: "700", color: palette.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: palette.textMuted, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
  card: { backgroundColor: palette.surface, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, padding: 12, gap: 10, ...shadows.soft },
  committedCard: { backgroundColor: palette.successSoft, borderColor: palette.success },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 13 },
  groupCover: { width: 66, height: 88, borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  groupCopy: { flex: 1, gap: 4 },
  groupTitle: { fontFamily: typography.serif, fontSize: 19, fontWeight: "700", color: palette.text },
  groupMeta: { fontSize: 13, lineHeight: 18, color: palette.textMuted },
  groupSummary: { flexDirection: "row", alignItems: "center", gap: 11 },
  groupBookCopy: { flex: 1, gap: 3 },
  groupBookTitle: { fontFamily: typography.serif, fontSize: 15, lineHeight: 19, fontWeight: "700", color: palette.text },
  groupFooter: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10, flexDirection: "row" },
  optionsPill: { maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: palette.accentSoft },
  optionsPillText: { flexShrink: 1, fontSize: 11, fontWeight: "600", color: palette.text },
  choiceHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  choiceCopy: { flex: 1, gap: 3 },
  choiceCount: { fontFamily: typography.serif, fontSize: 18, fontWeight: "700", color: palette.text },
  optionsPanel: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 14, gap: 10 },
  optionsTitle: { fontSize: 12, fontWeight: "700", color: palette.text },
  choiceRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 11, paddingVertical: 8, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  choiceBookTitle: { flex: 1, fontFamily: typography.serif, fontSize: 12, lineHeight: 16, fontWeight: "700", color: palette.text },
  optionRow: { gap: 10, padding: 10, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  optionMain: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 },
  optionCover: { width: 38, height: 52, borderRadius: 6, backgroundColor: palette.surface },
  optionFallbackText: { fontSize: 17, fontWeight: "700", color: palette.textSoft },
  optionCopy: { flex: 1, gap: 3 },
  optionTitle: { fontFamily: typography.serif, fontSize: 15, fontWeight: "700", color: palette.text },
  optionHint: { fontSize: 12, color: palette.textMuted },
  approveButton: { minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, backgroundColor: palette.accent },
  approveButtonText: { color: palette.white, fontSize: 14, fontWeight: "800" },
  userRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 20, fontWeight: "700", color: palette.textSoft },
  headerText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  name: { fontFamily: typography.serif, fontSize: 18, fontWeight: "700", color: palette.text },
  date: { fontSize: 13, color: palette.textMuted },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 3, borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  statusActions: { alignItems: "flex-end", gap: 8 },
  revealedBadge: { backgroundColor: palette.successSoft },
  pendingBadge: { backgroundColor: palette.accentSoft },
  statusText: { fontSize: 10, fontWeight: "700" },
  revealedText: { color: palette.success },
  pendingText: { color: palette.textSoft },
  deleteButton: { minHeight: 46, flexDirection: "row", gap: 7, alignItems: "center", justifyContent: "center", borderRadius: radii.md, paddingHorizontal: 12, backgroundColor: "transparent" },
  deleteButtonDisabled: { opacity: 0.7 },
  deleteButtonText: { color: palette.danger, fontSize: 12, fontWeight: "700" },
  booksRow: { flexDirection: "row", alignItems: "flex-start", minHeight: 69 },
  exchangeColumn: { width: 32, paddingTop: 19 },
  exchangeTitleArea: { minHeight: 36, alignItems: "center", justifyContent: "center" },
  singleBookRow: { gap: 7, minHeight: 72 },
  borrowMatchBlock: { gap: 8 },
  borrowMatchLabel: { fontSize: 15, fontWeight: "700", color: palette.accentDark },
  revealPanel: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 18, gap: 13 },
  revealHint: { fontSize: 13, color: palette.textMuted, lineHeight: 18 },
  contactHeading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 2 },
  contactStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12, minHeight: 30 },
  contactStatusLabel: { fontSize: 14, color: palette.textMuted },
  contactStatusValue: { fontSize: 14, color: palette.orange, textAlign: "right" },
  contactStatusShared: { color: palette.success, fontWeight: "700" },
  revealButton: { minHeight: 52, flexDirection: "row", gap: 9, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.accentDark, marginTop: 2 },
  revealButtonDisabled: { opacity: 0.7 },
  revealButtonText: { color: palette.white, fontSize: 15, fontWeight: "700" },
  matchActions: { flexDirection: "row", gap: 10 },
  actionButton: { flex: 1 },
  reserveButton: { minHeight: 52, flexDirection: "row", gap: 9, justifyContent: "center", backgroundColor: palette.successSoft, borderRadius: radii.md, borderWidth: 1, borderColor: palette.success, alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 },
  reserveButtonText: { color: palette.success, fontSize: 14, fontWeight: "800", textAlign: "center" },
  reserveHint: { marginTop: -5, color: palette.textMuted, fontSize: 12, lineHeight: 17, textAlign: "center" },
  removeDivider: { height: 1, backgroundColor: palette.border, marginTop: 3 },
  exchangeUnderway: { color: palette.success, fontSize: 14, lineHeight: 20, fontWeight: "700" },
  contactsCard: { backgroundColor: palette.surfaceMuted, borderRadius: 16, padding: 12, gap: 8 },
  contactsTitle: { fontSize: 14, fontWeight: "700", color: palette.text },
  contactsEmpty: { fontSize: 13, color: palette.textMuted },
  contactRow: { gap: 2 },
  contactLabel: { fontSize: 12, fontWeight: "600", color: palette.textMuted },
  contactValue: { fontSize: 14, color: palette.text },
  matchFooter: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  footerMeta: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  footerItem: { flexShrink: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 5 },
  footerDivider: { width: 1, height: 20, backgroundColor: palette.border },
  footerText: { flexShrink: 1, fontSize: 10, color: palette.textMuted },
  bookColumn: { flex: 1, minWidth: 0, gap: 3 },
  bookLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  bookLabel: { fontSize: 10, fontWeight: "600", color: palette.textMuted },
  bookAuthor: { fontSize: 10, lineHeight: 14, color: palette.textMuted },
  cover: { width: "100%", height: 104, borderRadius: 12, backgroundColor: palette.surfaceMuted, marginBottom: 8 },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  coverFallbackText: { fontSize: 34, fontWeight: "700", color: palette.textSoft },
  bookTitleArea: { minHeight: 36 },
  bookTitle: { fontFamily: typography.serif, fontSize: 14, fontWeight: "700", color: palette.text, lineHeight: 18 },
})
