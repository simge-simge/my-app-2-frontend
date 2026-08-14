import { AccessibilityInfo, Animated } from "react-native"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Explore from "../explore"
import { getBookFeed } from "@/services/books"
import { getProfile, type Profile } from "@/services/profile"
import { createSwipe } from "@/services/swipes"
import { book } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({ getBookFeed: jest.fn() }))
jest.mock("@/services/profile", () => ({ getProfile: jest.fn() }))
jest.mock("@/services/swipes", () => ({ createSwipe: jest.fn() }))

const profile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  display_name: "Current Reader",
  location_id: "location-istanbul",
  location: { id: "location-istanbul", name: "İstanbul", display_name: "İstanbul, Türkiye", type: "city", parent_id: "location-tr", country_code: "TR" },
  avatar_url: null,
  contacts: {},
  community_id: "community-1",
  community_name: "North Readers",
  community_location: { id: "location-kadikoy", name: "Kadıköy", display_name: "Kadıköy, İstanbul, Türkiye", type: "district", parent_id: "location-istanbul", country_code: "TR" },
  community_public: true,
  admin: false,
  is_app_admin: false,
  pending_community_name: null,
  pending_community_request_id: null,
  created_at: "2025-01-01T00:00:00Z",
  ...overrides,
})

describe("explore", () => {
  beforeEach(() => {
    jest.mocked(getProfile).mockResolvedValue(profile())
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true)
    jest.spyOn(AccessibilityInfo, "addEventListener").mockReturnValue({ remove: jest.fn() } as never)
    jest.spyOn(Animated, "timing").mockImplementation(() => ({ start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }), stop: jest.fn(), reset: jest.fn() }) as never)
  })

  it("offers a community link without loading the feed when the user has no community", async () => {
    jest.mocked(getProfile).mockResolvedValue(profile({ community_id: null, community_name: null }))

    render(<Explore />)

    expect(await screen.findByText("Join a community to explore books")).toBeVisible()
    expect(getBookFeed).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole("link", { name: "Find a community" }))
    expect(router.push).toHaveBeenCalledWith("/communities/search")
  })

  it("renders the active book and records a pass gesture", async () => {
    jest.mocked(getBookFeed).mockResolvedValue([book()])
    jest.mocked(createSwipe).mockResolvedValue({ swipe: [], match: null })
    render(<Explore />)
    const card = await screen.findByLabelText("Swipe The Left Hand of Darkness")
    await act(async () => fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "decrement" } }))
    expect(createSwipe).toHaveBeenCalledWith(expect.objectContaining({ direction: "left", target_book_id: book().id }))
    expect(await screen.findByText("No books to explore")).toBeVisible()
  })

  it("prevents duplicate gestures while a swipe is processing", async () => {
    let finish!: (value: { swipe: []; match: null }) => void
    jest.mocked(getBookFeed).mockResolvedValue([book()])
    jest.mocked(createSwipe).mockReturnValue(new Promise((resolve) => { finish = resolve }) as never)
    render(<Explore />)
    const card = await screen.findByLabelText("Swipe The Left Hand of Darkness")
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "increment" } })
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "increment" } })
    expect(createSwipe).toHaveBeenCalledTimes(1)
    await act(async () => finish({ swipe: [], match: null }))
  })

  it("opens a newly-created match after an interested gesture", async () => {
    jest.mocked(getBookFeed).mockResolvedValue([book()])
    jest.mocked(createSwipe).mockResolvedValue({ swipe: [], match: [{ id: "match-new" }] as never })
    render(<Explore />)
    const card = await screen.findByLabelText("Swipe The Left Hand of Darkness")
    await act(async () => fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "increment" } }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith({ pathname: "/matches/[matchId]", params: { matchId: "match-new" } }))
  })

  it("renders empty and API failure states", async () => {
    jest.mocked(getBookFeed).mockResolvedValueOnce([])
    const view = render(<Explore />)
    expect(await screen.findByText("No books to explore")).toBeVisible()
    view.unmount()
    jest.mocked(getBookFeed).mockRejectedValueOnce(new Error("offline"))
    render(<Explore />)
    expect(await screen.findByText("Could not load books right now.")).toBeVisible()
  })
})
