import { router, useFocusEffect } from "expo-router"
import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"

import AdminBadge from "@/components/AdminBadge"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getMatches, revealMatchContact, type Match, type MatchBook, type MatchContacts } from "@/services/matches"

export default function MatchesScreen() {
  const cachedMatches = getCachedApiData<Match[]>("/matches/")
  const [matches, setMatches] = useState<Match[]>(() => cachedMatches ?? [])
  const [loading, setLoading] = useState(() => cachedMatches === undefined)
  const hasLoaded = useRef(cachedMatches !== undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [revealingMatchId, setRevealingMatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMatches = useCallback(async (showLoader = false) => {
    if (showLoader && !hasLoaded.current) setLoading(true)

    try {
      setError(null)
      const response = await getMatches()
      setMatches(response)
    } catch (err) {
      console.error("Failed to load matches", err)
      setError("Could not load your matches.")
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { loadMatches(true) }, [loadMatches]))

  const handleRefresh = () => {
    setRefreshing(true)
    loadMatches()
  }

  const handleReveal = useCallback(async (matchId: string) => {
    try {
      setError(null)
      setRevealingMatchId(matchId)
      await revealMatchContact(matchId)
      await loadMatches()
    } catch (err) {
      console.error("Failed to reveal contact info", err)
      setError("Could not reveal your contact info for that match.")
    } finally {
      setRevealingMatchId(null)
    }
  }, [loadMatches])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Matches</Text>
      <Text style={styles.subtitle}>Book swaps and accepted borrow requests</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id}
        renderItem={({ item }) => <MatchRow match={item} onReveal={handleReveal} revealing={revealingMatchId === item.match_id} />}
        contentContainerStyle={[styles.listContent, matches.length === 0 && styles.emptyListContent]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.text} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>Book swaps and accepted borrow requests will show up here.</Text>
          </View>
        }
      />
    </View>
  )
}

