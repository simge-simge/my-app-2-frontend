import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Search from "../search"
import { searchBooks } from "@/services/books"
import { getProfile, searchProfiles, type Profile } from "@/services/profile"
import { listCommunityMembers, removeCommunityMember } from "@/services/communities"
import { book } from "@/test/factories"

jest.mock("@/services/books", () => ({ searchBooks: jest.fn(), requestToBorrowBook: jest.fn() }))
jest.mock("@/services/profile", () => ({ getProfile: jest.fn(), searchProfiles: jest.fn() }))
jest.mock("@/services/communities", () => ({ listCommunityMembers: jest.fn(), removeCommunityMember: jest.fn() }))
jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: "current-user" } } } }) } },
}))

describe("search", () => {
  const regularProfile: Profile = {
    id: "current-user",
    display_name: "Current Reader",
    location_id: null,
    location: null,
    avatar_url: null,
    contacts: {},
    community_id: "community",
    community_name: "Readers",
    community_location: null,
    community_public: true,
    admin: false,
    is_app_admin: false,
    pending_community_name: null,
    pending_community_request_id: null,
    created_at: "2026-01-02T12:00:00Z",
  }

  beforeEach(() => {
    jest.useFakeTimers()
    jest.mocked(getProfile).mockResolvedValue(regularProfile)
  })
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

  it("lists and sorts books when the search field is empty", async () => {
    jest.mocked(searchBooks).mockResolvedValue([
      book({ id: "older-z", title: "Zeta", created_at: "2025-01-01T00:00:00Z" }),
      book({ id: "newer-a", title: "Alpha", created_at: "2026-01-01T00:00:00Z" }),
    ])
    render(<Search />)
    await act(async () => jest.advanceTimersByTime(300))

    expect(searchBooks).toHaveBeenCalledWith("", "community")
    expect(screen.getAllByText(/^(Alpha|Zeta)$/).map((node) => node.props.children)).toEqual(["Alpha", "Zeta"])

    fireEvent.press(screen.getByRole("button", { name: "Oldest" }))
    expect(screen.getAllByText(/^(Alpha|Zeta)$/).map((node) => node.props.children)).toEqual(["Zeta", "Alpha"])
  })

  it("defaults book results to compact list view and switches to cards", async () => {
    jest.mocked(searchBooks).mockResolvedValue([
      book({ id: "book-1", title: "First Book" }),
      book({ id: "book-2", title: "Second Book" }),
    ])
    render(<Search />)
    await act(async () => jest.advanceTimersByTime(300))

    expect(screen.getByRole("button", { name: "List view" }).props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByText("First Book")).toBeVisible()
    expect(screen.getByText("Second Book")).toBeVisible()

    fireEvent.press(screen.getByRole("button", { name: "Card view" }))
    expect(screen.getByRole("button", { name: "Card view" }).props.accessibilityState).toMatchObject({ selected: true })

    fireEvent.press(screen.getByRole("button", { name: "Search Users" }))
    expect(screen.queryByRole("button", { name: "List view" })).toBeNull()
  })

  it("shows unavailable books with their status and disables borrowing", async () => {
    jest.mocked(searchBooks).mockResolvedValue([book({ status: "matched" })])
    render(<Search />)
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "Le Guin")
    await act(async () => jest.advanceTimersByTime(300))

    expect(await screen.findByText("Matched")).toBeVisible()
    expect(screen.getByText("Book unavailable")).toBeVisible()
    expect(screen.getAllByRole("button", { name: "Ask to borrow The Left Hand of Darkness" })[0]).toBeDisabled()
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

  it("shows users without communities in all-user results", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([{ id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: null, community_name: null, admin: false }])
    render(<Search />)
    fireEvent.press(screen.getByRole("button", { name: "Search Users" }))
    fireEvent.press(screen.getByRole("button", { name: "All" }))
    fireEvent.changeText(screen.getByPlaceholderText("Search users..."), "Ada")
    await act(async () => jest.advanceTimersByTime(300))

    expect(await screen.findByText("Ada Reader")).toBeVisible()
    expect(screen.getByText("Not in a community")).toBeVisible()
    expect(searchProfiles).toHaveBeenCalledWith("Ada", "all")
  })

  it("lists and sorts all users when the search field is empty", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([
      { id: "member-z", display_name: "Zeynep", avatar_url: null, community_id: null, community_name: null, admin: false },
      { id: "member-a", display_name: "Ada", avatar_url: null, community_id: "community", community_name: "Readers", admin: false },
    ])
    render(<Search />)
    fireEvent.press(screen.getByRole("button", { name: "Search Users" }))
    fireEvent.press(screen.getByRole("button", { name: "All" }))
    await act(async () => jest.advanceTimersByTime(300))

    expect(searchProfiles).toHaveBeenCalledWith("", "all")
    expect(screen.getAllByText(/^(Ada|Zeynep)$/).map((node) => node.props.children)).toEqual(["Ada", "Zeynep"])

    fireEvent.press(screen.getByRole("button", { name: "Name Z–A" }))
    expect(screen.getAllByText(/^(Ada|Zeynep)$/).map((node) => node.props.children)).toEqual(["Zeynep", "Ada"])
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

  it("lists community members for admins and removes a member", async () => {
    jest.mocked(getProfile).mockResolvedValue({ ...regularProfile, admin: true })
    jest.mocked(listCommunityMembers).mockResolvedValue([
      { id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: "community", community_name: "Readers", admin: false },
    ])
    jest.mocked(removeCommunityMember).mockResolvedValue({ message: "Community member removed", member_id: "member-1" })
    render(<Search />)
    fireEvent.press(screen.getByRole("button", { name: "Search Users" }))
    await act(async () => { await Promise.resolve(); await jest.advanceTimersByTimeAsync(300) })

    expect(await screen.findByRole("button", { name: "Remove Ada Reader from community" })).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Remove Ada Reader from community" }))
    expect(screen.getByText("Remove Ada Reader from your community?")).toBeVisible()
    await act(async () => { fireEvent.press(screen.getByRole("button", { name: "Remove" })) })

    expect(removeCommunityMember).toHaveBeenCalledWith("community", "member-1")
    expect(screen.queryByRole("button", { name: "View Ada Reader's library" })).toBeNull()
  })
})
