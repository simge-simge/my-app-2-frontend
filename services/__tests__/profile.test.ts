jest.mock("../api", () => ({ apiFetch: jest.fn() }))

import { apiFetch } from "../api"
import { searchProfiles } from "../profile"

describe("profile service", () => {
  beforeEach(() => jest.mocked(apiFetch).mockResolvedValue([]))

  it("omits the query parameter when listing all users", async () => {
    await searchProfiles("", "all")

    expect(apiFetch).toHaveBeenCalledWith("/profile/me/search?scope=all")
  })

  it("trims and encodes a user search query", async () => {
    await searchProfiles("  Ada & Ece  ", "all")

    expect(apiFetch).toHaveBeenCalledWith(
      "/profile/me/search?scope=all&q=Ada%20%26%20Ece",
    )
  })
})
