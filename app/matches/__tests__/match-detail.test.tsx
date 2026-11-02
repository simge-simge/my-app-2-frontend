import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"

import MatchDetailScreen from "../[matchId]"
import { deleteMatch, endMatchExchange, getMatch } from "@/services/matches"
import { match } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/matches", () => ({
  approveMatch: jest.fn(),
  deleteMatch: jest.fn(),
  endMatchExchange: jest.fn(),
  getMatch: jest.fn(),
  markMatchBookUnavailable: jest.fn(),
  revealMatchContact: jest.fn(),
}))

describe("match details", () => {
  beforeEach(() => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ matchId: match().match_id })
    jest.mocked(getMatch).mockResolvedValue(match())
  })

  it("releases my reserved book and refreshes the match", async () => {
    const reserved = match({
      approved_at: "2026-01-02T12:00:00Z",
      my_book: { id: "book-a", title: "My Book", cover_url: null, status: "lent", reserved_match_id: match().match_id },
    })
    jest.mocked(getMatch).mockResolvedValueOnce(reserved).mockResolvedValue(match())
    jest.mocked(endMatchExchange).mockResolvedValue({ book_id: "book-a", status: "available" })
    render(<MatchDetailScreen />)
    await act(async () => {})
    fireEvent.press(screen.getByText("End exchange"))
    await waitFor(() => expect(endMatchExchange).toHaveBeenCalledWith(match().match_id))
    await waitFor(() => expect(screen.queryByText("End exchange")).toBeNull())
  })

  it("hides end exchange when only their book is reserved", async () => {
    jest.mocked(getMatch).mockResolvedValue(match({
      approved_at: "2026-01-02T12:00:00Z",
      their_book: { id: "book-b", title: "Their Book", cover_url: null, status: "lent" },
    }))
    render(<MatchDetailScreen />)
    await screen.findByText("Exchange underway.")
    expect(screen.queryByText("End exchange")).toBeNull()
  })

  it("deletes only after confirmation and navigates immediately", async () => {
    let finishDelete!: () => void
    jest.mocked(deleteMatch).mockReturnValue(new Promise<{ message: string }>((resolve) => {
      finishDelete = () => resolve({ message: "Match deleted" })
    }))

    render(<MatchDetailScreen />)

    const deleteButton = await screen.findByLabelText("Delete match")
    fireEvent.press(deleteButton)

    expect(deleteMatch).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole("button", { name: "Delete" }))

    expect(router.replace).toHaveBeenCalledWith("/matches")
    await waitFor(() => expect(deleteMatch).toHaveBeenCalledWith(match().match_id))

    await act(async () => { finishDelete() })
  })

  it("cancels deletion from the confirmation dialog", async () => {
    render(<MatchDetailScreen />)

    fireEvent.press(await screen.findByLabelText("Delete match"))
    fireEvent.press(screen.getByRole("button", { name: "Cancel" }))

    expect(deleteMatch).not.toHaveBeenCalled()
  })
})
