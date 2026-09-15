import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"

import MatchDetailScreen from "../[matchId]"
import { deleteMatch, getMatch } from "@/services/matches"
import { match } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/matches", () => ({
  deleteMatch: jest.fn(),
  getMatch: jest.fn(),
  revealMatchContact: jest.fn(),
}))

describe("match details", () => {
  beforeEach(() => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ matchId: match().match_id })
    jest.mocked(getMatch).mockResolvedValue(match())
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
