import type { InboxNotification } from "@/services/inbox"
import type { TranslationKey } from "@/localization/translations"

type Translator = (key: TranslationKey, values?: Record<string, string | number>) => string

const titleKeys: Record<string, TranslationKey> = {
  book_borrow_requested: "notificationBorrowRequest",
  book_swap_match: "notificationNewSwap",
  book_swap_contact_revealed: "notificationSwapUpdate",
  community_request_approved: "notificationCommunityApproved",
  community_member_added: "notificationMemberAdded",
  community_member_removed: "notificationMemberRemoved",
  community_request_declined: "notificationCommunityDeclined",
  book_borrow_accepted: "notificationBorrowAccepted",
  book_borrow_declined: "notificationBorrowDeclined",
  community_admin_assigned: "notificationAdminAssigned",
  community_added: "notificationCommunityUpdated",
  community_removed: "notificationCommunityRemoved",
}

export function localizeInboxNotification(notification: InboxNotification, language: "en" | "tr", t: Translator) {
  if (language === "en") return { title: notification.title, message: notification.message }

  const titleKey = titleKeys[notification.type]
  const title = titleKey ? t(titleKey) : notification.title
  const quotedBook = notification.message.match(/"([^"]+)"/)?.[1]

  switch (notification.type) {
    case "book_borrow_requested": {
      const name = notification.message.match(/^(.+?) would like to borrow/)?.[1]
      return { title, message: name && quotedBook ? t("notificationWantsBorrow", { name, book: quotedBook }) : notification.message }
    }
    case "book_swap_match": {
      const book = notification.message.match(/^Your (.+) has a new swap match\.$/)?.[1]
      return { title, message: book ? t("notificationNewSwapMessage", { book }) : notification.message }
    }
    case "book_swap_contact_revealed":
      return { title, message: t("notificationContactRevealed") }
    case "community_request_approved":
    case "community_added": {
      const community = notification.message.match(/member of (.+)\.$/)?.[1]
      return { title, message: community ? t("notificationNowMember", { community }) : notification.message }
    }
    case "community_member_added": {
      const parts = notification.message.match(/^(.+) joined (.+)\.$/)
      return { title, message: parts ? t("notificationJoinedCommunity", { name: parts[1], community: parts[2] }) : notification.message }
    }
    case "community_member_removed": {
      const name = notification.message.match(/^(.+) left your community\.$/)?.[1]
      return { title, message: name ? t("notificationLeftCommunity", { name }) : notification.message }
    }
    case "community_request_declined": {
      const community = notification.message.match(/^Your request to join (.+) was declined\.$/)?.[1]
      return { title, message: community ? t("notificationJoinDeclined", { community }) : notification.message }
    }
    case "book_borrow_accepted":
      return { title, message: quotedBook ? t("notificationBorrowAcceptedMessage", { book: quotedBook }) : notification.message }
    case "book_borrow_declined":
      return {
        title,
        message: quotedBook
          ? t(notification.message.includes("no longer available") ? "notificationBorrowDeclinedUnavailable" : "notificationBorrowDeclinedMessage", { book: quotedBook })
          : notification.message,
      }
    case "community_admin_assigned": {
      const community = notification.message.match(/admin of (.+)\.$/)?.[1]
      return { title, message: community ? t("notificationNowAdmin", { community }) : notification.message }
    }
    case "community_removed":
      return { title, message: t("notificationLeftOwnCommunity") }
    default:
      return { title, message: notification.message }
  }
}
