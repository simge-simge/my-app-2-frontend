import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { getCachedApiData } from "@/services/api"
import { getInbox, type InboxResponse } from "@/services/inbox"
import { subscribeToBackgroundActions } from "@/utils/backgroundAction"

export default function AppHeaderActions({ refreshKey }: { refreshKey?: string }) {
  const { t } = useTranslation()
  const [unreadCount, setUnreadCount] = useState(() => getCachedApiData<InboxResponse>("/inbox/")?.unread_count ?? 0)
  const inboxUpdatePending = useRef(false)
  const inboxRefreshGeneration = useRef(0)

  const refreshInbox = useCallback((forceRefresh = false) => {
    const refreshGeneration = ++inboxRefreshGeneration.current
    void getInbox(forceRefresh)
      .then((inbox) => {
        if (!inboxUpdatePending.current && refreshGeneration === inboxRefreshGeneration.current) {
          setUnreadCount(inbox.unread_count)
        }
      })
      .catch((error) => console.error("Failed to load inbox summary", error))
  }, [])

  useEffect(() => subscribeToBackgroundActions((update) => {
    if (update.event !== "inbox-unread-count") return

    if (update.status === "pending" && typeof update.optimisticResult === "number") {
      inboxUpdatePending.current = true
      inboxRefreshGeneration.current += 1
      setUnreadCount(update.optimisticResult)
      return
    }

    inboxUpdatePending.current = false
    refreshInbox(true)
  }), [refreshInbox])

  useEffect(() => { refreshInbox() }, [refreshInbox, refreshKey])

  return (
    <View style={styles.headerActions}>
      <HeaderAction icon="notifications-outline" label={t("openMessages")} onPress={() => router.push("/inbox")} badge={unreadCount} />
      <HeaderAction icon="settings-outline" label={t("openSettings")} onPress={() => router.push("/settings")} />
    </View>
  )
}

function HeaderAction({ icon, label, onPress, badge = 0 }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]} onPress={onPress} accessibilityLabel={label}>
      <Ionicons name={icon} size={21} color={palette.ink} />
      {badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text></View> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: "row", gap: 7 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong },
  pressed: { transform: [{ scale: 0.94 }] },
  badge: { position: "absolute", right: -4, top: -4, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: palette.danger, borderWidth: 2, borderColor: palette.background },
  badgeText: { color: palette.paper, fontSize: 9, fontWeight: "800" },
})
