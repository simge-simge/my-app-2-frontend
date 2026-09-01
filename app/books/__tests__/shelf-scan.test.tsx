import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Alert } from "react-native"
import { router } from "expo-router"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"

import ShelfScanScreen from "../shelf-scan"
import { bulkCreateBooks, deleteShelfScanJob, getShelfScanJob, startShelfScan } from "@/services/books"

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock("@/services/books", () => ({
  getShelfScanJob: jest.fn(),
  startShelfScan: jest.fn(),
  bulkCreateBooks: jest.fn(),
  deleteShelfScanJob: jest.fn(),
}))

const asset = {
  uri: "file:///shelf.jpg",
  width: 1600,
  height: 900,
  type: "image" as const,
}

describe("ShelfScanScreen", () => {
  beforeEach(async () => {
    await AsyncStorage.clear()
    jest.spyOn(Alert, "alert").mockImplementation(() => {})
  })

  it("explains the review-first shelf import flow", () => {
    render(<ShelfScanScreen />)

    expect(screen.getByText("Turn one shelf into a book list")).toBeVisible()
    expect(screen.getByRole("button", { name: "Take shelf photo" })).toBeVisible()
    expect(screen.getByRole("button", { name: "Choose shelf photo" })).toBeVisible()
    expect(screen.getByText(/review everything before/i)).toBeVisible()
  })

  it("opens the native editor after taking a photo", async () => {
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValue({ granted: true } as never)
    jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({ canceled: true, assets: null })
    render(<ShelfScanScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Take shelf photo" }))

    await waitFor(() => expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({
      allowsEditing: true,
      mediaTypes: ["images"],
    })))
  })

  it("lets the user review detected books and bulk import them", async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as never)
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [asset] })
    jest.mocked(startShelfScan).mockResolvedValue({ id: "scan-1", status: "queued" })
    jest.mocked(getShelfScanJob).mockResolvedValue({
      id: "scan-1", status: "completed", error: null, created_at: "2026-01-02T12:00:00Z",
      books: [
        { title: "Piranesi", author: "Susanna Clarke", description: null, cover_url: null, isbn: "9781635575637", raw_spine_text: "PIRANESI", confidence: 0.96, catalog_matched: true },
        { title: "Earthsea", author: null, description: null, cover_url: null, isbn: null, raw_spine_text: "EARTHSEA", confidence: 0.72, catalog_matched: false },
      ],
    })
    jest.mocked(bulkCreateBooks).mockResolvedValue({ created: [{} as never, {} as never], skipped_duplicates: 0 })
    jest.mocked(deleteShelfScanJob).mockResolvedValue({ message: "Shelf scan removed" })
    render(<ShelfScanScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Choose shelf photo" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Submit shelf photo" })).toBeVisible())
    expect(startShelfScan).not.toHaveBeenCalled()
    fireEvent.press(screen.getByRole("button", { name: "Submit shelf photo" }))
    await waitFor(() => expect(screen.getByDisplayValue("Piranesi")).toBeVisible())
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({
      allowsEditing: true,
      mediaTypes: ["images"],
    }))
    fireEvent.changeText(screen.getAllByPlaceholderText("Author (optional)")[1], "Ursula K. Le Guin")
    fireEvent.press(screen.getByRole("button", { name: "Add 2 books" }))

    await waitFor(() => expect(bulkCreateBooks).toHaveBeenCalledWith([
      expect.objectContaining({ title: "Piranesi", author: "Susanna Clarke" }),
      expect.objectContaining({ title: "Earthsea", author: "Ursula K. Le Guin" }),
    ]))
    expect(router.replace).toHaveBeenCalledWith("/library")
    expect(deleteShelfScanJob).toHaveBeenCalledWith("scan-1")
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith("commonshelf.shelf-scan-job")
  })

  it("explains catalog matching when analysis takes longer", async () => {
    jest.useFakeTimers()
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as never)
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [asset] })
    jest.mocked(startShelfScan).mockImplementation(() => new Promise(() => {}))
    render(<ShelfScanScreen />)

    fireEvent.press(screen.getByRole("button", { name: "Choose shelf photo" }))
    await act(async () => {})
    fireEvent.press(screen.getByRole("button", { name: "Submit shelf photo" }))
    await act(async () => {})
    expect(screen.getByText("Reading the spines…")).toBeVisible()
    act(() => jest.advanceTimersByTime(7_000))
    expect(screen.getByText("Matching titles…")).toBeVisible()
    expect(screen.getByText("Checking Open Library one book at a time.")).toBeVisible()

    jest.useRealTimers()
  })

  it("restores an unfinished scan when the user returns", async () => {
    await AsyncStorage.setItem("commonshelf.shelf-scan-job", "scan-returned")
    jest.mocked(getShelfScanJob)
      .mockResolvedValueOnce({ id: "scan-returned", status: "processing", books: [], error: null, created_at: "2026-01-02T12:00:00Z" })
      .mockResolvedValueOnce({
        id: "scan-returned", status: "completed", error: null, created_at: "2026-01-02T12:00:00Z",
        books: [{ title: "Beloved", author: "Toni Morrison", description: null, cover_url: null, isbn: null, raw_spine_text: "BELOVED", confidence: 0.9, catalog_matched: false }],
      })
    jest.useFakeTimers()
    render(<ShelfScanScreen />)

    await act(async () => {})
    expect(screen.getByText(/leave this screen/i)).toBeVisible()
    await act(async () => { jest.advanceTimersByTime(2_000) })
    await waitFor(() => expect(screen.getByDisplayValue("Beloved")).toBeVisible())

    jest.useRealTimers()
  })
})
