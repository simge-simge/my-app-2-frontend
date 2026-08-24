import { useCallback, useRef, useState, type ReactNode } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import AdminBadge from "@/components/AdminBadge"
import { getCachedApiData } from "@/services/api"
import {
  deleteMatch,
  getMatch,
  revealMatchContact,
  type Match,
  type MatchBook,
  type MatchContacts,
  type MatchUser,
} from "@/services/matches"
import { runInBackground } from "@/utils/backgroundAction"
import { useBookStatusLabel } from "@/localization/bookStatus"

export default function MatchDetailScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const cachePath = matchId ? `/matches/${matchId}` : ""
  const cachedMatch = getCachedApiData<Match>(cachePath)
  const [match, setMatch] = useState<Match | null>(() => cachedMatch ?? null)
  const [loading, setLoading] = useState(() => cachedMatch === undefined)
  const hasLoaded = useRef(cachedMatch !== undefined)
  const [error, setError] = useState<string | null>(null)

  const loadMatch = useCallback(async () => {
    if (!matchId) return
    try {
      if (!hasLoaded.current) setLoading(true)
      setError(null)
      const response = await getMatch(matchId)
      setMatch(response)
    } catch (err) {
      console.error("Failed to load match", err)
      setError("Could not load this match.")
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [matchId])

  useFocusEffect(useCallback(() => { loadMatch() }, [loadMatch]))

  const handleReveal = useCallback(() => {
    if (!matchId || !match) return
    const previous = match
    setError(null)
    setMatch({ ...match, my_revealed: true, revealed: match.their_revealed, my_book: match.my_book ? { ...match.my_book, status: "lent" } : null })
    runInBackground(() => revealMatchContact(matchId), {
      onSuccess: () => loadMatch(),
      onError: (err) => {
        setMatch(previous)
        console.error("Failed to reveal contact info", err)
        Alert.alert("Change was not saved", "Could not reveal your contact info for that match.")
      },
    })
  }, [loadMatch, match, matchId])

  const handleDelete = useCallback(() => {
    if (!matchId) return
    router.replace("/matches")
    runInBackground(() => deleteMatch(matchId), {
      onError: (err) => {
        console.error("Failed to delete match", err)
        Alert.alert("Match was not deleted", "Could not delete this match.")
      },
    })
  }, [matchId])

  const confirmDelete = useCallback(() => {
    Alert.alert("Delete match", "Remove this match from your list?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ])
  }, [handleDelete])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Match unavailable</Text>
        <Text style={styles.emptyText}>{error ?? "This match could not be found."}</Text>
      </View>
    )
  }

  const displayName = match.other_user.display_name || "Unknown reader"
  const memberSinceText = match.other_user.created_at ? `Member since ${formatMatchDate(match.other_user.created_at)}` : "Profile details available"
  const matchedAt = formatMatchDate(match.created_at)
  const canReveal = !match.my_revealed
  const isBorrowMatch = !match.my_book || !match.their_book
  const borrowedBook = match.my_book ?? match.their_book
  const otherStatusText = match.their_revealed ? `${displayName} revealed contact info.` : `${displayName} hasn't revealed yet.`
  const myStatusText = match.my_revealed ? "Your contact info has been revealed for this match." : "Your contact info is still hidden."
  const revealButtonText = match.my_book ? "Reveal Contact & Mark My Book Lent" : "Reveal My Contact Info"

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroCard}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${displayName}'s library`}
          onPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: match.other_user.id } })}
          style={styles.heroHeader}
        >
          <UserAvatar user={match.other_user} size={72} />
          <View style={styles.heroText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{displayName}</Text>
              {match.other_user.admin ? <AdminBadge /> : null}
              <View style={[styles.statusBadge, match.revealed ? styles.revealedBadge : styles.pendingBadge]}>
                <Text style={[styles.statusText, match.revealed ? styles.revealedText : styles.pendingText]}>
                  {match.revealed ? "Revealed" : "Pending"}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>{memberSinceText}</Text>
            <Text style={styles.subtitle}>Matched on {matchedAt}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
        </Pressable>

        <View style={styles.statusBlock}>
          <Text style={styles.statusLine}>{otherStatusText}</Text>
          <Text style={styles.statusLine}>{myStatusText}</Text>
        </View>

        {canReveal ? <Pressable style={styles.revealButton} onPress={handleReveal}><Text style={styles.revealButtonText}>{revealButtonText}</Text></Pressable> : null}
        {match.contacts ? <ContactList contacts={match.contacts} /> : null}
      </View>

      {isBorrowMatch && borrowedBook ? (
        <InfoSection title={match.my_book ? "Book You’re Lending" : "Book You’re Borrowing"}>
          <Text style={styles.borrowExplanation}>
            {match.my_book
              ? `${displayName} asked to borrow this book.`
              : `${displayName} accepted your request to borrow this book.`}
          </Text>
          <BookDetails book={borrowedBook} />
        </InfoSection>
      ) : match.my_book && match.their_book ? (
        <>
          <InfoSection title="Your Book"><BookDetails book={match.my_book} /></InfoSection>
          <InfoSection title="Their Book"><BookDetails book={match.their_book} /></InfoSection>
        </>
      ) : null}

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Delete Match</Text>
      </Pressable>
    </ScrollView>
  )
}

function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
}

