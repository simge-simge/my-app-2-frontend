import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"

import Settings from "../settings"
import { getProfile, updateProfile, type Profile } from "@/services/profile"
import { searchLocations } from "@/services/locations"

jest.mock("@/services/api", () => ({
  ApiError: class ApiError extends Error {},
  getCachedApiData: jest.fn(() => undefined),
}))
jest.mock("@/services/profile", () => ({
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  deleteAccount: jest.fn(),
}))
jest.mock("@/services/authentication", () => ({ signOut: jest.fn() }))
jest.mock("@/services/admin", () => ({ createCommunity: jest.fn() }))
jest.mock("@/services/communities", () => ({ updateCommunityVisibility: jest.fn() }))
jest.mock("@/services/locations", () => ({ searchLocations: jest.fn() }))

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

  it("displays and updates the user's location", async () => {
    render(<Settings />)

    expect(await screen.findByDisplayValue("İstanbul, Türkiye")).toBeVisible()
    fireEvent.press(screen.getByRole("button", { name: "Edit location" }))
    fireEvent.changeText(screen.getByLabelText("Location"), "Anka")
    fireEvent.press(await screen.findByRole("button", { name: "Select Ankara, Türkiye" }))
    fireEvent.press(screen.getByRole("button", { name: "Save location" }))

    await waitFor(() => expect(updateProfile).toHaveBeenCalledWith({ location_id: ankara.id }))
  })
})
