import { act, render, screen, waitFor } from "@testing-library/react-native"

import Home from "../home"
import { getCachedApiData } from "@/services/api"
import { getMyBooks, searchBooks } from "@/services/books"
import { getInbox } from "@/services/inbox"
import { getMatches } from "@/services/matches"
import { getProfile, type Profile } from "@/services/profile"
import { book } from "@/test/factories"
import { runInBackground } from "@/utils/backgroundAction"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({
  getBookFeed: jest.fn(),
  getMyBooks: jest.fn(),
  searchBooks: jest.fn(),
}))
jest.mock("@/services/inbox", () => ({ getInbox: jest.fn() }))
jest.mock("@/services/matches", () => ({ getMatches: jest.fn() }))
jest.mock("@/services/profile", () => ({ getProfile: jest.fn() }))

const profile: Profile = {
  id: "user-a",
  display_name: "Ada",
  location_id: null,
  location: null,
  avatar_url: null,
  contacts: {},
  community_id: "community-a",
  community_name: "Fast Readers",
  community_location: null,
  community_public: true,
  admin: false,
  is_app_admin: false,
  pending_community_name: null,
  pending_community_request_id: null,
  created_at: "2026-01-02T12:00:00Z",
}

describe("home performance flow", () => {
  beforeEach(() => {
    jest.mocked(getCachedApiData).mockReturnValue(undefined)
  })

  it("loads the inbox badge without waiting for the community shelf and skips ineffective prefetches", async () => {
    let finishFeed!: (books: ReturnType<typeof book>[]) => void
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(searchBooks).mockImplementation(() => new Promise((resolve) => {
      finishFeed = resolve
    }))
    jest.mocked(getInbox).mockResolvedValue({
      notifications: [],
      join_requests: [],
      borrow_requests: [],
      unread_count: 3,
    })

    render(<Home />)

    expect(await screen.findByText("Hello, Ada")).toBeVisible()
    expect(getInbox).toHaveBeenCalledTimes(1)
    expect(getMyBooks).not.toHaveBeenCalled()
    expect(getMatches).not.toHaveBeenCalled()

    await waitFor(() => expect(finishFeed).toBeDefined())
    await act(async () => { finishFeed([book()]) })
    expect(getMyBooks).not.toHaveBeenCalled()
    expect(getMatches).not.toHaveBeenCalled()
  })

  it("updates the badge immediately from an optimistic inbox action", async () => {
    let finishUpdate!: () => void
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(searchBooks).mockResolvedValue([])
    jest.mocked(getInbox)
      .mockResolvedValueOnce({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 3 })
      .mockResolvedValue({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 0 })

    render(<Home />)
    expect(await screen.findByText("3")).toBeVisible()

    act(() => {
      runInBackground(() => new Promise<void>((resolve) => { finishUpdate = resolve }), {
        event: "inbox-unread-count",
        optimisticResult: 0,
        onError: jest.fn(),
      })
    })

    await waitFor(() => expect(screen.queryByText("3")).toBeNull())
    await act(async () => { finishUpdate() })
    await waitFor(() => expect(getInbox).toHaveBeenCalledWith(true))
  })

  it("keeps the cached shelf visible while refreshing it", async () => {
    const cachedBook = book({ id: "cached-book", title: "Cached Shelf Book" })
    let finishFeed!: (books: ReturnType<typeof book>[]) => void
    jest.mocked(getCachedApiData).mockImplementation((path) => {
      if (path === "/profile/me/") return profile
      if (path === "/books/search?scope=community") return [cachedBook]
      return undefined
    })
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(getInbox).mockResolvedValue({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 0 })
    jest.mocked(searchBooks).mockImplementation(() => new Promise((resolve) => {
      finishFeed = resolve
    }))

    render(<Home />)
    expect(screen.getByText("Cached Shelf Book")).toBeTruthy()
    await waitFor(() => expect(finishFeed).toBeDefined())
    expect(screen.getByText("Cached Shelf Book")).toBeTruthy()

    await act(async () => { finishFeed([book({ id: "fresh-book", title: "Fresh Shelf Book" })]) })
    expect(await screen.findByText("Fresh Shelf Book")).toBeTruthy()
  })

  it("shows community books regardless of owner or status", async () => {
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(getInbox).mockResolvedValue({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 0 })
    jest.mocked(searchBooks).mockResolvedValue([
      book({ id: "my-community-book", owner_id: profile.id, title: "My Matched Book", status: "matched" }),
      book({ id: "lent-community-book", owner_id: "user-b", title: "Their Lent Book", status: "lent" }),
    ])

    render(<Home />)

    expect(await screen.findByText("My Matched Book")).toBeTruthy()
    expect(screen.getByText("Their Lent Book")).toBeTruthy()
    expect(screen.queryByText("Your community shelf is waiting for its first story.")).toBeNull()
    expect(searchBooks).toHaveBeenCalledWith("", "community")

  })

  it("shows the local bilingual preview without searching for books", async () => {
    jest.mocked(getProfile).mockResolvedValue({
      ...profile,
      community_id: null,
      community_name: null,
    })
    jest.mocked(getInbox).mockResolvedValue({
      notifications: [],
      join_requests: [],
      borrow_requests: [],
      unread_count: 0,
    })

    render(<Home />)

    expect(await screen.findByText("Kürk Mantolu Madonna")).toBeTruthy()
    expect(screen.getByText("The Left Hand of Darkness")).toBeTruthy()
    expect(searchBooks).not.toHaveBeenCalled()
  })
})