function UserAvatar({ user, size }: { user: MatchUser; size: number }) {
  const displayName = user.display_name || "Unknown reader"
  if (user.avatar_url) return <Image source={{ uri: user.avatar_url }} style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]} />
  return <View style={[styles.avatar, styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.avatarFallbackText}>{displayName.slice(0, 1).toUpperCase()}</Text></View>
}

function BookDetails({ book }: { book: MatchBook }) {
  const bookStatusLabel = useBookStatusLabel()
  return (
    <View style={styles.bookCard}>
      {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" /> : <View style={[styles.cover, styles.coverFallback]}><Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text></View>}
      <Text style={styles.bookTitle}>{book.title}</Text>
      <InfoRow label="Author" value={book.author || "Unknown"} />
      <InfoRow label="ISBN" value={book.isbn || "Not provided"} />
      <InfoRow label="Status" value={bookStatusLabel(book.status)} />
      <InfoRow label="Added" value={book.created_at ? formatMatchDate(book.created_at) : "Unknown"} />
      <InfoRow label="Description" value={book.description || "No description provided."} multiline />
    </View>
  )
}

function InfoRow({ label, value, multiline = false }: { label: string; value: string; multiline?: boolean }) {
  return <View style={styles.infoRow}><Text style={styles.infoLabel}>{label}</Text><Text style={[styles.infoValue, multiline && styles.infoValueMultiline]}>{value}</Text></View>
}

function ContactList({ contacts }: { contacts: MatchContacts }) {
  const rows = [
    { label: "Email", value: contacts.email },
    { label: "Phone", value: contacts.phone },
    { label: "Instagram", value: contacts.instagram },
    { label: "Telegram", value: contacts.telegram },
  ].filter((item) => Boolean(item.value))

  if (rows.length === 0) return <View style={styles.contactsCard}><Text style={styles.contactsTitle}>Contact Info</Text><Text style={styles.contactsEmpty}>No contact details shared yet.</Text></View>

  return (
    <View style={styles.contactsCard}>
      <Text style={styles.contactsTitle}>Contact Info</Text>
      {rows.map((row) => <View key={row.label} style={styles.contactRow}><Text style={styles.contactLabel}>{row.label}</Text><Text style={styles.contactValue}>{row.value}</Text></View>)}
    </View>
  )
}

function formatMatchDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown date"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 18, backgroundColor: palette.background, gap: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background, paddingHorizontal: 24 },
  heroCard: { backgroundColor: palette.surface, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, padding: 18, gap: 16, ...shadows.soft },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroText: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontFamily: typography.serif, fontSize: 26, fontWeight: "700", color: palette.text, flex: 1 },
  subtitle: { fontSize: 14, color: palette.textMuted },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  revealedBadge: { backgroundColor: palette.successSoft },
  pendingBadge: { backgroundColor: palette.accentSoft },
  statusText: { fontSize: 12, fontWeight: "700" },
  revealedText: { color: palette.success },
  pendingText: { color: palette.textSoft },
  statusBlock: { gap: 8 },
  statusLine: { fontSize: 14, color: palette.textMuted, lineHeight: 20 },
  section: { backgroundColor: palette.surface, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, padding: 16, gap: 12, ...shadows.soft },
  sectionTitle: { fontFamily: typography.serif, fontSize: 19, fontWeight: "700", color: palette.text },
  borrowExplanation: { fontSize: 14, lineHeight: 20, color: palette.textMuted },
  avatar: { backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 26, fontWeight: "700", color: palette.textSoft },
  bookCard: { gap: 10 },
  cover: { width: "100%", height: 240, borderRadius: 16, backgroundColor: palette.surfaceMuted },
  coverFallback: { alignItems: "center", justifyContent: "center" },
  coverFallbackText: { fontSize: 42, fontWeight: "700", color: palette.textSoft },
  bookTitle: { fontFamily: typography.serif, fontSize: 21, fontWeight: "700", color: palette.text },
  infoRow: { gap: 4 },
  infoLabel: { fontSize: 12, fontWeight: "700", color: palette.textMuted, textTransform: "uppercase", letterSpacing: 0.4 },
  infoValue: { fontSize: 15, color: palette.text },
  infoValueMultiline: { lineHeight: 22 },
  revealButton: { minHeight: 48, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingVertical: 13, paddingHorizontal: 14 },
  revealButtonText: { color: palette.white, fontSize: 15, fontWeight: "700" },
  contactsCard: { backgroundColor: palette.surfaceMuted, borderRadius: 16, padding: 12, gap: 8 },
  contactsTitle: { fontSize: 14, fontWeight: "700", color: palette.text },
  contactsEmpty: { fontSize: 13, color: palette.textMuted },
  contactRow: { gap: 2 },
  contactLabel: { fontSize: 12, fontWeight: "600", color: palette.textMuted },
  contactValue: { fontSize: 14, color: palette.text },
  deleteButton: { minHeight: 48, justifyContent: "center", backgroundColor: palette.dangerSoft, borderRadius: radii.md, alignItems: "center", paddingVertical: 14, marginBottom: 12 },
  deleteButtonText: { color: palette.danger, fontSize: 15, fontWeight: "700" },
  actionDisabled: { opacity: 0.7 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: palette.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: palette.textMuted, textAlign: "center" },
})
