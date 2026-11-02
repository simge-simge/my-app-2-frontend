import { useCallback, useEffect, useRef, useState } from "react"
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import PageBackButton from "@/components/PageBackButton"
import { layout, palette, radii, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { getConversation, sendMessage, type ChatMessage, type ConversationDetail } from "@/services/messages"

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi

type LocalMessage = ChatMessage & { clientId?: string; status?: "sending" | "failed" }
type LocalConversationDetail = Omit<ConversationDetail, "messages"> & { messages: LocalMessage[] }

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>()
  const { t } = useTranslation()
  const [detail, setDetail] = useState<LocalConversationDetail | null>(null)
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<ScrollView>(null)
  const nextMessageId = useRef(0)
  const inFlight = useRef(new Set<string>())

  const load = useCallback(async () => {
    if (!conversationId) return
    try {
      setError(null)
      const loaded = await getConversation(conversationId)
      setDetail((current) => ({
        ...loaded,
        messages: [...loaded.messages, ...(current?.messages.filter((message) => message.conversation_id === conversationId && message.status) ?? [])],
      }))
    } catch (err) {
      console.error("Failed to load conversation", err)
      setError(t("conversationLoadError"))
    } finally {
      setLoading(false)
    }
  }, [conversationId, t])

  useEffect(() => { void load() }, [load])

  const deliver = async (optimistic: LocalMessage) => {
    if (!detail?.current_messaging_enabled || !detail.conversation.other_user.messaging_enabled) return
    if (inFlight.current.has(optimistic.id)) return
    inFlight.current.add(optimistic.id)
    setDetail((current) => current ? { ...current, messages: current.messages.map((message) => message.id === optimistic.id ? { ...message, status: "sending" } : message) } : current)
    try {
      const sent = await sendMessage(optimistic.conversation_id, optimistic.body)
      setDetail((current) => current ? {
        ...current,
        messages: current.messages.filter((message) => message.id !== sent.id).map((message) => message.id === optimistic.id ? { ...sent, clientId: optimistic.id } : message),
      } : current)
    } catch (err) {
      console.error("Failed to send message", err)
      setDetail((current) => current ? { ...current, messages: current.messages.map((message) => message.id === optimistic.id ? { ...message, status: "failed" } : message) } : current)
    } finally {
      inFlight.current.delete(optimistic.id)
    }
  }

  const submit = () => {
    const body = draft.trim()
    if (!conversationId || !body || !detail?.current_messaging_enabled || !detail.conversation.other_user.messaging_enabled) return
    const optimistic: LocalMessage = {
      id: `local-${Date.now()}-${nextMessageId.current++}`,
      conversation_id: conversationId,
      sender_id: detail.current_user_id,
      body,
      created_at: new Date().toISOString(),
      status: "sending",
    }
    setDraft("")
    setDetail((current) => current ? { ...current, messages: [...current.messages, optimistic] } : current)
    void deliver(optimistic)
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={palette.text} /></View>
  if (!detail) return <View style={styles.center}><Text style={styles.error}>{error ?? t("conversationLoadError")}</Text></View>

  const name = detail.conversation.other_user.display_name || t("unknownReader")
  const enabled = detail.current_messaging_enabled && detail.conversation.other_user.messaging_enabled
  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.header}>
        <PageBackButton fallback="/messages" />
        <View style={styles.headerCopy}><Text style={styles.title}>{name}</Text><Text style={styles.subtitle}>{t("matchedConversation")}</Text></View>
        <Pressable onPress={() => router.push({ pathname: "/matches/[matchId]", params: { matchId: detail.conversation.match_id } })} style={styles.matchLink}>
          <Ionicons name="heart-outline" size={20} color={palette.accentDark} />
        </Pressable>
      </View>
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messageContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {detail.messages.length === 0 ? <Text style={styles.empty}>{t("sendFirstMessage")}</Text> : null}
        {detail.messages.map((message) => <MessageBubble key={message.clientId ?? message.id} message={message} mine={message.sender_id === detail.current_user_id} onRetry={() => void deliver(message)} />)}
      </ScrollView>
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      {!detail.current_messaging_enabled ? (
        <Pressable onPress={() => router.push("/settings")}><Text style={styles.disabledHint}>{t("activateMessagingHint")}</Text></Pressable>
      ) : !detail.conversation.other_user.messaging_enabled ? <Text style={styles.disabledHint}>{t("otherUserMessagingOff")}</Text> : null}
      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={t("typeMessage")}
          placeholderTextColor={palette.textMuted}
          style={styles.input}
          multiline
          maxLength={2000}
          editable={enabled}
        />
        <Pressable accessibilityLabel={t("send")} disabled={!enabled || !draft.trim()} onPress={submit} style={[styles.send, (!enabled || !draft.trim()) && styles.sendDisabled]}>
          <Ionicons name="send" size={19} color={palette.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

function MessageBubble({ message, mine, onRetry }: { message: LocalMessage; mine: boolean; onRetry: () => void }) {
  const { t } = useTranslation()
  const parts = message.body.split(URL_PATTERN)
  return (
    <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
      <Text style={[styles.body, mine && styles.mineText]}>
        {parts.map((part, index) => /^(https?:\/\/|www\.)/i.test(part) ? (
          <Text key={`${part}-${index}`} accessibilityRole="link" style={[styles.link, mine && styles.mineLink]} onPress={() => void Linking.openURL(part.startsWith("www.") ? `https://${part}` : part)}>{part}</Text>
        ) : <Text key={`${part}-${index}`}>{part}</Text>)}
      </Text>
      {message.status === "sending" ? <Text style={styles.deliveryStatus}>{t("messageSending")}</Text> : null}
      {message.status === "failed" ? (
        <Pressable accessibilityRole="button" onPress={onRetry}><Text style={styles.deliveryStatus}>{t("messageSendError")} {t("retryMessage")}</Text></Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", backgroundColor: palette.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: palette.background },
  header: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: palette.border },
  headerCopy: { flex: 1 },
  title: { fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 12, color: palette.textMuted },
  matchLink: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  messages: { flex: 1 },
  messageContent: { flexGrow: 1, justifyContent: "flex-end", padding: 16, gap: 8 },
  bubble: { maxWidth: "82%", borderRadius: radii.md, paddingHorizontal: 13, paddingVertical: 10 },
  mine: { alignSelf: "flex-end", backgroundColor: palette.accent },
  theirs: { alignSelf: "flex-start", backgroundColor: palette.surfaceMuted },
  body: { color: palette.text, fontSize: 15, lineHeight: 21 },
  mineText: { color: palette.white },
  deliveryStatus: { color: palette.white, fontSize: 11, marginTop: 4 },
  link: { color: palette.accentDark, textDecorationLine: "underline" },
  mineLink: { color: palette.white },
  empty: { textAlign: "center", color: palette.textMuted, marginBottom: 18 },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 9, padding: 12, borderTopWidth: 1, borderTopColor: palette.border, backgroundColor: palette.surface },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderWidth: 1, borderColor: palette.border, borderRadius: 22, paddingHorizontal: 15, paddingVertical: 11, color: palette.text, backgroundColor: palette.background },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: palette.accent },
  sendDisabled: { opacity: 0.45 },
  error: { color: palette.danger },
  inlineError: { color: palette.danger, paddingHorizontal: 14, paddingVertical: 5, textAlign: "center" },
  disabledHint: { color: palette.textMuted, paddingHorizontal: 14, paddingVertical: 7, textAlign: "center" },
})
