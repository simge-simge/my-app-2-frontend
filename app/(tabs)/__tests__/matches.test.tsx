import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import MatchesScreen from "../matches"
import { getMatches, revealMatchContact } from "@/services/matches"
import { match } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/matches", () => ({ getMatches: jest.fn(), revealMatchContact: jest.fn() }))

describe("matches", () => {
  it("renders status and opens match details", async () => {
    jest.mocked(getMatches).mockResolvedValue([match()])
    render(<MatchesScreen />)
    await waitFor(() => expect(getMatches).toHaveBeenCalled())
    const pending = screen.getByText("Pending", { includeHiddenElements: true })
    expect(pending).toBeTruthy()
    fireEvent.press(pending)
    expect(router.push).toHaveBeenCalledWith({ pathname: "/matches/[matchId]", params: { matchId: match().match_id } })
  })

  it("reveals contact information immediately while saving in the background", async () => {
    let finish!: () => void
    jest.mocked(getMatches).mockResolvedValue([match()])
    jest.mocked(revealMatchContact).mockReturnValue(new Promise<void>((resolve) => { finish = resolve }) as never)
    render(<MatchesScreen />)
    const button = await screen.findByText("Reveal Contact & Mark My Book Lent")
    fireEvent.press(button)
    expect(await screen.findByText("Your contact info has been revealed for this match.")).toBeVisible()
    expect(screen.queryByText("Revealing...")).toBeNull()
    await waitFor(() => expect(revealMatchContact).toHaveBeenCalledWith(match().match_id))
    await act(async () => { finish() })
    await waitFor(() => expect(getMatches).toHaveBeenCalledTimes(2))
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
