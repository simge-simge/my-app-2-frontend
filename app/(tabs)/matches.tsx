import { useCallback, useState } from "react"
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
import { useFocusEffect } from "expo-router"

import {
  getMatches,
  revealMatchContact,
  type Match,
  type MatchBook,
  type MatchContacts,
} from "@/services/matches"

export default function MatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revealingMatchId, setRevealingMatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadMatches = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      setError(null)
      const response = await getMatches()
      setMatches(response)
    } catch (err) {
      console.error("Failed to load matches", err)
      setError("Could not load your matches.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadMatches(true)
    }, [loadMatches])
  )

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
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4A6CF7" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Matches</Text>
      <Text style={styles.subtitle}>People who matched with your books, newest first</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.match_id}
        renderItem={({ item }) => (
          <MatchRow
            match={item}
            onReveal={handleReveal}
            revealing={revealingMatchId === item.match_id}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          matches.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4A6CF7" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.emptyText}>
              When one of your swipes turns into a match, it will show up here.
            </Text>
          </View>
        }
      />
    </View>
  )
}

function MatchRow({
  match,
  onReveal,
  revealing,
}: {
  match: Match
  onReveal: (matchId: string) => void
  revealing: boolean
}) {
  const displayName = match.other_user.display_name || "Unknown reader"
  const matchedAt = formatMatchDate(match.created_at)
  const canReveal = !match.my_revealed
  const otherStatus = match.their_revealed ? "Revealed contact info" : "Hasn't revealed yet"

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.userRow}>
          {match.other_user.avatar_url ? (
            <Image source={{ uri: match.other_user.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarFallbackText}>{displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}

          <View style={styles.headerText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.date}>{matchedAt}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, match.revealed ? styles.revealedBadge : styles.pendingBadge]}>
          <Text style={[styles.statusText, match.revealed ? styles.revealedText : styles.pendingText]}>
            {match.revealed ? "Revealed" : "Pending"}
          </Text>
        </View>
      </View>

      <View style={styles.booksRow}>
        <BookSummary label="Your book" book={match.my_book} />
        <BookSummary label="Their book" book={match.their_book} />
      </View>

      <View style={styles.revealPanel}>
        <View style={styles.revealStatusRow}>
          <RevealStatusPill
            label="You"
            active={match.my_revealed}
            activeText="Revealed"
            inactiveText="Hidden"
          />
          <RevealStatusPill
            label={displayName}
            active={match.their_revealed}
            activeText="Revealed"
            inactiveText="Hidden"
          />
        </View>

        <Text style={styles.revealHint}>
          {match.revealed
            ? "Contact info is unlocked for both of you."
            : `${displayName} ${otherStatus.toLowerCase()}.`}
        </Text>

        {canReveal ? (
          <Pressable
            style={[styles.revealButton, revealing && styles.revealButtonDisabled]}
            onPress={() => onReveal(match.match_id)}
            disabled={revealing}
          >
            <Text style={styles.revealButtonText}>
              {revealing ? "Revealing..." : "Reveal My Contact Info"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.revealedNotice}>
            <Text style={styles.revealedNoticeText}>
              Your contact info has been revealed for this match.
            </Text>
          </View>
        )}

        {match.contacts ? <ContactList contacts={match.contacts} /> : null}
      </View>
    </View>
  )
}

function BookSummary({ label, book }: { label: string; book: MatchBook }) {
  return (
    <View style={styles.bookColumn}>
      <Text style={styles.bookLabel}>{label}</Text>

      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <Text numberOfLines={2} style={styles.bookTitle}>
        {book.title}
      </Text>
    </View>
  )
}

function RevealStatusPill({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string
  active: boolean
  activeText: string
  inactiveText: string
}) {
  return (
    <View style={[styles.revealPill, active ? styles.revealPillActive : styles.revealPillInactive]}>
      <Text style={styles.revealPillLabel}>{label}</Text>
      <Text style={[styles.revealPillText, active ? styles.revealPillTextActive : styles.revealPillTextInactive]}>
        {active ? activeText : inactiveText}
      </Text>
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
    return (
      <View style={styles.contactsCard}>
        <Text style={styles.contactsTitle}>Contact Info</Text>
        <Text style={styles.contactsEmpty}>No contact details shared yet.</Text>
      </View>
    )
  }

  return (
    <View style={styles.contactsCard}>
      <Text style={styles.contactsTitle}>Contact Info</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.contactRow}>
          <Text style={styles.contactLabel}>{row.label}</Text>
          <Text style={styles.contactValue}>{row.value}</Text>
        </View>
      ))}
    </View>
  )
}

function formatMatchDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Recently matched"
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 18,
  },
  error: {
    color: "#B42318",
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
    gap: 14,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FC",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#D9E3FF",
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallbackText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A6CF7",
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  date: {
    fontSize: 13,
    color: "#6B7280",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  revealedBadge: {
    backgroundColor: "#ECFDF3",
  },
  pendingBadge: {
    backgroundColor: "#EEF2FF",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  revealedText: {
    color: "#027A48",
  },
  pendingText: {
    color: "#4A6CF7",
  },
  booksRow: {
    flexDirection: "row",
    gap: 12,
  },
  revealPanel: {
    borderTopWidth: 1,
    borderTopColor: "#EAECF5",
    paddingTop: 14,
    gap: 12,
  },
  revealStatusRow: {
    flexDirection: "row",
    gap: 10,
  },
  revealPill: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  revealPillActive: {
    backgroundColor: "#ECFDF3",
    borderColor: "#ABEFC6",
  },
  revealPillInactive: {
    backgroundColor: "#F8F9FC",
    borderColor: "#D0D5DD",
  },
  revealPillLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667085",
    marginBottom: 4,
  },
  revealPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  revealPillTextActive: {
    color: "#027A48",
  },
  revealPillTextInactive: {
    color: "#344054",
  },
  revealHint: {
    fontSize: 13,
    color: "#667085",
    lineHeight: 18,
  },
  revealButton: {
    backgroundColor: "#4A6CF7",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  revealButtonDisabled: {
    opacity: 0.7,
  },
  revealButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  revealedNotice: {
    backgroundColor: "#EEF4FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  revealedNoticeText: {
    color: "#3538CD",
    fontSize: 13,
    fontWeight: "600",
  },
  contactsCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  contactsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  contactsEmpty: {
    fontSize: 13,
    color: "#667085",
  },
  contactRow: {
    gap: 2,
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#667085",
  },
  contactValue: {
    fontSize: 14,
    color: "#111827",
  },
  bookColumn: {
    flex: 1,
  },
  bookLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#667085",
    marginBottom: 8,
  },
  cover: {
    width: "100%",
    height: 150,
    borderRadius: 14,
    backgroundColor: "#D9E3FF",
    marginBottom: 10,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallbackText: {
    fontSize: 34,
    fontWeight: "700",
    color: "#4A6CF7",
  },
  bookTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
})
