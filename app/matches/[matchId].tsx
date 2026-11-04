import ProfileAvatar from "@/components/UserAvatar"
import DefaultBookCover from "@/components/DefaultBookCover"
import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { layout, palette, radii, typography } from "@/constants/theme"
import AdminBadge from "@/components/AdminBadge"
import ConfirmationModal from "@/components/ConfirmationModal"
import { getCachedApiData } from "@/services/api"
import {
  approveMatch,
  deleteMatch,
  endMatchExchange,
  getMatch,
  markMatchBookUnavailable,
  revealMatchContact,
  type Match,
  type MatchBook,
  type MatchContacts,
  type MatchUser,
} from "@/services/matches"
import { runInBackground } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"
import { startConversation } from "@/services/messages"

export default function MatchDetailScreen() {
  const { height } = useWindowDimensions()
  const { language, t } = useTranslation()
  const { matchId } = useLocalSearchParams<{ matchId: string }>()
  const cachePath = matchId ? `/matches/${matchId}` : ""
  const cachedMatch = getCachedApiData<Match>(cachePath)
  const [match, setMatch] = useState<Match | null>(() => cachedMatch ?? null)
  const [loading, setLoading] = useState(() => cachedMatch === undefined)
  const hasLoaded = useRef(cachedMatch !== undefined)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [startingConversation, setStartingConversation] = useState(false)
  const [endingExchange, setEndingExchange] = useState(false)

  const loadMatch = useCallback(async () => {
    if (!matchId) return
    try {
      if (!hasLoaded.current) setLoading(true)
      setError(null)
      const response = await getMatch(matchId)
      setMatch(response)
    } catch (err) {
      console.error("Failed to load match", err)
      setError(t("matchLoadError"))
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [matchId, t])

  useFocusEffect(useCallback(() => { loadMatch() }, [loadMatch]))

  const handleReveal = useCallback(() => {
    if (!matchId || !match) return
    const previous = match
    setError(null)
    setMatch({ ...match, my_revealed: true, revealed: match.their_revealed })
    runInBackground(() => revealMatchContact(matchId), {
      onSuccess: () => loadMatch(),
      onError: (err) => {
        setMatch(previous)
        console.error("Failed to reveal contact info", err)
        Alert.alert(t("changeNotSaved"), t("revealContactError"))
      },
    })
  }, [loadMatch, match, matchId, t])

  const handleApprove = useCallback(() => {
    if (!matchId || !match) return
    const previous = match
    setError(null)
    setMatch({ ...match, approved_at: new Date().toISOString() })
    runInBackground(() => approveMatch(matchId), {
      onSuccess: () => loadMatch(),
      onError: (err) => {
        setMatch(previous)
        console.error("Failed to approve match", err)
        Alert.alert(t("changeNotSaved"), t("approveMatchError"))
      },
    })
  }, [loadMatch, match, matchId, t])

  const handleMarkUnavailable = useCallback(() => {
    if (!matchId || !match?.my_book) return
    const previous = match
    setError(null)
    setMatch({ ...match, my_book: { ...match.my_book, status: "lent" } })
    runInBackground(() => markMatchBookUnavailable(matchId), {
      onSuccess: () => loadMatch(),
      onError: (err) => {
        setMatch(previous)
        console.error("Failed to mark match book unavailable", err)
        Alert.alert(t("changeNotSaved"), t("markBookUnavailableError"))
      },
    })
  }, [loadMatch, match, matchId, t])

  const handleEndExchange = useCallback(async () => {
    if (!matchId || endingExchange) return
    setEndingExchange(true)
    try {
      await endMatchExchange(matchId)
      await loadMatch()
    } catch (err) {
      console.error("Failed to end exchange", err)
      Alert.alert(t("changeNotSaved"), t("endExchangeError"))
    } finally {
      setEndingExchange(false)
    }
  }, [endingExchange, loadMatch, matchId, t])

  const handleDelete = useCallback(() => {
    if (!matchId || deleting) return
    setShowDeleteConfirmation(false)
    setDeleting(true)
    const deletedMatch = match
    router.replace("/matches")
    runInBackground(() => deleteMatch(matchId), {
      event: "match-deleted",
      optimisticResult: deletedMatch ? { match: deletedMatch } : undefined,
      onError: (err) => {
        console.error("Failed to delete match", err)
        Alert.alert(t("matchNotDeleted"), t("couldNotDeleteMatch"))
      },
    })
  }, [deleting, match, matchId, t])

  const confirmDelete = useCallback(() => {
    setShowDeleteConfirmation(true)
  }, [])

  const handleConversation = useCallback(async () => {
    if (!matchId || !match) return
    if (match.conversation_id) {
      router.push({ pathname: "/chats/[conversationId]", params: { conversationId: match.conversation_id } })
      return
    }
    if (!match.my_messaging_enabled) {
      router.push("/settings")
      return
    }
    if (!match.their_messaging_enabled) return
    try {
      setStartingConversation(true)
      const conversation = await startConversation(matchId)
      router.push({ pathname: "/chats/[conversationId]", params: { conversationId: conversation.id } })
    } catch (err) {
      console.error("Failed to start conversation", err)
      Alert.alert(t("conversationNotStarted"), t("tryAgain"))
    } finally {
      setStartingConversation(false)
    }
  }, [match, matchId, t])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  }

  if (!match) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>{t("matchUnavailable")}</Text>
        <Text style={styles.emptyText}>{error ?? t("matchNotFound")}</Text>
      </View>
    )
  }

  const displayName = match.other_user.display_name || t("unknownReader")
  const matchedAt = formatMatchDate(match.created_at, language, t("unknownDate"))
  const canReveal = !match.my_revealed
  const isBorrowMatch = !match.my_book || !match.their_book
  const borrowedBook = match.my_book ?? match.their_book
  const isSwapMatch = Boolean(match.my_book && match.their_book)
  const isApprovedSwap = Boolean(isSwapMatch && match.approved_at)
  const myBookUnavailable = Boolean(isApprovedSwap && ["lent", "matched"].includes(match.my_book?.status ?? ""))
  const theirBookUnavailable = Boolean(isApprovedSwap && ["lent", "matched"].includes(match.their_book?.status ?? ""))
  const exchangeIsUnderway = myBookUnavailable || theirBookUnavailable
  const canEndExchange = Boolean(match.my_book && ["lent", "matched"].includes(match.my_book.status ?? "")
    && (!match.my_book.reserved_match_id || match.my_book.reserved_match_id === matchId))

  return (
    <>
      <ConfirmationModal
        visible={showDeleteConfirmation}
        title={t("deleteMatch")}
        message={t("deleteMatchConfirm")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onCancel={() => setShowDeleteConfirmation(false)}
        onConfirm={() => { void handleDelete() }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {isBorrowMatch && borrowedBook ? (
          <View style={[styles.booksPanel, { height: Math.max(170, Math.min(200, height * 0.25)) }, styles.singleBookStage]}>
            <Text style={styles.borrowExplanation}>{match.my_book ? t("youAreLending") : t("youAreBorrowing")}</Text>
            <View style={styles.singleBookVisual}>
              <BookVisual label={match.my_book ? t("yourBook") : t("personsBook", { name: displayName })} book={borrowedBook} />
            </View>
          </View>
        ) : match.my_book && match.their_book ? (
          <View style={[styles.booksPanel, { height: Math.max(170, Math.min(200, height * 0.25)) }, styles.booksRow]}>
            <BookVisual label={t("yourBook")} book={match.my_book} />
            <View style={styles.exchangeIcon}><Ionicons name="swap-horizontal" size={28} color={palette.success} /></View>
            <BookVisual label={t("theirBook")} book={match.their_book} />
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("viewLibrary", { name: displayName })}
          onPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: match.other_user.id } })}
          style={styles.heroHeader}
        >
          <UserAvatar user={match.other_user} size={48} />
          <View style={styles.heroText}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{displayName}</Text>
              {match.other_user.admin ? <AdminBadge /> : null}
            </View>
            <Text style={styles.subtitle}>{t("matchedOn", { date: matchedAt })}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={palette.textMuted} />
        </Pressable>

        <View style={styles.contactSection}>
          <Text style={styles.exchangeGuidance}>{t("arrangeBookExchange")}</Text>
          <View style={styles.contactHeading}>
            <Ionicons name="lock-closed-outline" size={18} color={palette.textMuted} />
            <Text style={styles.contactsTitle}>{t("contactStatus")}</Text>
          </View>
          <View style={styles.contactStatusPanel}>
            <ContactStatusRow label={t("you")} shared={match.my_revealed} />
            <View style={styles.contactStatusDivider} />
            <ContactStatusRow label={displayName} shared={match.their_revealed} />
          </View>

          <View style={styles.contactActions}>
          {isSwapMatch && !isApprovedSwap ? (
            <Pressable style={styles.approveButton} onPress={handleApprove}>
              <Ionicons name="checkmark-circle-outline" size={20} color={palette.white} />
              <Text style={styles.approveButtonText}>{t("approveMatch")}</Text>
            </Pressable>
          ) : null}
          {(!isSwapMatch || isApprovedSwap) && canReveal ? (
            <Pressable style={styles.revealButton} onPress={handleReveal}>
              <Ionicons name="chatbubble-outline" size={20} color={palette.white} />
              <Text style={styles.revealButtonText}>{t("revealMyContact")}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            disabled={startingConversation || (Boolean(match.my_messaging_enabled) && !match.their_messaging_enabled && !match.conversation_id)}
            onPress={() => void handleConversation()}
            style={[styles.conversationButton, (!match.my_messaging_enabled || !match.their_messaging_enabled) && !match.conversation_id && styles.conversationButtonPassive]}
          >
            {startingConversation ? <ActivityIndicator color={palette.white} /> : <Ionicons name="chatbubbles-outline" size={20} color={match.conversation_id || (match.my_messaging_enabled && match.their_messaging_enabled) ? palette.white : palette.textMuted} />}
            <Text style={[styles.conversationButtonText, !match.conversation_id && (!match.my_messaging_enabled || !match.their_messaging_enabled) && styles.conversationButtonPassiveText]}>
              {match.conversation_id ? t("openChat") : t("startConversation")}
            </Text>
          </Pressable>
          {!match.conversation_id && !match.my_messaging_enabled ? <Text style={styles.chatHint}>{t("activateMessagingHint")}</Text> : null}
          {!match.conversation_id && match.my_messaging_enabled && !match.their_messaging_enabled ? <Text style={styles.chatHint}>{t("matchMessagingDisabled")}</Text> : null}
          {isApprovedSwap && !myBookUnavailable ? (
            <>
              <Pressable style={styles.unavailableButton} onPress={handleMarkUnavailable}>
                <Ionicons name="bookmark-outline" size={20} color={palette.success} />
                <Text style={styles.unavailableButtonText}>{t("reserveMyBook")}</Text>
              </Pressable>
              <Text style={styles.reserveHint}>{t("reserveBookHint")}</Text>
            </>
          ) : null}
          {exchangeIsUnderway ? <Text style={styles.exchangeUnderway}>{t("exchangeUnderway")}</Text> : null}
          {canEndExchange ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={endingExchange}
                onPress={() => void handleEndExchange()}
                style={[styles.unavailableButton, endingExchange && styles.actionDisabled]}
              >
                {endingExchange ? <ActivityIndicator color={palette.success} /> : <Ionicons name="checkmark-done-outline" size={20} color={palette.success} />}
                <Text style={styles.unavailableButtonText}>{t("endExchange")}</Text>
              </Pressable>
              <Text style={styles.reserveHint}>{t("endExchangeHint")}</Text>
            </>
          ) : null}
          {match.contacts ? <ContactList contacts={match.contacts} /> : null}
          </View>

          <View style={styles.removeDivider} />
          <Pressable
            accessibilityLabel={t("deleteMatch")}
            accessibilityRole="button"
            disabled={deleting}
            style={[styles.deleteButton, deleting && styles.actionDisabled]}
            onPress={confirmDelete}
          >
            {deleting ? <ActivityIndicator color={palette.danger} /> : <><Ionicons name="close" size={19} color={palette.danger} /><Text style={styles.deleteButtonText}>{t("deleteMatch")}</Text></>}
          </Pressable>
        </View>
      </View>
      </ScrollView>
    </>
  )
}

