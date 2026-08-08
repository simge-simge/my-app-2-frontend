import { Alert } from "react-native"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"

import BookForm from "../BookForm"
import { book } from "@/test/factories"

jest.mock("expo-image-picker", () => ({}))

describe("BookForm", () => {
  beforeEach(() => jest.spyOn(Alert, "alert").mockImplementation(() => {}))

  it("requires a title before saving", () => {
    const onSave = jest.fn()
    render(<BookForm mode="create" onSave={onSave} />)
    fireEvent.press(screen.getByRole("button", { name: "Save Book" }))
    expect(Alert.alert).toHaveBeenCalledWith("Missing title", "Please enter a title for the book.")
    expect(onSave).not.toHaveBeenCalled()
  })

  it("submits trimmed book details", async () => {
    const onSave = jest.fn().mockResolvedValue(undefined)
    render(<BookForm mode="create" onSave={onSave} />)
    fireEvent.changeText(screen.getByPlaceholderText("Book title"), "  Parable of the Sower  ")
    fireEvent.changeText(screen.getByPlaceholderText("Author name"), " Octavia Butler ")
    fireEvent.press(screen.getByRole("button", { name: "Save Book" }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ title: "Parable of the Sower", author: "Octavia Butler" }), null))
  })

  it("renders edit state and prevents delete while deleting", () => {
    const onDelete = jest.fn()
    render(<BookForm mode="edit" initialBook={book()} onSave={jest.fn()} onDelete={onDelete} deleting />)
    expect(screen.getByDisplayValue("The Left Hand of Darkness")).not.toBeEnabled()
    const deleteButton = screen.getByRole("button", { name: "Deleting..." })
    expect(deleteButton).toBeDisabled()
    fireEvent.press(deleteButton)
    expect(onDelete).not.toHaveBeenCalled()
  })

  it("renders its loading state", () => {
    render(<BookForm mode="edit" loading onSave={jest.fn()} />)
    expect(screen.getByText("Loading book...")).toBeVisible()
  })
})
