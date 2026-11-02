import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native"

import * as ImagePicker from "expo-image-picker"

import Settings from "../settings"
import { getProfile, updateProfile, uploadProfilePicture, type Profile } from "@/services/profile"
import { searchLocations } from "@/services/locations"
import { leaveCommunity } from "@/services/communities"

jest.mock("@/services/api", () => ({
  ApiError: class ApiError extends Error {},
  getCachedApiData: jest.fn(() => undefined),
}))
jest.mock("@/services/profile", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  uploadProfilePicture: jest.fn(),
  deleteAccount: jest.fn(),
}))
jest.mock("@/services/authentication", () => ({ signOut: jest.fn() }))
jest.mock("@/services/admin", () => ({ createCommunity: jest.fn() }))
jest.mock("@/services/communities", () => ({ leaveCommunity: jest.fn(), updateCommunityVisibility: jest.fn() }))
jest.mock("@/services/locations", () => ({ searchLocations: jest.fn() }))

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}))

const istanbul = { id: "location-istanbul", name: "İstanbul", display_name: "İstanbul, Türkiye", type: "city" as const, parent_id: "location-tr", country_code: "TR" }
const ankara = { id: "location-ankara", name: "Ankara", display_name: "Ankara, Türkiye", type: "city" as const, parent_id: "location-tr", country_code: "TR" }

const profile: Profile = {
  id: "user-1",
  display_name: "Ada Reader",
  location_id: istanbul.id,
  location: istanbul,
  avatar_url: null,
  contacts: { email: "ada@example.com" },
  community_id: null,
  community_name: null,
  community_location: null,
  community_public: null,
  admin: false,
  is_app_admin: false,
  pending_community_name: null,
  pending_community_request_id: null,
  created_at: "2026-01-02T12:00:00Z",
}

describe("settings", () => {
  beforeEach(() => {
    jest.mocked(getProfile).mockResolvedValue(profile)
    jest.mocked(updateProfile).mockResolvedValue(profile)
    jest.mocked(searchLocations).mockResolvedValue([ankara])
  })

  it("shows the current photo and saves a newly selected picture", async () => {
    const url = "https://cdn.test/avatar.jpg"
    const asset = { uri: "file:///photo.jpg", width: 300, height: 300 }
    jest.mocked(getProfile).mockResolvedValue({ ...profile, avatar_url: "https://cdn.test/old.jpg" })
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as any)
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [asset] })
    jest.mocked(uploadProfilePicture).mockResolvedValue(url)
    jest.mocked(updateProfile).mockResolvedValue({ ...profile, avatar_url: url })
    render(<Settings />)
    const avatar = await screen.findByLabelText("Profile picture")
    expect(avatar.props.source).toEqual({ uri: "https://cdn.test/old.jpg" })
    fireEvent.press(screen.getByRole("button", { name: "Change picture" }))
    fireEvent.press(screen.getByRole("button", { name: "Pick from library" }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ avatar_url: url }))
    expect(uploadProfilePicture).toHaveBeenCalledWith(asset)
    await waitFor(() => expect(screen.getByLabelText("Profile picture").props.source).toEqual({ uri: url }))
  })

  it("saves a default color without uploading a file", async () => {
    jest.mocked(updateProfile).mockResolvedValue({ ...profile, avatar_url: "default:sage" })
    render(<Settings />)
    fireEvent.press(await screen.findByRole("button", { name: "Change picture" }))
    expect(screen.getAllByRole("radio", { name: /^Use .* avatar$/ })).toHaveLength(5)
    fireEvent.press(screen.getByRole("radio", { name: "Use sage avatar" }))
    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ avatar_url: "default:sage" }))
    expect(uploadProfilePicture).not.toHaveBeenCalled()
  })

  it("preserves the current picture and offers retry after an upload failure", async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as any)
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [{ uri: "file:///photo.jpg", width: 300, height: 300 }] })
    jest.mocked(uploadProfilePicture).mockRejectedValue(new Error("Upload failed"))
    render(<Settings />)
    fireEvent.press(await screen.findByRole("button", { name: "Change picture" }))
    fireEvent.press(screen.getByRole("button", { name: "Pick from library" }))
    expect(await screen.findByRole("alert")).toHaveTextContent(/Could not save your profile picture/)
    expect(updateProfile).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Pick from library" })).toBeEnabled()
  })

  it("leaves the picture unchanged when the picker is canceled", async () => {
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as any)
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: null })
    render(<Settings />)
    fireEvent.press(await screen.findByRole("button", { name: "Change picture" }))
    await act(async () => { fireEvent.press(screen.getByRole("button", { name: "Pick from library" })) })
    expect(uploadProfilePicture).not.toHaveBeenCalled()
    expect(updateProfile).not.toHaveBeenCalled()
  })

  it("displays and updates the user's location", async () => {
    render(<Settings />)

    expect(await screen.findByDisplayValue("İstanbul, Türkiye")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Edit location" }))
    fireEvent.changeText(screen.getByLabelText("Location"), "Anka")
    fireEvent.press(await screen.findByRole("button", { name: "Select Ankara, Türkiye" }))
    fireEvent.press(screen.getByRole("button", { name: "Save location" }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ location_id: ankara.id }))
  })

  it("disables every other edit action while a profile field is being edited", async () => {
    render(<Settings />)

    await screen.findByDisplayValue("Ada Reader")
    fireEvent.press(screen.getByRole("button", { name: "Edit name" }))

    expect(screen.getByRole("button", { name: "Edit location" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Find a community" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Edit phone" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Edit Instagram" })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Edit Telegram" })).toBeDisabled()
  })

  it("lets a member leave their community after confirmation", async () => {
    jest.mocked(getProfile).mockResolvedValue({
      ...profile,
      community_id: "community-1",
      community_name: "Readers",
      community_public: true,
    })
    jest.mocked(leaveCommunity).mockResolvedValue({ message: "Community left", community_id: "community-1" })
    render(<Settings />)

    fireEvent.press(await screen.findByRole("button", { name: "Leave community" }))
    expect(screen.getByText("Are you sure you want to leave Readers?")).toBeVisible()
    await act(async () => { fireEvent.press(screen.getByRole("button", { name: "Leave" })) })

    await waitFor(() => expect(leaveCommunity).toHaveBeenCalled())
    expect(screen.queryByRole("button", { name: "Leave community" })).toBeNull()
  })
})
