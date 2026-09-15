jest.mock("@/utils/supabase", () => ({ supabase: { auth: { getSession: jest.fn() } } }))
jest.mock("@/config/env", () => ({ ENV: { API_URL: "https://api.test" } }))

import { supabase } from "@/utils/supabase"
import { apiFetch, clearApiCache, getCachedApiData } from "../api"

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

  it("deduplicates concurrent forced refreshes and stores the refreshed response", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => [1, 2] } as Response)
    const [first, second] = await Promise.all([
      apiFetch("/inbox/", { cache: "no-store" }),
      apiFetch("/inbox/", { cache: "no-store" }),
    ])
    expect(first).toEqual(second)
    expect(fetch).toHaveBeenCalledTimes(1)

    await apiFetch("/inbox/", { cache: "no-store" })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(getCachedApiData("/inbox/")).toEqual([1, 2])
  })

  it("invalidates GET cache after a mutation", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    await apiFetch("/books/me")
    await apiFetch("/books/1", { method: "PATCH", body: "{}" })
    await apiFetch("/books/me")
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it("preserves unrelated cached resources after a mutation", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    await apiFetch("/profile/me/")
    await apiFetch("/books/me")
    await apiFetch("/books/1", { method: "PATCH", body: "{}" })
    await apiFetch("/profile/me/")
    await apiFetch("/books/me")
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it("does not let an invalidated in-flight response repopulate the cache", async () => {
    let resolveBooks!: (response: Response) => void
    jest.mocked(fetch).mockImplementationOnce(() => new Promise((resolve) => {
      resolveBooks = resolve
    }))

    const staleBooksRequest = apiFetch("/books/me")
    await Promise.resolve()
    await Promise.resolve()
    expect(fetch).toHaveBeenCalledTimes(1)

    jest.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)
    await apiFetch("/books/1", { method: "PATCH", body: "{}" })
    resolveBooks({ ok: true, json: async () => [{ id: "stale-book" }] } as Response)
    await staleBooksRequest

    expect(getCachedApiData("/books/me")).toBeUndefined()
  })

  it("surfaces API detail and status", async () => {
    jest.mocked(fetch).mockResolvedValue({ ok: false, status: 403, statusText: "Forbidden", text: async () => JSON.stringify({ detail: "Wrong community" }) } as Response)
    await expect(apiFetch("/profile/members/other")).rejects.toEqual(expect.objectContaining({ message: "Wrong community", status: 403 }))
  })
})