function UserAvatar({ user, size }: { user: MatchUser; size: number }) {
  return <ProfileAvatar userId={user.id} uri={user.avatar_url} size={size} />
}

function BookVisual({ label, book }: { label: string; book: MatchBook }) {
  return (
    <View style={styles.bookVisual}>
      <Text style={styles.bookLabel}>{label}</Text>
      {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="contain" /> : <DefaultBookCover title={book.title} author={book.author} style={styles.cover} />}
      <Text numberOfLines={2} style={styles.bookTitle}>{book.title}</Text>
    </View>
  )
}

function ContactStatusRow({ label, shared }: { label: string; shared: boolean }) {
  const { t } = useTranslation()
  return <View style={styles.contactStatusRow}><Text style={styles.contactStatusLabel}>{label}</Text><Text style={[styles.contactStatusValue, shared && styles.contactStatusShared]}>{shared ? t("contactShared") : t("contactNotShared")}</Text></View>
}

function ContactList({ contacts }: { contacts: MatchContacts }) {
  const { t } = useTranslation()
  const rows = [
    { label: t("email"), value: contacts.email },
    { label: t("phone"), value: contacts.phone },
    { label: "Instagram", value: contacts.instagram },
    { label: "Telegram", value: contacts.telegram },
  ].filter((item) => Boolean(item.value))

  if (rows.length === 0) return null

  return (
    <View style={styles.contactsCard}>
      <Text style={styles.contactsTitle}>{t("contactInfo")}</Text>
      {rows.map((row) => <View key={row.label} style={styles.contactRow}><Text style={styles.contactLabel}>{row.label}</Text><Text style={styles.contactValue}>{row.value}</Text></View>)}
    </View>
  )
}

