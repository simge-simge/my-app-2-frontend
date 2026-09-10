import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import MatchesScreen from "../matches"
import { deleteMatch, getMatches, revealMatchContact } from "@/services/matches"
import { match } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/matches", () => ({ deleteMatch: jest.fn(), getMatches: jest.fn(), revealMatchContact: jest.fn() }))

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

  it("confirms deletion and removes the match after the request succeeds", async () => {
    let finishDelete!: () => void
    jest.mocked(getMatches).mockResolvedValue([match()])
    jest.mocked(deleteMatch).mockReturnValue(new Promise<{ message: string }>((resolve) => {
      finishDelete = () => resolve({ message: "Match deleted" })
    }))
    render(<MatchesScreen />)

    fireEvent.press(await screen.findByRole("button", { name: "Delete match" }))
    expect(deleteMatch).not.toHaveBeenCalled()
    expect(screen.getByText("Remove this match from your list?")).toBeVisible()
    fireEvent.press(screen.getByTestId("confirmation-modal-confirm"))

    expect(deleteMatch).toHaveBeenCalledWith(match().match_id)
    expect(screen.getByText("Ada Reader")).toBeVisible()

    await act(async () => { finishDelete() })
    await waitFor(() => expect(screen.queryByText("Ada Reader")).toBeNull())
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
