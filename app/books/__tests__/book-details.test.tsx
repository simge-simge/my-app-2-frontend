import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { useLocalSearchParams } from "expo-router"

import BookDetailsScreen from "../[bookId]"
import { getCachedApiData } from "@/services/api"
import { getBook, requestToBorrowBook, updateBook } from "@/services/books"
import { book } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({
  getBook: jest.fn(),
  requestToBorrowBook: jest.fn(),
  updateBook: jest.fn(),
}))
jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: "current-user" } } } }) } },
}))

describe("book details", () => {
  beforeEach(() => {
    jest.mocked(getCachedApiData).mockReturnValue(undefined)
    jest.mocked(useLocalSearchParams).mockReturnValue({
      bookId: book().id,
      ownerName: "Ada Reader",
      communityName: "Readers",
    })
    jest.mocked(getBook).mockResolvedValue(book())
    jest.mocked(requestToBorrowBook).mockResolvedValue({ message: "Borrow request sent", request_id: "request-1" })
    jest.mocked(updateBook).mockImplementation(async (_, update) => book({ owner_id: "current-user", status: update.status ?? "available" }))
  })

  it("lets a reader request the displayed book", async () => {
    render(<BookDetailsScreen />)

    const borrowButton = await screen.findByRole("button", { name: "Ask to borrow The Left Hand of Darkness" })
    expect(screen.getByText("Owner")).toBeVisible()
    expect(screen.getByText("Ada Reader")).toBeVisible()
    expect(screen.getByText("Community")).toBeVisible()
    expect(screen.getByText("Readers")).toBeVisible()
    expect(screen.getByText("Ask to borrow")).toBeVisible()
    fireEvent.press(borrowButton)

    expect(screen.getByText("Request sent")).toBeVisible()
    await waitFor(() => expect(requestToBorrowBook).toHaveBeenCalledWith(book().id))
  })

  it("never flashes the borrow action for a cached book owned by the current user", async () => {
    const ownedBook = book({ owner_id: "current-user" })
    jest.mocked(getCachedApiData).mockReturnValue(ownedBook)
    jest.mocked(getBook).mockResolvedValue(ownedBook)

    render(<BookDetailsScreen />)

    expect(screen.queryByText("Ask to borrow")).toBeNull()
    await waitFor(() => expect(getBook).toHaveBeenCalledWith(ownedBook.id))
    expect(screen.queryByText("Ask to borrow")).toBeNull()
  })

  it("lets the owner change availability from the book page", async () => {
    const ownedBook = book({ owner_id: "current-user" })
    jest.mocked(getBook).mockResolvedValue(ownedBook)

    render(<BookDetailsScreen />)

    const changeStatus = await screen.findByRole("button", { name: "Change status" })
    fireEvent.press(changeStatus)
    fireEvent.press(screen.getByRole("button", { name: "Mark book as unavailable" }))

    await waitFor(() => expect(updateBook).toHaveBeenCalledWith(ownedBook.id, { status: "lent" }))
    expect(screen.getByText("Unavailable")).toBeVisible()
  })
})
