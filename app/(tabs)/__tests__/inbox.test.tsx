import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import InboxScreen from "../inbox"
import { decideBorrowRequest, getInbox } from "@/services/inbox"
import type { BookBorrowRequest, InboxResponse } from "@/services/inbox"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/inbox", () => ({
  decideBorrowRequest: jest.fn(),
  decideCommunityRequest: jest.fn(),
  getInbox: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}))

const request = (overrides: Partial<BookBorrowRequest> = {}): BookBorrowRequest => ({
  id: "request-1",
  book_id: "book-1",
  requester_id: "reader-1",
  owner_id: "current-user",
  status: "pending",
  created_at: "2026-01-02T12:00:00Z",
  book: { id: "book-1", title: "The Dispossessed", author: "Ursula K. Le Guin", cover_url: null, status: "available" },
  requester: { id: "reader-1", display_name: "Ada Reader", avatar_url: null, community_id: "community-1" },
  ...overrides,
})

const inbox = (borrowRequests: BookBorrowRequest[]): InboxResponse => ({
  notifications: [],
  join_requests: [],
  borrow_requests: borrowRequests,
  unread_count: borrowRequests.filter((item) => item.status === "pending").length,
})

describe("borrow request inbox history", () => {
  it("keeps an accepted request and links it to its match", async () => {
    jest.mocked(getInbox)
      .mockResolvedValueOnce(inbox([request()]))
      .mockResolvedValueOnce(inbox([request({ status: "accepted", match_id: "match-1", reviewed_at: "2026-01-03T12:00:00Z" })]))
    jest.mocked(decideBorrowRequest).mockResolvedValue({} as never)

    render(<InboxScreen />)
    fireEvent.press(await screen.findByText("Accept"))

    expect(await screen.findByText("You accepted Ada Reader's borrow request for The Dispossessed.")).toBeVisible()
    fireEvent.press(screen.getByText("Go to My Matches"))
    expect(router.push).toHaveBeenCalledWith({ pathname: "/matches/[matchId]", params: { matchId: "match-1" } })
  })

  it("keeps a declined request without action buttons", async () => {
    jest.mocked(getInbox).mockResolvedValue(inbox([request({ status: "declined", reviewed_at: "2026-01-03T12:00:00Z" })]))

    render(<InboxScreen />)

    expect(await screen.findByText("You declined Ada Reader's borrow request for The Dispossessed.")).toBeVisible()
    expect(screen.queryByText("Accept")).toBeNull()
    expect(screen.queryByText("Decline")).toBeNull()
    await waitFor(() => expect(getInbox).toHaveBeenCalled())
  })
})