function formatMatchDate(value: string, language: "en" | "tr", fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  content: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", paddingHorizontal: 16, paddingTop: 2, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background, paddingHorizontal: 24 },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  heroText: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontFamily: typography.serif, fontSize: 24, lineHeight: 29, fontWeight: "700", color: palette.text, flex: 1 },
  subtitle: { fontSize: 12, color: palette.textMuted },
  borrowExplanation: { fontSize: 13, fontWeight: "700", color: palette.accentDark, textAlign: "center" },
  avatar: { backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarFallbackText: { fontSize: 26, fontWeight: "700", color: palette.textSoft },
  booksPanel: { width: "100%", padding: 8, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  booksRow: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  singleBookStage: { alignItems: "center", gap: 5 },
  singleBookVisual: { flex: 1, width: "52%", minWidth: 160 },
  bookVisual: { flex: 1, minWidth: 0, gap: 5, alignItems: "center" },
  bookLabel: { fontSize: 12, fontWeight: "600", color: palette.textMuted },
  exchangeIcon: { alignSelf: "center", width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: palette.successSoft, borderWidth: 1, borderColor: palette.success },
  cover: { flex: 1, minHeight: 60, width: "100%", borderRadius: 12, backgroundColor: palette.surfaceMuted },
  bookTitle: { fontFamily: typography.serif, fontSize: 15, lineHeight: 18, fontWeight: "700", color: palette.text, textAlign: "center" },
  contactSection: { gap: 7 },
  exchangeGuidance: { fontSize: 13, lineHeight: 19, color: palette.textMuted },
  contactHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  contactStatusPanel: { paddingHorizontal: 11, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  contactStatusDivider: { height: 1, backgroundColor: palette.border },
  contactStatusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", minHeight: 34, gap: 12 },
  contactActions: { paddingTop: 2, gap: 7 },
  contactStatusLabel: { flex: 1, fontSize: 13, color: palette.textMuted },
  contactStatusValue: { flexShrink: 1, fontSize: 13, color: palette.orange, textAlign: "right" },
  contactStatusShared: { color: palette.success, fontWeight: "700" },
  revealButton: { minHeight: 44, flexDirection: "row", gap: 8, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingHorizontal: 14 },
  revealButtonText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  conversationButton: { minHeight: 44, flexDirection: "row", gap: 8, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingHorizontal: 14 },
  conversationButtonPassive: { backgroundColor: palette.surfaceMuted, borderWidth: 1, borderColor: palette.border },
  conversationButtonText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  conversationButtonPassiveText: { color: palette.textMuted },
  chatHint: { marginTop: -3, color: palette.textMuted, fontSize: 11, textAlign: "center" },
  approveButton: { minHeight: 44, flexDirection: "row", gap: 8, justifyContent: "center", backgroundColor: palette.accent, borderRadius: radii.md, alignItems: "center", paddingHorizontal: 14 },
  approveButtonText: { color: palette.white, fontSize: 14, fontWeight: "700" },
  unavailableButton: { minHeight: 44, flexDirection: "row", gap: 8, justifyContent: "center", backgroundColor: palette.successSoft, borderWidth: 1, borderColor: palette.success, borderRadius: radii.md, alignItems: "center", paddingHorizontal: 14 },
  unavailableButtonText: { color: palette.success, fontSize: 14, fontWeight: "800" },
  reserveHint: { marginTop: -4, fontSize: 11, lineHeight: 15, color: palette.textMuted, textAlign: "center" },
  exchangeUnderway: { color: palette.success, fontSize: 13, lineHeight: 18, fontWeight: "700" },
  contactsCard: { backgroundColor: palette.surfaceMuted, borderRadius: 12, padding: 9, gap: 5 },
  contactsTitle: { fontSize: 14, fontWeight: "700", color: palette.text },
  contactRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  contactLabel: { fontSize: 12, fontWeight: "600", color: palette.textMuted },
  contactValue: { flex: 1, textAlign: "right", fontSize: 14, color: palette.text },
  removeDivider: { height: 1, backgroundColor: palette.border, marginTop: 4 },
  deleteButton: { minHeight: 40, flexDirection: "row", gap: 6, justifyContent: "center", alignItems: "center" },
  deleteButtonText: { color: palette.danger, fontSize: 14, fontWeight: "700" },
  actionDisabled: { opacity: 0.7 },
  emptyTitle: { fontSize: 22, fontWeight: "700", color: palette.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: palette.textMuted, textAlign: "center" },
})
