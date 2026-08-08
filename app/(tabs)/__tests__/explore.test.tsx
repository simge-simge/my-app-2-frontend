import { AccessibilityInfo, Animated } from "react-native"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Explore from "../explore"
import { getBookFeed } from "@/services/books"
import { createSwipe } from "@/services/swipes"
import { book } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({ getBookFeed: jest.fn() }))
jest.mock("@/services/swipes", () => ({ createSwipe: jest.fn() }))

describe("explore", () => {
  beforeEach(() => {
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true)
    jest.spyOn(AccessibilityInfo, "addEventListener").mockReturnValue({ remove: jest.fn() } as never)
    jest.spyOn(Animated, "timing").mockImplementation(() => ({ start: (callback?: (result: { finished: boolean }) => void) => callback?.({ finished: true }), stop: jest.fn(), reset: jest.fn() }) as never)
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
