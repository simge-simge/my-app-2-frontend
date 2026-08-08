import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Library from "../library"
import { getMyBooks } from "@/services/books"
import { book } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({ getMyBooks: jest.fn() }))

describe("library", () => {
  it("renders owned books and opens details", async () => {
    jest.mocked(getMyBooks).mockResolvedValue([book({ owner_id: "current-user" })])
    render(<Library />)
    const item = await screen.findByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" })
    fireEvent.press(item)
    expect(router.push).toHaveBeenCalledWith("/books/10000000-0000-0000-0000-000000000001")
  })

  it("renders empty and error states", async () => {
    jest.mocked(getMyBooks).mockResolvedValueOnce([])
    const view = render(<Library />)
    expect(await screen.findByText("No books yet")).toBeVisible()
    view.unmount()
    jest.mocked(getMyBooks).mockRejectedValueOnce(new Error("offline"))
    render(<Library />)
    expect(await screen.findByText("Could not load your library.")).toBeVisible()
  })

  it("opens the add-book flow from its labeled action", async () => {
    jest.mocked(getMyBooks).mockResolvedValue([])
    render(<Library />)
    await waitFor(() => expect(getMyBooks).toHaveBeenCalled())
    fireEvent.press(screen.getByRole("button", { name: "Add book" }))
    expect(router.push).toHaveBeenCalledWith("/books/new")
  })
})
