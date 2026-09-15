import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Alert } from "react-native"
import { router } from "expo-router"

import NewBookScreen from "../new"
import { createBook, lookupBookByIsbn, type Book } from "@/services/books"
import { subscribeToBackgroundActions } from "@/utils/backgroundAction"

jest.mock("expo-camera", () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}))
jest.mock("expo-image-picker", () => ({}))
jest.mock("@/services/books", () => ({
  createBook: jest.fn(),
  uploadBookCover: jest.fn(),
  lookupBookByIsbn: jest.fn(),
}))

describe("NewBookScreen", () => {
  it("offers shelf scan, barcode, ISBN, and manual entry", () => {
    render(<NewBookScreen />)

    expect(screen.getByRole("button", { name: "Scan a shelf" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Scan the barcode" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Enter an ISBN" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Add details manually" })).toBeVisible()
  })

  it("looks up an ISBN and prefills the editable form", async () => {
    const log = jest.spyOn(console, "log").mockImplementation(() => {})
    jest.mocked(lookupBookByIsbn).mockResolvedValue({
      title: "The Little Prince",
      author: "Antoine de Saint-Exupéry",
      description: "A small prince travels between worlds.",
      isbn: "9780156012195",
      cover_url: null,
    })
    render(<NewBookScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Enter an ISBN" }))
    fireEvent.changeText(screen.getByPlaceholderText("978 0 00 000000 0"), "978-0-15-601219-5")
    fireEvent.press(screen.getByRole("button", { name: "Find book" }))

    await waitFor(() => expect(screen.getByDisplayValue("The Little Prince")).toBeVisible())
    expect(screen.getByText("ISBN entered")).toBeVisible()
    expect(screen.getAllByText("9780156012195").length).toBeGreaterThan(0)
    expect(log).toHaveBeenCalledWith("ISBN entered:", "9780156012195")
    expect(screen.getByDisplayValue("Antoine de Saint-Exupéry")).toBeVisible()
    expect(lookupBookByIsbn).toHaveBeenCalledWith("9780156012195")
  })

  it("returns immediately and publishes a pending manual book", async () => {
    let finishSave!: (book: Book) => void
    const listener = jest.fn()
    const unsubscribe = subscribeToBackgroundActions(listener)
    jest.mocked(createBook).mockImplementation(() => new Promise<Book>((resolve) => { finishSave = resolve }))
    render(<NewBookScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Add details manually" }))
    fireEvent.changeText(screen.getByPlaceholderText("Book title"), "Instant Book")
    fireEvent.changeText(screen.getByPlaceholderText("Author name"), "Fast Author")
    fireEvent.press(screen.getByRole("button", { name: "Save Book" }))

    expect(router.back).toHaveBeenCalled()
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({
      event: "books",
      status: "pending",
      optimisticResult: expect.objectContaining({ title: "Instant Book", author: "Fast Author" }),
    }))
    await waitFor(() => expect(createBook).toHaveBeenCalledWith(expect.objectContaining({
      title: "Instant Book",
      author: "Fast Author",
    })))

    await act(async () => { finishSave({ id: "saved-book" } as Book) })
    await waitFor(() => expect(listener).toHaveBeenCalledWith(expect.objectContaining({ event: "books", status: "completed" })))
    unsubscribe()
  })

  it("reports a background manual save failure", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {})
    jest.mocked(createBook).mockRejectedValue(new Error("Database unavailable"))
    render(<NewBookScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Add details manually" }))
    fireEvent.changeText(screen.getByPlaceholderText("Book title"), "Unsaved Book")
    fireEvent.press(screen.getByRole("button", { name: "Save Book" }))

    expect(router.back).toHaveBeenCalled()
    await waitFor(() => expect(alert).toHaveBeenCalledWith("Book was not saved", "Database unavailable"))
  })
})
