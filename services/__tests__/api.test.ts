jest.mock("@/utils/supabase", () => ({ supabase: { auth: { getSession: jest.fn() } } }))
jest.mock("@/config/env", () => ({ ENV: { API_URL: "https://api.test" } }))

import { supabase } from "@/utils/supabase"
import { apiFetch, clearApiCache } from "../api"

const mockGetSession = jest.mocked(supabase.auth.getSession)

describe("apiFetch", () => {
  beforeEach(() => {
    clearApiCache()
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "token", user: { id: "user-1" } } } } as never)
    global.fetch = jest.fn()
  })

  it("adds authentication and caches duplicate GETs", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) } as Response)
    expect(await apiFetch("/books/1")).toEqual({ id: 1 })
    expect(await apiFetch("/books/1")).toEqual({ id: 1 })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith("https://api.test/books/1", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token" }) }))
  })

  it("deduplicates concurrent requests", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [1, 2] } as Response)
    const [first, second] = await Promise.all([apiFetch("/books/feed"), apiFetch("/books/feed")])
    expect(first).toEqual(second)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it("deduplicates concurrent forced refreshes without caching them", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [1, 2] } as Response)
    const [first, second] = await Promise.all([
      apiFetch("/inbox/", { cache: "no-store" }),
      apiFetch("/inbox/", { cache: "no-store" }),
    ])
    expect(first).toEqual(second)
    expect(fetch).toHaveBeenCalledTimes(1)

    await apiFetch("/inbox/", { cache: "no-store" })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it("invalidates GET cache after a mutation", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    await apiFetch("/books/me")
    await apiFetch("/books/1", { method: "PATCH", body: "{}" })
    await apiFetch("/books/me")
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("surfaces API detail and status", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: false, status: 403, statusText: "Forbidden", text: async () => JSON.stringify({ detail: "Wrong community" }) } as Response)
    await expect(apiFetch("/profile/members/other")).rejects.toEqual(expect.objectContaining({ message: "Wrong community", status: 403 }))
  })
})
