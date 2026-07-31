import { ENV } from "@/config/env"
import { supabase } from "@/utils/supabase"

const GET_CACHE_MAX_AGE_MS = 30_000

type CacheEntry = {
  data: unknown
  storedAt: number
}

const responseCache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, Promise<unknown>>()
let activeUserId: string | null = null
let cacheGeneration = 0

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function clearApiCache() {
  cacheGeneration += 1
  responseCache.clear()
  pendingRequests.clear()
}

export function getCachedApiData<T>(path: string): T | undefined {
  if (!activeUserId) return undefined
  return responseCache.get(`${activeUserId}:${path}`)?.data as T | undefined
}

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const userId = data.session?.user.id ?? null
  const method = (options.method ?? "GET").toUpperCase()

  if (userId !== activeUserId) {
    clearApiCache()
    activeUserId = userId
  }

  const cacheKey = userId ? `${userId}:${path}` : null
  if (method === "GET" && cacheKey) {
    const cached = responseCache.get(cacheKey)
    if (cached && Date.now() - cached.storedAt < GET_CACHE_MAX_AGE_MS) {
      return cached.data
    }

    const pending = pendingRequests.get(cacheKey)
    if (pending) return pending
  }

  const request = fetchApi(path, token, options)

  if (method === "GET" && cacheKey) {
    const requestGeneration = cacheGeneration
    pendingRequests.set(cacheKey, request)
    try {
      const result = await request
      if (requestGeneration === cacheGeneration) {
        storeCachedResponse(userId!, path, result)
      }
      return result
    } finally {
      pendingRequests.delete(cacheKey)
    }
  }

  const result = await request
  // Mutations can affect several screens (for example, a swipe can create a
  // match), so invalidate all cached API data rather than risking stale UI.
  clearApiCache()
  return result
}

function storeCachedResponse(userId: string, path: string, data: unknown) {
  const storedAt = Date.now()
  responseCache.set(`${userId}:${path}`, { data, storedAt })

  if (!Array.isArray(data)) return

  if (path === "/books/me" || path === "/books/feed" || path.startsWith("/books/search?")) {
    for (const book of data) {
      if (book && typeof book === "object" && "id" in book) {
        responseCache.set(`${userId}:/books/${book.id}`, { data: book, storedAt })
      }
    }
  }

  if (path === "/matches/") {
    for (const match of data) {
      if (match && typeof match === "object" && "match_id" in match) {
        responseCache.set(`${userId}:/matches/${match.match_id}`, { data: match, storedAt })
      }
    }
  }
}

async function fetchApi(path: string, token: string | undefined, options: RequestInit) {

  const response = await fetch(`${ENV.API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const body = await response.text()
    let detail = body

    try {
      const parsed = JSON.parse(body)
      detail = typeof parsed.detail === "string" ? parsed.detail : body
    } catch {
      // Keep the raw response when it is not JSON.
    }

    throw new ApiError(
      detail || `Request failed (${response.status} ${response.statusText})`,
      response.status,
    )
  }

  return response.json()
}
