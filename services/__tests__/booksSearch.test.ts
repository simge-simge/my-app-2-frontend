jest.mock("../api", () => ({ apiFetch: jest.fn() }))
jest.mock("expo-image-manipulator", () => ({}))
jest.mock("expo-file-system", () => ({ File: jest.fn() }))
jest.mock("@/utils/supabase", () => ({ supabase: {} }))

import { apiFetch } from "../api"
import { searchBooks } from "../books"

describe("book search service", () => {
  beforeEach(() => jest.mocked(apiFetch).mockResolvedValue([]))

  it("omits the query parameter when listing books", async () => {
    await searchBooks("", "all")

    expect(apiFetch).toHaveBeenCalledWith("/books/search?scope=all")
  })

  it("trims and encodes a book query", async () => {
    await searchBooks("  Earth & Sea  ", "community")

    expect(apiFetch).toHaveBeenCalledWith(
      "/books/search?scope=community&q=Earth%20%26%20Sea",
    )
  })
})