function MatchRow({ match, onReveal, revealing }: { match: Match; onReveal: (matchId: string) => void; revealing: boolean }) {
  const displayName = match.other_user.display_name || "Unknown reader"
  const matchedAt = formatMatchDate(match.created_at)
  const canReveal = !match.my_revealed
  const isBorrowMatch = !match.my_book || !match.their_book
  const borrowedBook = match.my_book ?? match.their_book
  const borrowLabel = match.my_book ? "You are lending" : "You are borrowing"
  const otherStatusText = match.their_revealed ? `${displayName} revealed contact info.` : `${displayName} hasn't revealed yet.`
  const myStatusText = match.my_revealed ? "Your contact info has been revealed for this match." : "Your contact info is still hidden."

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: "/matches/[matchId]", params: { matchId: match.match_id } })}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${displayName}'s library`}
          onPress={(event) => {
            event.stopPropagation()
            router.push({ pathname: "/members/[memberId]", params: { memberId: match.other_user.id } })
          }}
          style={styles.userRow}
        >
          {match.other_user.avatar_url ? (
            <Image source={{ uri: match.other_user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.headerText}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {match.other_user.admin ? <AdminBadge /> : null}
            </View>
            <Text style={styles.date}>{matchedAt}</Text>
          </View>
        </Pressable>

        <View style={[styles.statusBadge, match.revealed ? styles.revealedBadge : styles.pendingBadge]}>
          <Text style={[styles.statusText, match.revealed ? styles.revealedText : styles.pendingText]}>
            {match.revealed ? "Revealed" : "Pending"}
          </Text>
        </View>
      </View>

      {isBorrowMatch && borrowedBook ? (
        <View style={styles.borrowMatchBlock}>
          <Text style={styles.borrowMatchLabel}>{borrowLabel}</Text>
          <BookSummary label={match.my_book ? "Your book" : `${displayName}'s book`} book={borrowedBook} />
        </View>
      ) : match.my_book && match.their_book ? (
        <View style={styles.booksRow}>
          <BookSummary label="Your book" book={match.my_book} />
          <BookSummary label="Their book" book={match.their_book} />
        </View>
      ) : null}

      <View style={styles.revealPanel}>
        <Text style={styles.revealHint}>{otherStatusText}</Text>
        <Text style={styles.revealHint}>{myStatusText}</Text>

        {canReveal ? (
          <Pressable style={[styles.revealButton, revealing && styles.revealButtonDisabled]} onPress={() => onReveal(match.match_id)} disabled={revealing}>
            <Text style={styles.revealButtonText}>{revealing ? "Revealing..." : "Reveal My Contact Info"}</Text>
          </Pressable>
        ) : null}

        {match.contacts ? <ContactList contacts={match.contacts} /> : null}
      </View>
    </Pressable>
  )
}

function BookSummary({ label, book }: { label: string; book: MatchBook }) {
  return (
    <View style={styles.bookColumn}>
      <Text style={styles.bookLabel}>{label}</Text>
      {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" /> : <View style={[styles.cover, styles.coverFallback]}><Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text></View>}
      <Text numberOfLines={2} style={styles.bookTitle}>{book.title}</Text>
    </View>
  )
}

function ContactList({ contacts }: { contacts: MatchContacts }) {
  const rows = [
    { label: "Email", value: contacts.email },
    { label: "Phone", value: contacts.phone },
    { label: "Instagram", value: contacts.instagram },
    { label: "Telegram", value: contacts.telegram },
  ].filter((item) => Boolean(item.value))

  if (rows.length === 0) {
    return <View style={styles.contactsCard}><Text style={styles.contactsTitle}>Contact Info</Text><Text style={styles.contactsEmpty}>No contact details shared yet.</Text></View>
  }

  return (
    <View style={styles.contactsCard}>
      <Text style={styles.contactsTitle}>Contact Info</Text>
      {rows.map((row) => <View key={row.label} style={styles.contactRow}><Text style={styles.contactLabel}>{row.label}</Text><Text style={styles.contactValue}>{row.value}</Text></View>)}
    </View>
  )
}

function formatMatchDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently matched"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
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
  card: { backgroundColor: palette.surface, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, padding: 16, gap: 16, ...shadows.soft },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  userRow: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 20, fontWeight: "700", color: palette.textSoft },
  headerText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  name: { fontFamily: typography.serif, fontSize: 19, fontWeight: "700", color: palette.text },
  date: { fontSize: 13, color: palette.textMuted },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  revealedBadge: { backgroundColor: palette.successSoft },
  pendingBadge: { backgroundColor: palette.accentSoft },
  statusText: { fontSize: 12, fontWeight: "700" },
  revealedText: { color: palette.success },
  pendingText: { color: palette.textSoft },
  booksRow: { flexDirection: "row", gap: 12 },
  borrowMatchBlock: { gap: 8 },
  borrowMatchLabel: { fontSize: 15, fontWeight: "700", color: palette.accentDark },
  revealPanel: { borderTopWidth: 1, borderTopColor: palette.border, paddingTop: 14, gap: 12 },
  revealHint: { fontSize: 13, color: palette.textMuted, lineHeight: 18 },
  revealButton: { minHeight: 48, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingVertical: 13, paddingHorizontal: 14, borderWidth: 1, borderColor: palette.accentDark },
  revealButtonDisabled: { opacity: 0.7 },
  revealButtonText: { color: palette.white, fontSize: 15, fontWeight: "700" },
  contactsCard: { backgroundColor: palette.surfaceMuted, borderRadius: 16, padding: 12, gap: 8 },
  contactsTitle: { fontSize: 14, fontWeight: "700", color: palette.text },
  contactsEmpty: { fontSize: 13, color: palette.textMuted },
  contactRow: { gap: 2 },
  contactLabel: { fontSize: 12, fontWeight: "600", color: palette.textMuted },
  contactValue: { fontSize: 14, color: palette.text },
  bookColumn: { flex: 1 },
  bookLabel: { fontSize: 13, fontWeight: "600", color: palette.textMuted, marginBottom: 8 },
  cover: { width: "100%", height: 150, borderRadius: 14, backgroundColor: palette.surfaceMuted, marginBottom: 10 },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  coverFallbackText: { fontSize: 34, fontWeight: "700", color: palette.textSoft },
  bookTitle: { fontFamily: typography.serif, fontSize: 16, fontWeight: "700", color: palette.text, lineHeight: 20 },
})
