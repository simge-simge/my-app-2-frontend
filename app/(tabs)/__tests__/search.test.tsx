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
