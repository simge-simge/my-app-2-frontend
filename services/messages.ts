import { apiFetch } from "./api"

export type ChatUser = {
  id: string
  display_name: string | null
  avatar_url: string | null
  messaging_enabled: boolean
}

export type ChatMessage = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Conversation = {
  id: string
  match_id: string
  user_a: string
  user_b: string
  created_at: string
  updated_at: string
  other_user: ChatUser
  last_message: ChatMessage | null
}

export type ConversationDetail = {
  conversation: Conversation
  messages: ChatMessage[]
  current_user_id: string
  current_messaging_enabled: boolean
}

export function getConversations() {
  return apiFetch("/messages/", { cache: "no-store" }) as Promise<Conversation[]>
}

export function startConversation(matchId: string) {
  return apiFetch(`/messages/matches/${matchId}`, {
    method: "POST",
    invalidate: ["messages", "matches"],
  }) as Promise<Conversation>
}

export function getConversation(conversationId: string) {
  return apiFetch(`/messages/${conversationId}`, { cache: "no-store" }) as Promise<ConversationDetail>
}

export function sendMessage(conversationId: string, body: string) {
  return apiFetch(`/messages/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ body }),
    invalidate: ["messages", "inbox"],
  }) as Promise<ChatMessage>
}
