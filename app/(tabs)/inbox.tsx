import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { router, useFocusEffect } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import PageHeader from "@/components/PageHeader"
import { useTranslation } from "@/localization/LanguageContext"
import { localizeInboxNotification } from "@/localization/inboxNotification"
import { getCachedApiData } from "@/services/api"
import { runInBackground } from "@/utils/backgroundAction"
import {
  decideBorrowRequest,
  decideCommunityRequest,
  getInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type BookBorrowRequest,
  type CommunityJoinRequest,
  type InboxNotification,
  type InboxResponse,
} from "@/services/inbox"

export default function InboxScreen() {
  const { language, t } = useTranslation()
  const cachedInbox = getCachedApiData<InboxResponse>("/inbox/")
  const [notifications, setNotifications] = useState<InboxNotification[]>(() => cachedInbox?.notifications ?? [])
  const [requests, setRequests] = useState<CommunityJoinRequest[]>(() => cachedInbox?.join_requests ?? [])
  const [borrowRequests, setBorrowRequests] = useState<BookBorrowRequest[]>(() => cachedInbox?.borrow_requests ?? [])
  const [loading, setLoading] = useState(() => cachedInbox === undefined)
  const hasLoaded = useRef(cachedInbox !== undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInbox = useCallback(async (showLoader = false) => {
    if (showLoader && !hasLoaded.current) setLoading(true)
    try {
      setError(null)
      const inbox = await getInbox()
      setNotifications(inbox.notifications)
      setRequests(inbox.join_requests)
      setBorrowRequests(inbox.borrow_requests ?? [])
    } catch (err) {
      console.error("Failed to load inbox", err)
      setError(t("couldNotLoadInbox"))
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useFocusEffect(useCallback(() => { loadInbox(true) }, [loadInbox]))

  const handleDecision = (request: CommunityJoinRequest, decision: "approved" | "declined") => {
    setError(null)
    setRequests((items) => items.filter((item) => item.id !== request.id))
    runInBackground(() => decideCommunityRequest(request.id, decision), {
      onSuccess: () => loadInbox(),
      onError: (err) => {
        setRequests((items) => items.some((item) => item.id === request.id) ? items : [request, ...items])
        console.error("Failed to review community request", err)
        Alert.alert(t("updateNotSaved"), t("reviewCommunityError"))
      },
    })
  }

  const handleBorrowDecision = (request: BookBorrowRequest, decision: "accepted" | "declined") => {
    setError(null)
    setBorrowRequests((items) => items.map((item) => item.id === request.id ? { ...item, status: decision } : item))
    runInBackground(() => decideBorrowRequest(request.id, decision), {
      onSuccess: () => loadInbox(),
      onError: (err) => {
        setBorrowRequests((items) => items.map((item) => item.id === request.id ? request : item))
        console.error("Failed to review borrow request", err)
        Alert.alert(t("updateNotSaved"), t("reviewBorrowError"))
      },
    })
  }

  const openBorrowMatch = (request: BookBorrowRequest) => {
    if (request.match_id) {
      router.push({ pathname: "/matches/[matchId]", params: { matchId: request.match_id } })
      return
    }
    router.push("/matches")
  }

  const handleNotification = (notification: InboxNotification) => {
    if (!notification.read_at) {
      setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item))
      runInBackground(() => markNotificationRead(notification.id), {
        onError: (err) => {
          setNotifications((items) => items.map((item) => item.id === notification.id ? notification : item))
          console.error("Failed to mark notification read", err)
          Alert.alert(t("updateNotSaved"), t("markNotificationError"))
        },
      })
    }
    if (notification.metadata?.match_id) {
      router.push({ pathname: "/matches/[matchId]", params: { matchId: notification.metadata.match_id } })
    }
  }

  const handleMarkAllRead = () => {
    const previous = notifications
    const readAt = new Date().toISOString()
    setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
    runInBackground(markAllNotificationsRead, {
      onError: (err) => {
        setNotifications(previous)
        console.error("Failed to mark inbox read", err)
        Alert.alert(t("updateNotSaved"), t("markInboxError"))
      },
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <PageHeader title={t("inbox")} subtitle={t("inboxSubtitle")} />
        <View style={styles.loadingCenter}><ActivityIndicator size="large" color={palette.text} /></View>
      </View>
    )
  }

  const hasUnread = notifications.some((item) => !item.read_at)
  const isEmpty = requests.length === 0 && borrowRequests.length === 0 && notifications.length === 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isEmpty && styles.emptyContent]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInbox() }} tintColor={palette.text} />}
    >
      <PageHeader
        title={t("inbox")}
        subtitle={t("inboxSubtitle")}
        trailing={hasUnread ? <Pressable onPress={handleMarkAllRead}><Text style={styles.markRead}>{t("markAllRead")}</Text></Pressable> : null}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {borrowRequests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("borrowRequests")}</Text>
          {borrowRequests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.iconWrap}><Ionicons name="book-outline" size={22} color={palette.accentDark} /></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  {request.status === "pending" ? (
                    <><Text
                      accessibilityRole="link"
                      onPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: request.requester.id } })}
                      style={styles.memberLink}
                    >
                      {request.requester.display_name || t("aReader")}
                    </Text>{" "}{t("wantsToBorrow", { book: request.book.title })}</>
                  ) : t(request.status === "accepted" ? "youAcceptedBorrow" : "youDeclinedBorrow", {
                    name: request.requester.display_name || t("aReader"),
                    book: request.book.title,
                  })}
                </Text>
                {request.book.author ? <Text style={styles.message}>{t("byAuthor", { author: request.book.author })}</Text> : null}
                <Text style={styles.date}>{formatDate(request.reviewed_at ?? request.created_at, language === "tr" ? "tr-TR" : "en-US", t("recently"))}</Text>
                {request.status === "pending" ? (
                  <View style={styles.actions}>
                    <Pressable style={[styles.actionButton, styles.declineButton]} onPress={() => handleBorrowDecision(request, "declined")}>
                      <Text style={styles.declineText}>{t("decline")}</Text>
                    </Pressable>
                    <Pressable style={[styles.actionButton, styles.approveButton]} onPress={() => handleBorrowDecision(request, "accepted")}>
                      <Text style={styles.approveText}>{t("accept")}</Text>
                    </Pressable>
                  </View>
                ) : request.status === "accepted" ? (
                  <Pressable style={styles.matchButton} onPress={() => openBorrowMatch(request)}>
                    <Text style={styles.matchButtonText}>{t("goToMatches")}</Text>
                    <Ionicons name="arrow-forward" size={17} color={palette.white} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {requests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("communityRequests")}</Text>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.iconWrap}><Ionicons name="people-outline" size={22} color={palette.accentDark} /></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>
                  <Text
                    accessibilityRole="link"
                    onPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: request.requester.id } })}
                    style={styles.memberLink}
                  >
                    {request.requester.display_name || t("aReader")}
                  </Text>{" "}{t("wantsToJoin")}
                </Text>
                <Text style={styles.date}>{formatDate(request.created_at, language === "tr" ? "tr-TR" : "en-US", t("recently"))}</Text>
                <View style={styles.actions}>
                  <Pressable style={[styles.actionButton, styles.declineButton]} onPress={() => handleDecision(request, "declined")}>
                    <Text style={styles.declineText}>{t("decline")}</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.approveButton]} onPress={() => handleDecision(request, "approved")}>
                    <Text style={styles.approveText}>{t("approve")}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {notifications.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("notifications")}</Text>
          {notifications.map((notification) => {
            const copy = localizeInboxNotification(notification, language, t)
            return (
              <Pressable key={notification.id} style={[styles.notificationCard, !notification.read_at && styles.unreadCard]} onPress={() => handleNotification(notification)}>
                <View style={[styles.dot, notification.read_at && styles.readDot]} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{copy.title}</Text>
                  <Text style={styles.message}>{copy.message}</Text>
                  <Text style={styles.date}>{formatDate(notification.created_at, language === "tr" ? "tr-TR" : "en-US", t("recently"))}</Text>
                </View>
                {notification.metadata?.match_id ? <Ionicons name="chevron-forward" size={18} color={palette.textMuted} /> : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open-outline" size={44} color={palette.textSoft} />
          <Text style={styles.emptyTitle}>{t("inboxClear")}</Text>
          <Text style={styles.emptyText}>{t("inboxClearHint")}</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

function formatDate(value: string, locale: string, fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 20, paddingBottom: 36, gap: 22 },
  emptyContent: { flexGrow: 1 },
  markRead: { color: palette.accentDark, fontSize: 13, fontWeight: "700" },
  error: { color: palette.danger },
  section: { gap: 12 },
  sectionTitle: { fontFamily: typography.serif, fontSize: 18, fontWeight: "700", color: palette.text },
  requestCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.surface, ...shadows.soft },
  notificationCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.surface, ...shadows.soft },
  unreadCard: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.accent },
  readDot: { backgroundColor: palette.border },
  cardBody: { flex: 1, gap: 5 },
  cardTitle: { color: palette.text, fontSize: 16, fontWeight: "700" },
  memberLink: { color: palette.accentDark, textDecorationLine: "underline" },
  message: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  date: { color: palette.textMuted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  actionButton: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center", paddingVertical: 10, borderRadius: radii.md },
  declineButton: { backgroundColor: palette.dangerSoft },
  approveButton: { backgroundColor: palette.success },
  declineText: { color: palette.danger, fontWeight: "700" },
  approveText: { color: palette.white, fontWeight: "700" },
  matchButton: { minHeight: 44, marginTop: 8, paddingHorizontal: 14, borderRadius: radii.md, backgroundColor: palette.accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  matchButtonText: { color: palette.white, fontWeight: "700" },
  actionDisabled: { opacity: 0.7 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: palette.text, fontFamily: typography.serif, fontSize: 21, fontWeight: "700" },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
  loadingScreen: { flex: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 20, backgroundColor: palette.background },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
})
