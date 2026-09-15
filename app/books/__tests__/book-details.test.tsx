import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { useLocalSearchParams } from "expo-router"

import BookDetailsScreen from "../[bookId]"
import { getBook, requestToBorrowBook } from "@/services/books"
import { book } from "@/test/factories"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({
  getBook: jest.fn(),
  requestToBorrowBook: jest.fn(),
}))
jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { user: { id: "current-user" } } } }) } },
}))

describe("book details", () => {
  beforeEach(() => {
    jest.mocked(useLocalSearchParams).mockReturnValue({
      bookId: book().id,
      ownerName: "Ada Reader",
      communityName: "Readers",
    })
    jest.mocked(getBook).mockResolvedValue(book())
    jest.mocked(requestToBorrowBook).mockResolvedValue({ message: "Borrow request sent", request_id: "request-1" })
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
})
