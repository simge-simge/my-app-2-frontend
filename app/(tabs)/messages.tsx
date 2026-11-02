import UserAvatar from "@/components/UserAvatar"
import { useCallback, useState } from "react"
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { router, useFocusEffect } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import PageHeader from "@/components/PageHeader"
import { layout, palette, radii, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { getConversations, type Conversation } from "@/services/messages"

export default function MessagesScreen() {
  const { language, t } = useTranslation()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    try {
      setError(false)
      setConversations(await getConversations())
    } catch (err) {
      console.error("Failed to load conversations", err)
      setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { void load() }, [load]))

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load() }} tintColor={palette.text} />}
    >
      <PageHeader title={t("messages")} subtitle={t("messagesSubtitle")} showBack={false} />
      {loading ? <ActivityIndicator size="large" color={palette.text} /> : null}
      {error ? <Text style={styles.error}>{t("messagesLoadError")}</Text> : null}
      {!loading && conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={46} color={palette.textSoft} />
          <Text style={styles.emptyTitle}>{t("noConversations")}</Text>
          <Text style={styles.emptyText}>{t("noConversationsHint")}</Text>
        </View>
      ) : null}
      <View style={styles.list}>
        {conversations.map((conversation) => {
          const name = conversation.other_user.display_name || t("unknownReader")
          return (
            <Pressable
              key={conversation.id}
              onPress={() => router.push({ pathname: "/chats/[conversationId]", params: { conversationId: conversation.id } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <UserAvatar userId={conversation.other_user.id} uri={conversation.other_user.avatar_url} />
              <View style={styles.copy}>
                <Text style={styles.name}>{name}</Text>
                <Text numberOfLines={1} style={styles.preview}>{conversation.last_message?.body ?? t("conversationStarted")}</Text>
                <Text style={styles.date}>{formatDate(conversation.last_message?.created_at ?? conversation.created_at, language)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={palette.textMuted} />
            </Pressable>
          )
        })}
      </View>
    </ScrollView>
  )
}

function formatDate(value: string, language: "en" | "tr") {
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value))
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { flexGrow: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 20, paddingTop: 8, paddingBottom: 36, gap: 20 },
  list: { gap: 10 },
  card: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 12, padding: 13, borderRadius: radii.md, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface },
  pressed: { opacity: 0.75 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  initial: { fontSize: 21, fontWeight: "700", color: palette.textSoft },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: typography.serif, color: palette.text, fontSize: 17, fontWeight: "700" },
  preview: { color: palette.textMuted, fontSize: 14 },
  date: { color: palette.textMuted, fontSize: 11 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 9, paddingVertical: 60 },
  emptyTitle: { fontFamily: typography.serif, color: palette.text, fontSize: 22, fontWeight: "700" },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
  error: { color: palette.danger },
})
