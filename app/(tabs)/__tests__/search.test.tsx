import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Search from "../search"
import { searchBooks } from "@/services/books"
import { searchProfiles } from "@/services/profile"
import { book } from "@/test/factories"

jest.mock("@/services/books", () => ({ searchBooks: jest.fn(), requestToBorrowBook: jest.fn() }))
jest.mock("@/services/profile", () => ({ searchProfiles: jest.fn() }))
jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: "current-user" } } } }) } },
}))

describe("search", () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it("debounces book search and opens a result", async () => {
    jest.mocked(searchBooks).mockResolvedValue([book()])
    render(<Search />)
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "Le Guin")
    expect(searchBooks).not.toHaveBeenCalled()
    await act(async () => jest.advanceTimersByTime(300))
    expect(await screen.findByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" })).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" }))
    expect(router.push).toHaveBeenCalledWith({ pathname: "/books/[bookId]", params: { bookId: book().id } })
    expect(searchBooks).toHaveBeenCalledWith("Le Guin", "community")
  })

  it("switches to people search and opens the member library", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([{ id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: "community", community_name: "Readers", admin: false }])
    render(<Search />)
    fireEvent.press(screen.getByRole("button", { name: "Search Users" }))
    fireEvent.changeText(screen.getByPlaceholderText("Search users..."), "Ada")
    await act(async () => jest.advanceTimersByTime(300))
    const result = await screen.findByRole("button", { name: "View Ada Reader's library" })
    fireEvent.press(result)
    expect(router.push).toHaveBeenCalledWith({ pathname: "/members/[memberId]", params: { memberId: "member-1" } })
  })

  it("shows an empty state and request failure", async () => {
    jest.mocked(searchBooks).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("offline"))
    render(<Search />)
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "missing")
    await act(async () => jest.advanceTimersByTime(300))
    expect(await screen.findByText("No matching books")).toBeVisible()
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "failure")
    await act(async () => jest.advanceTimersByTime(300))
    await waitFor(() => expect(screen.getByText("Could not search books right now.")).toBeVisible())
  })
})
