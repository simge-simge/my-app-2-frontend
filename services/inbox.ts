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

export type BookBorrowRequest = {
  id: string
  book_id: string
  requester_id: string
  owner_id: string
  status: "pending"
  created_at: string
  book: {
    id: string
    title: string
    author: string | null
    cover_url: string | null
    status: string
  }
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
  borrow_requests: BookBorrowRequest[]
  unread_count: number
}

export function getInbox() {
  return apiFetch("/inbox/", { cache: "no-store" }) as Promise<InboxResponse>
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

export function decideBorrowRequest(requestId: string, decision: "accepted" | "declined") {
  return apiFetch(`/inbox/borrow-requests/${requestId}`, {
    method: "PATCH",
    body: JSON.stringify({ decision }),
  })
}
