import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import AppTabHeader from "@/components/AppTabHeader"
import { getInbox } from "@/services/inbox"

jest.mock("@/services/api", () => ({ getCachedApiData: () => undefined }))
jest.mock("@/services/inbox", () => ({ getInbox: jest.fn() }))

describe("shared main page header", () => {
  beforeEach(() => {
    jest.mocked(getInbox).mockResolvedValue({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 4 })
  })

  it("opens notifications and settings and refreshes the badge when the main page changes", async () => {
    const { rerender } = render(<AppTabHeader showActions refreshKey="/home" />)
    expect(await screen.findByText("4")).toBeVisible()

    fireEvent.press(screen.getByRole("button", { name: "Open messages" }))
    expect(router.push).toHaveBeenCalledWith("/inbox")
    fireEvent.press(screen.getByRole("button", { name: "Open settings" }))
    expect(router.push).toHaveBeenCalledWith("/settings")

    jest.mocked(getInbox).mockResolvedValue({ notifications: [], join_requests: [], borrow_requests: [], unread_count: 2 })
    rerender(<AppTabHeader showActions refreshKey="/search" />)
    await waitFor(() => expect(screen.getByText("2")).toBeVisible())
    expect(getInbox).toHaveBeenCalledTimes(2)
  })

  it("keeps secondary page headers free of main page actions", () => {
    render(<AppTabHeader />)
    expect(screen.getByRole("link", { name: "CommonShelf home" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Open settings" })).toBeNull()
    expect(getInbox).not.toHaveBeenCalled()
  })
})
