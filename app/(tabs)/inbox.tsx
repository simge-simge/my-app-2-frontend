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

import { palette } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import {
  decideCommunityRequest,
  getInbox,
  markAllNotificationsRead,
  markNotificationRead,
  type CommunityJoinRequest,
  type InboxNotification,
  type InboxResponse,
} from "@/services/inbox"

export default function InboxScreen() {
  const cachedInbox = getCachedApiData<InboxResponse>("/inbox/")
  const [notifications, setNotifications] = useState<InboxNotification[]>(() => cachedInbox?.notifications ?? [])
  const [requests, setRequests] = useState<CommunityJoinRequest[]>(() => cachedInbox?.join_requests ?? [])
  const [loading, setLoading] = useState(() => cachedInbox === undefined)
  const hasLoaded = useRef(cachedInbox !== undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadInbox = useCallback(async (showLoader = false) => {
    if (showLoader && !hasLoaded.current) setLoading(true)
    try {
      setError(null)
      const inbox = await getInbox()
      setNotifications(inbox.notifications)
      setRequests(inbox.join_requests)
    } catch (err) {
      console.error("Failed to load inbox", err)
      setError("Could not load your inbox.")
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { loadInbox(true) }, [loadInbox]))

  const handleDecision = async (request: CommunityJoinRequest, decision: "approved" | "declined") => {
    try {
      setActingId(request.id)
      setError(null)
      await decideCommunityRequest(request.id, decision)
      await loadInbox()
    } catch (err) {
      console.error("Failed to review community request", err)
      Alert.alert("Error", "Could not review this request.")
    } finally {
      setActingId(null)
    }
  }

  const handleNotification = async (notification: InboxNotification) => {
    if (!notification.read_at) {
      try {
        await markNotificationRead(notification.id)
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item))
      } catch (err) {
        console.error("Failed to mark notification read", err)
      }
    }
    if (notification.metadata?.match_id) {
      router.push({ pathname: "/matches/[matchId]", params: { matchId: notification.metadata.match_id } })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      const readAt = new Date().toISOString()
      setNotifications((items) => items.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
    } catch (err) {
      console.error("Failed to mark inbox read", err)
      setError("Could not update your inbox.")
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  }

  const hasUnread = notifications.some((item) => !item.read_at)
  const isEmpty = requests.length === 0 && notifications.length === 0

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isEmpty && styles.emptyContent]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInbox() }} tintColor={palette.text} />}
    >
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.title}>Inbox</Text>
          <Text style={styles.subtitle}>Community and book swap updates</Text>
        </View>
        {hasUnread ? <Pressable onPress={handleMarkAllRead}><Text style={styles.markRead}>Mark all read</Text></Pressable> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {requests.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community requests</Text>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.iconWrap}><Ionicons name="people-outline" size={22} color={palette.accentDark} /></View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{request.requester.display_name || "A reader"} wants to join</Text>
                <Text style={styles.date}>{formatDate(request.created_at)}</Text>
                <View style={styles.actions}>
                  <Pressable style={[styles.actionButton, styles.declineButton]} disabled={actingId === request.id} onPress={() => handleDecision(request, "declined")}>
                    <Text style={styles.declineText}>Decline</Text>
                  </Pressable>
                  <Pressable style={[styles.actionButton, styles.approveButton]} disabled={actingId === request.id} onPress={() => handleDecision(request, "approved")}>
                    <Text style={styles.approveText}>{actingId === request.id ? "Saving..." : "Approve"}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {notifications.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {notifications.map((notification) => (
            <Pressable key={notification.id} style={[styles.notificationCard, !notification.read_at && styles.unreadCard]} onPress={() => handleNotification(notification)}>
              <View style={[styles.dot, notification.read_at && styles.readDot]} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{notification.title}</Text>
                <Text style={styles.message}>{notification.message}</Text>
                <Text style={styles.date}>{formatDate(notification.created_at)}</Text>
              </View>
              {notification.metadata?.match_id ? <Ionicons name="chevron-forward" size={18} color={palette.textMuted} /> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Ionicons name="mail-open-outline" size={44} color={palette.textSoft} />
          <Text style={styles.emptyTitle}>Your inbox is clear</Text>
          <Text style={styles.emptyText}>Community decisions and book swap updates will appear here.</Text>
        </View>
      ) : null}
    </ScrollView>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recently"
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  content: { padding: 20, paddingBottom: 36, gap: 22 },
  emptyContent: { flexGrow: 1 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  title: { fontSize: 28, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: 5 },
  markRead: { color: palette.accentDark, fontSize: 13, fontWeight: "700" },
  error: { color: palette.danger },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", color: palette.text },
  requestCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  notificationCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  unreadCard: { borderColor: palette.accent, backgroundColor: palette.accentSoft },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.accent },
  readDot: { backgroundColor: palette.border },
  cardBody: { flex: 1, gap: 5 },
  cardTitle: { color: palette.text, fontSize: 16, fontWeight: "700" },
  message: { color: palette.textMuted, fontSize: 14, lineHeight: 20 },
  date: { color: palette.textMuted, fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  actionButton: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 13 },
  declineButton: { backgroundColor: palette.dangerSoft },
  approveButton: { backgroundColor: palette.success },
  declineText: { color: palette.danger, fontWeight: "700" },
  approveText: { color: palette.white, fontWeight: "700" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  emptyTitle: { color: palette.text, fontSize: 20, fontWeight: "700" },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
})
