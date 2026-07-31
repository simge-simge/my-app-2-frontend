import { apiFetch } from "./api"

export type InboxNotification = {
  id: string
  type: string
  title: string
  message: string
  metadata: Record<string, string>
  read_at: string | null
  created_at: string
}

export type CommunityJoinRequest = {
  id: string
  user_id: string
  community_id: string
  status: "pending"
  created_at: string
  requester: {
    id: string
    display_name: string | null
    avatar_url: string | null
    community_id: string | null
  }
}

export type InboxResponse = {
  notifications: InboxNotification[]
  join_requests: CommunityJoinRequest[]
  unread_count: number
}

export function getInbox() {
  return apiFetch("/inbox/") as Promise<InboxResponse>
}

export function markNotificationRead(notificationId: string) {
  return apiFetch(`/inbox/notifications/${notificationId}/read`, { method: "PATCH" })
}

export function markAllNotificationsRead() {
  return apiFetch("/inbox/notifications/read-all", { method: "PATCH" }) as Promise<{ updated: number }>
}

export function decideCommunityRequest(requestId: string, decision: "approved" | "declined") {
  return apiFetch(`/inbox/community-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
  })
}
