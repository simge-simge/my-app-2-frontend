import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"
import { FlatList } from "react-native"

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
  const selectType = (current: "All" | "Books" | "Users", next: "All" | "Books" | "Users") => {
    fireEvent.press(screen.getByRole("button", { name: `Search type: ${current}` }))
    fireEvent.press(screen.getByRole("button", { name: next }))
  }

  const selectScope = (current: "All" | "Community", next: "All" | "Community") => {
    fireEvent.press(screen.getByRole("button", { name: `Search scope: ${current}` }))
    fireEvent.press(screen.getByRole("button", { name: next }))
  }

  const openOptions = () => fireEvent.press(screen.getByRole("button", { name: "Options" }))

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
    jest.mocked(searchBooks).mockResolvedValue([])
    jest.mocked(searchProfiles).mockResolvedValue([])
  })
  afterEach(() => jest.useRealTimers())

  it("defaults both dropdown filters to all and combines result types", async () => {
    jest.mocked(searchBooks).mockResolvedValue([book({ title: "A Book" })])
    jest.mocked(searchProfiles).mockResolvedValue([
      { id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: "community", community_name: "Readers", admin: false },
    ])

    render(<Search />)
    expect(screen.getByRole("button", { name: "Search type: All" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Search scope: All" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Options" }).props.accessibilityState).toMatchObject({ expanded: false })
    expect(screen.queryByRole("button", { name: "Card view" })).toBeNull()
    await act(async () => jest.advanceTimersByTime(300))

    expect(searchBooks).toHaveBeenCalledWith("", "all", expect.anything())
    expect(searchProfiles).toHaveBeenCalledWith("", "all", expect.anything())
    expect(await screen.findByText("A Book")).toBeVisible()
    expect(screen.getByText("Ada Reader")).toBeVisible()
  })

  it("closes an open filter when the user starts scrolling results", () => {
    render(<Search />)
    fireEvent.press(screen.getByRole("button", { name: "Search type: All" }))
    expect(screen.getByRole("button", { name: "Search type: All" }).props.accessibilityState).toMatchObject({ expanded: true })
    expect(screen.getByRole("button", { name: "Books" })).toBeVisible()

    fireEvent(screen.UNSAFE_getByType(FlatList), "scrollBeginDrag")

    expect(screen.getByRole("button", { name: "Search type: All" }).props.accessibilityState).toMatchObject({ expanded: false })
    expect(screen.queryByRole("button", { name: "Books" })).toBeNull()
  })

  it("debounces book search and opens a result", async () => {
    jest.mocked(searchBooks).mockResolvedValue([book()])
    render(<Search />)
    selectType("All", "Books")
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "Le Guin")
    expect(searchBooks).not.toHaveBeenCalled()
    await act(async () => jest.advanceTimersByTime(300))
    expect(await screen.findByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" })).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" }))
    expect(router.push).toHaveBeenCalledWith({ pathname: "/books/[bookId]", params: { bookId: book().id } })
    expect(searchBooks).toHaveBeenCalledWith("Le Guin", "all", expect.anything())
  })

  it("lists and sorts books when the search field is empty", async () => {
    jest.mocked(searchBooks).mockResolvedValue([
      book({ id: "older-z", title: "Zeta", created_at: "2025-01-01T00:00:00Z" }),
      book({ id: "newer-a", title: "Alpha", created_at: "2026-01-01T00:00:00Z" }),
    ])
    render(<Search />)
    selectType("All", "Books")
    await act(async () => jest.advanceTimersByTime(300))

    expect(searchBooks).toHaveBeenCalledWith("", "all", expect.anything())
    expect(screen.getAllByText(/^(Alpha|Zeta)$/).map((node) => node.props.children)).toEqual(["Alpha", "Zeta"])

    openOptions()
    fireEvent.press(screen.getByRole("button", { name: "Oldest" }))
    expect(screen.getAllByText(/^(Alpha|Zeta)$/).map((node) => node.props.children)).toEqual(["Zeta", "Alpha"])
  })

  it("defaults book results to compact list view and switches to cards", async () => {
    jest.mocked(searchBooks).mockResolvedValue([
      book({ id: "book-1", title: "First Book" }),
      book({ id: "book-2", title: "Second Book" }),
    ])
    render(<Search />)
    selectType("All", "Books")
    await act(async () => jest.advanceTimersByTime(300))

    openOptions()
    expect(screen.getByRole("button", { name: "List view" }).props.accessibilityState).toMatchObject({ selected: true })
    expect(screen.getByText("First Book")).toBeVisible()
    expect(screen.getByText("Second Book")).toBeVisible()

    fireEvent.press(screen.getByRole("button", { name: "Card view" }))
    expect(screen.getByRole("button", { name: "Card view" }).props.accessibilityState).toMatchObject({ selected: true })

    selectType("Books", "Users")
    expect(screen.queryByRole("button", { name: "List view" })).toBeNull()
  })

  it("paginates search results using the selected page size", async () => {
    jest.mocked(searchBooks).mockResolvedValue(Array.from({ length: 11 }, (_, index) => book({
      id: `book-${index + 1}`,
      title: `Book ${index + 1}`,
      created_at: `2026-01-${String(index + 1).padStart(2, "0")}T00:00:00Z`,
    })))
    render(<Search />)
    selectType("All", "Books")
    await act(async () => jest.advanceTimersByTime(300))

    expect(screen.getByText("Page 1 of 2")).toBeVisible()
    expect(screen.queryByText("Book 1")).toBeNull()
    fireEvent.press(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText("Book 1")).toBeVisible()
  })

  it("keeps current results visible while refining the search", async () => {
    let finishSearch!: (books: ReturnType<typeof book>[]) => void
    jest.mocked(searchBooks)
      .mockResolvedValueOnce([book({ id: "old-result", title: "Current Result" })])
      .mockImplementationOnce(() => new Promise((resolve) => { finishSearch = resolve }))

    render(<Search />)
    selectType("All", "Books")
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "current")
    await act(async () => jest.advanceTimersByTime(300))
    expect(await screen.findByText("Current Result")).toBeVisible()

    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "refined")
    expect(screen.getByText("Current Result")).toBeVisible()
    await act(async () => jest.advanceTimersByTime(300))
    await waitFor(() => expect(finishSearch).toBeDefined())
    expect(screen.getByText("Current Result")).toBeVisible()

    await act(async () => { finishSearch([book({ id: "new-result", title: "Refined Result" })]) })
    expect(await screen.findByText("Refined Result")).toBeVisible()
  })

  it("aborts a superseded search request", async () => {
    jest.mocked(searchBooks).mockImplementation(() => new Promise(() => {}))

    render(<Search />)
    selectType("All", "Books")
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "first")
    await act(async () => jest.advanceTimersByTime(300))
    const firstSignal = jest.mocked(searchBooks).mock.calls[0][2]
    expect(firstSignal?.aborted).toBe(false)

    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "second")
    expect(firstSignal?.aborted).toBe(true)
  })

  it("shows unavailable books with their status and disables borrowing", async () => {
    jest.mocked(searchBooks).mockResolvedValue([book({ status: "matched" })])
    render(<Search />)
    selectType("All", "Books")
    fireEvent.changeText(screen.getByPlaceholderText("Search books..."), "Le Guin")
    await act(async () => jest.advanceTimersByTime(300))

    expect(await screen.findByText("Matched")).toBeVisible()
    expect(screen.getByText("Book unavailable")).toBeVisible()
    expect(screen.getAllByRole("button", { name: "Ask to borrow The Left Hand of Darkness" })[0]).toBeDisabled()
  })

  it("switches to people search and opens the member library", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([{ id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: "community", community_name: "Readers", admin: false }])
    render(<Search />)
    selectType("All", "Users")
    fireEvent.changeText(screen.getByPlaceholderText("Search users..."), "Ada")
    await act(async () => jest.advanceTimersByTime(300))
    const result = await screen.findByRole("button", { name: "View Ada Reader's library" })
    fireEvent.press(result)
    expect(router.push).toHaveBeenCalledWith({ pathname: "/members/[memberId]", params: { memberId: "member-1" } })
  })

  it("shows users without communities in all-user results", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([{ id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: null, community_name: null, admin: false }])
    render(<Search />)
    selectType("All", "Users")
    fireEvent.changeText(screen.getByPlaceholderText("Search users..."), "Ada")
    await act(async () => jest.advanceTimersByTime(300))

    expect(await screen.findByText("Ada Reader")).toBeVisible()
    expect(screen.getByText("Not in a community")).toBeVisible()
    expect(searchProfiles).toHaveBeenCalledWith("Ada", "all", expect.anything())
  })

  it("lists and sorts all users when the search field is empty", async () => {
    jest.mocked(searchProfiles).mockResolvedValue([
      { id: "member-z", display_name: "Zeynep", avatar_url: null, community_id: null, community_name: null, admin: false },
      { id: "member-a", display_name: "Ada", avatar_url: null, community_id: "community", community_name: "Readers", admin: false },
    ])
    render(<Search />)
    selectType("All", "Users")
    await act(async () => jest.advanceTimersByTime(300))

    expect(searchProfiles).toHaveBeenCalledWith("", "all", expect.anything())
    expect(screen.getAllByText(/^(Ada|Zeynep)$/).map((node) => node.props.children)).toEqual(["Ada", "Zeynep"])

    openOptions()
    fireEvent.press(screen.getByRole("button", { name: "Name Z–A" }))
    expect(screen.getAllByText(/^(Ada|Zeynep)$/).map((node) => node.props.children)).toEqual(["Zeynep", "Ada"])
  })

  it("shows an empty state and request failure", async () => {
    jest.mocked(searchBooks).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error("offline"))
    render(<Search />)
    selectType("All", "Books")
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
    selectType("All", "Users")
    selectScope("All", "Community")
    await act(async () => { await Promise.resolve(); await jest.advanceTimersByTimeAsync(300) })

    expect(await screen.findByRole("button", { name: "Remove Ada Reader from community" })).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Remove Ada Reader from community" }))
    expect(screen.getByText("Remove Ada Reader from your community?")).toBeVisible()
    await act(async () => { fireEvent.press(screen.getByRole("button", { name: "Remove" })) })

    expect(removeCommunityMember).toHaveBeenCalledWith("community", "member-1")
    expect(screen.queryByRole("button", { name: "View Ada Reader's library" })).toBeNull()
  })
})
