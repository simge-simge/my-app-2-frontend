import { act, render, screen, waitFor } from "@testing-library/react-native"

import Home from "../home"
import { getBookFeed, getMyBooks, searchBooks } from "@/services/books"
import { getInbox } from "@/services/inbox"
import { getMatches } from "@/services/matches"
import { getProfile, type Profile } from "@/services/profile"
import { book } from "@/test/factories"

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
  it("renders profile before loading the inbox badge and skips ineffective prefetches", async () => {
    let finishFeed!: (books: ReturnType<typeof book>[]) => void
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(getBookFeed).mockImplementation(() => new Promise((resolve) => {
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
    expect(getInbox).not.toHaveBeenCalled()
    expect(getMyBooks).not.toHaveBeenCalled()
    expect(getMatches).not.toHaveBeenCalled()

    await waitFor(() => expect(finishFeed).toBeDefined())
    await act(async () => { finishFeed([book()]) })
    await waitFor(() => expect(getInbox).toHaveBeenCalledTimes(1))
    expect(getMyBooks).not.toHaveBeenCalled()
    expect(getMatches).not.toHaveBeenCalled()
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
    expect(getBookFeed).not.toHaveBeenCalled()
  })
})
