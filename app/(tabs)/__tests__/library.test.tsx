import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"
import { Image } from "react-native"

import Library from "../library"
import { getMyBooks } from "@/services/books"
import { book } from "@/test/factories"
import { runInBackground } from "@/utils/backgroundAction"

jest.mock("@/services/api", () => ({ getCachedApiData: jest.fn(() => undefined) }))
jest.mock("@/services/books", () => ({ getMyBooks: jest.fn() }))

describe("library", () => {
  it("renders owned books and opens details", async () => {
    jest.mocked(getMyBooks).mockResolvedValue([book({ owner_id: "current-user" })])
    render(<Library />)
    const item = await screen.findByLabelText("The Left Hand of Darkness by Ursula K. Le Guin")
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

  it("searches the library and switches to compact list view", async () => {
    jest.mocked(getMyBooks).mockResolvedValue([
      book({ id: "book-earthsea", title: "A Wizard of Earthsea", author: "Ursula K. Le Guin", isbn: "9780547773742" }),
      book({ id: "book-beloved", title: "Beloved", author: "Toni Morrison", isbn: "9781400033416" }),
    ])
    render(<Library />)

    const search = await screen.findByLabelText("Search my library")
    fireEvent.changeText(search, "Morrison")
    expect(screen.getByText("Beloved")).toBeVisible()
    expect(screen.queryByText("A Wizard of Earthsea")).toBeNull()

    const listView = screen.getByRole("button", { name: "List view" })
    fireEvent.press(listView)
    expect(screen.getByRole("button", { name: "List view" }).props.accessibilityState).toMatchObject({ selected: true })
  })

  it("limits the library to ten books and pages through the results", async () => {
    jest.mocked(getMyBooks).mockResolvedValue(Array.from({ length: 12 }, (_, index) => book({
      id: `book-${index + 1}`,
      title: `Book ${String(index + 1).padStart(2, "0")}`,
      created_at: new Date(2025, 0, index + 1).toISOString(),
    })))
    render(<Library />)

    expect(await screen.findByText("Book 12")).toBeVisible()
    expect(screen.queryByText("Book 02")).toBeNull()
    expect(screen.getByText("Page 1 of 2")).toBeVisible()

    fireEvent.press(screen.getByRole("button", { name: "Next page" }))
    expect(screen.getByText("Book 02")).toBeVisible()
    expect(screen.getByText("Book 01")).toBeVisible()
    expect(screen.queryByText("Book 12")).toBeNull()
    expect(screen.getByText("Page 2 of 2")).toBeVisible()
  })

  it("merges a saved background book without refetching or accepting a stale response", async () => {
    let finishInitialLoad!: (books: ReturnType<typeof book>[]) => void
    jest.mocked(getMyBooks).mockImplementationOnce(() => new Promise((resolve) => {
      finishInitialLoad = resolve
    }))
    const savedBook = book({ id: "saved-book", owner_id: "current-user", title: "Just Saved" })

    render(<Library />)
    runInBackground(() => Promise.resolve(savedBook), {
      event: "books",
      onError: jest.fn(),
    })
    await waitFor(() => expect(finishInitialLoad).toBeDefined())
    finishInitialLoad([])

    expect(await screen.findByText("Just Saved")).toBeVisible()
    expect(getMyBooks).toHaveBeenCalledTimes(1)
  })

  it("shows an optimistic book immediately and keeps it visually stable after saving", async () => {
    jest.mocked(getMyBooks).mockResolvedValue([])
    render(<Library />)
    await waitFor(() => expect(getMyBooks).toHaveBeenCalledTimes(1))

    let finishSave!: (savedBook: ReturnType<typeof book>) => void
    const optimisticBook = book({ id: "pending-book", title: "Saving Book", cover_url: "file:///local-cover.jpg" })
    const savedBook = book({ id: "saved-book", title: "Saving Book", cover_url: "https://cdn.test/remote-cover.jpg" })
    act(() => {
      runInBackground(() => new Promise((resolve) => { finishSave = resolve }), {
        event: "books",
        optimisticResult: optimisticBook,
        onError: jest.fn(),
      })
    })

    expect(screen.getByLabelText("Saving Book by Ursula K. Le Guin").props.accessibilityState)
      .toMatchObject({ disabled: true })
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: "file:///local-cover.jpg" })

    await waitFor(() => expect(finishSave).toBeDefined())
    await act(async () => { finishSave(savedBook) })
    await waitFor(() => expect(
      screen.getByRole("button", { name: "Saving Book by Ursula K. Le Guin" }).props.accessibilityState,
    ).toMatchObject({ disabled: false }))
    expect(screen.UNSAFE_getByType(Image).props.source).toEqual({ uri: "file:///local-cover.jpg" })
    expect(screen.getAllByLabelText("Saving Book by Ursula K. Le Guin")).toHaveLength(1)
    expect(getMyBooks).toHaveBeenCalledTimes(1)
  })
})
