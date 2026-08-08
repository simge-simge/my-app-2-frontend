import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
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
    expect(await screen.findByText("Pending")).toBeVisible()
    fireEvent.press(screen.getByText("Pending"))
    expect(router.push).toHaveBeenCalledWith({ pathname: "/matches/[matchId]", params: { matchId: match().match_id } })
  })

  it("reveals contact information with a disabled processing state", async () => {
    let finish!: () => void
    jest.mocked(getMatches).mockResolvedValue([match()])
    jest.mocked(revealMatchContact).mockReturnValue(new Promise<void>((resolve) => { finish = resolve }) as never)
    render(<MatchesScreen />)
    const button = await screen.findByText("Reveal Contact & Mark My Book Lent")
    fireEvent.press(button)
    expect(await screen.findByText("Revealing...")).toBeVisible()
    finish()
    await waitFor(() => expect(revealMatchContact).toHaveBeenCalledWith(match().match_id))
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
