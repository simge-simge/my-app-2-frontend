import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Image } from "react-native"
import { router } from "expo-router"

import MatchesScreen from "../matches"
import { getMatches } from "@/services/matches"
import { match } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/matches", () => ({ getMatches: jest.fn() }))

describe("matches", () => {
  it("shows a text-only compact swap card and opens its detail page", async () => {
    jest.mocked(getMatches).mockResolvedValue([match()])
    const view = render(<MatchesScreen />)
    await waitFor(() => expect(getMatches).toHaveBeenCalled())
    const card = view.UNSAFE_getByProps({ testID: `match-card-${match().match_id}` })
    expect(card.findAllByType(Image)).toHaveLength(0)
    fireEvent.press(card)
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/matches/[matchId]",
      params: { matchId: match().match_id },
    })
  })

  it("groups multiple exchange options and opens the selected match", async () => {
    jest.mocked(getMatches).mockResolvedValue([
      match(),
      match({ match_id: "match-2", my_book: { id: "book-a-2", title: "My Other Book", cover_url: null } }),
    ])
    render(<MatchesScreen />)

    expect(await screen.findByText("2 exchange option(s) with Ada Reader")).toBeVisible()
    expect(screen.queryByText("My Book")).toBeNull()

    fireEvent.press(screen.getByTestId("match-group-book-b"))
    expect(screen.getByText("My Book")).toBeVisible()
    expect(screen.getByText("My Other Book")).toBeVisible()

    fireEvent.press(screen.getByTestId("match-choice-match-2"))
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/matches/[matchId]",
      params: { matchId: "match-2" },
    })
  })

  it("keeps an approved exchange and removes conflicting pending options", async () => {
    jest.mocked(getMatches).mockResolvedValue([
      match({
        approved_at: "2026-01-03T12:00:00Z",
        my_book: { id: "book-a", title: "My Book", cover_url: null, status: "available" },
      }),
      match({
        match_id: "match-2",
        my_book: { id: "book-a-2", title: "My Other Book", cover_url: null, status: "available" },
      }),
    ])
    render(<MatchesScreen />)

    expect(await screen.findByText("Approved")).toBeVisible()
    expect(screen.getByText("My Book")).toBeVisible()
    expect(screen.queryByText("My Other Book")).toBeNull()
  })

  it("renders compact borrow matches and opens their details", async () => {
    const borrowMatch = match({ my_book: null })
    jest.mocked(getMatches).mockResolvedValue([borrowMatch])
    render(<MatchesScreen />)

    expect(await screen.findByText("You are borrowing")).toBeVisible()
    fireEvent.press(screen.getByTestId(`match-card-${borrowMatch.match_id}`))
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/matches/[matchId]",
      params: { matchId: borrowMatch.match_id },
    })
  })

  it("renders empty and failed states", async () => {
    jest.mocked(getMatches).mockResolvedValueOnce([])
    const view = render(<MatchesScreen />)
    expect(await screen.findByText("No matches yet")).toBeVisible()
    view.unmount()

    jest.mocked(getMatches).mockRejectedValueOnce(new Error("offline"))
    render(<MatchesScreen />)
    expect(await screen.findByText("Could not load your matches.")).toBeVisible()
  })
})
