import { Alert } from "react-native"
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import * as ImagePicker from "expo-image-picker"

import BookForm from "../BookForm"
import { book } from "@/test/factories"

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))
jest.mock("expo-camera", () => ({
  CameraView: "CameraView",
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}))

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

  it.each([
    ["Pick from library", ImagePicker.requestMediaLibraryPermissionsAsync, ImagePicker.launchImageLibraryAsync],
    ["Capture new image", ImagePicker.requestCameraPermissionsAsync, ImagePicker.launchCameraAsync],
  ] as const)("opens the native crop editor for %s", async (actionLabel, requestPermission, launchPicker) => {
    jest.mocked(requestPermission).mockResolvedValue({ granted: true } as never)
    jest.mocked(launchPicker).mockResolvedValue({ canceled: true, assets: null })
    render(<BookForm mode="create" onSave={jest.fn()} />)

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: actionLabel }))
    })

    expect(launchPicker).toHaveBeenCalledWith(expect.objectContaining({
      allowsEditing: true,
      mediaTypes: ["images"],
    }))
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
