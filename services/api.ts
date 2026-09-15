import { ENV } from "@/config/env"
import { supabase } from "@/utils/supabase"

const GET_CACHE_MAX_AGE_MS = 30_000

export type ApiCacheResource = "books" | "communities" | "inbox" | "locations" | "matches" | "profile"
type CacheResource = ApiCacheResource | "other"

type ApiFetchOptions = RequestInit & {
  invalidate?: readonly ApiCacheResource[] | "all"
}

type CacheEntry = {
  data: unknown
  storedAt: number
  resource: CacheResource
}

type PendingRequest = {
  promise: Promise<unknown>
  resource: CacheResource
}

const responseCache = new Map<string, CacheEntry>()
const pendingRequests = new Map<string, PendingRequest>()
const resourceGenerations = new Map<CacheResource, number>()
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

export function invalidateApiCache(resources: readonly ApiCacheResource[]) {
  const affected = new Set<CacheResource>(resources)
  if (affected.size === 0) return

  affected.forEach((resource) => {
    resourceGenerations.set(resource, (resourceGenerations.get(resource) ?? 0) + 1)
  })
  responseCache.forEach((entry, key) => {
    if (affected.has(entry.resource)) responseCache.delete(key)
  })
  pendingRequests.forEach((entry, key) => {
    if (affected.has(entry.resource)) pendingRequests.delete(key)
  })
}

export function getCachedApiData<T>(path: string): T | undefined {
  if (!activeUserId) return undefined
  return responseCache.get(`${activeUserId}:${path}`)?.data as T | undefined
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { invalidate, ...requestOptions } = options
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const userId = data.session?.user.id ?? null
  const method = (requestOptions.method ?? "GET").toUpperCase()
  const skipCache = requestOptions.cache === "no-store"
  const resource = getCacheResource(path)

  if (userId !== activeUserId) {
    clearApiCache()
    activeUserId = userId
  }

  const cacheKey = userId ? `${userId}:${path}` : null
  if (method === "GET" && cacheKey) {
    if (!skipCache) {
      const cached = responseCache.get(cacheKey)
      if (cached && Date.now() - cached.storedAt < GET_CACHE_MAX_AGE_MS) {
        return cached.data
      }
    }

    // A forced refresh should bypass stored data, but it can still share an
    // identical request that is already in flight.
    const pending = pendingRequests.get(cacheKey)
    if (pending) return pending.promise
  }

  const request = fetchApi(path, token, requestOptions)

  if (method === "GET" && cacheKey) {
    const requestGeneration = cacheGeneration
    const requestResourceGeneration = resourceGenerations.get(resource) ?? 0
    pendingRequests.set(cacheKey, { promise: request, resource })
    try {
      const result = await request
      // `no-store` forces a network read, but its successful response is still
      // the freshest snapshot for screens that render cached data immediately.
      if (
        requestGeneration === cacheGeneration
        && requestResourceGeneration === (resourceGenerations.get(resource) ?? 0)
      ) {
        storeCachedResponse(userId!, path, result, resource)
      }
      return result
    } finally {
      if (pendingRequests.get(cacheKey)?.promise === request) pendingRequests.delete(cacheKey)
    }
  }

  const result = await request
  if (invalidate === "all") {
    clearApiCache()
  } else {
    // Most mutations only stale their own domain. Cross-domain mutations list
    // their dependencies at the service call site.
    const resources = invalidate ?? (resource === "other" ? [] : [resource])
    invalidateApiCache(resources)
  }
  return result
}

function storeCachedResponse(userId: string, path: string, data: unknown, resource: CacheResource) {
  const storedAt = Date.now()
  responseCache.set(`${userId}:${path}`, { data, storedAt, resource })

  if (!Array.isArray(data)) return

  if (path === "/books/me" || path === "/books/feed" || path.startsWith("/books/search?")) {
    for (const book of data) {
      if (book && typeof book === "object" && "id" in book) {
        responseCache.set(`${userId}:/books/${book.id}`, { data: book, storedAt, resource: "books" })
      }
    }
  }

  if (path === "/matches/") {
    for (const match of data) {
      if (match && typeof match === "object" && "match_id" in match) {
        responseCache.set(`${userId}:/matches/${match.match_id}`, { data: match, storedAt, resource: "matches" })
      }
    }
  }
}

function getCacheResource(path: string): CacheResource {
  if (path.startsWith("/books")) return "books"
  if (path.startsWith("/communities") || path.startsWith("/admin/communities")) return "communities"
  if (path.startsWith("/inbox")) return "inbox"
  if (path.startsWith("/locations")) return "locations"
  if (path.startsWith("/matches")) return "matches"
  if (path.startsWith("/profile")) return "profile"
  return "other"
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
