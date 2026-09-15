import { apiFetch } from "./api"
import type { Location } from "./locations"
import type { ProfileSearchResult } from "./profile"

export type CommunitySearchResult = {
  id: string
  name: string
  location_id: string
  location: Location | null
  member_count: number
  is_member: boolean
  request_pending: boolean
}

export function searchCommunities(query = "", locationId?: string, signal?: AbortSignal) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (locationId) params.set("location_id", locationId)
  const suffix = params.toString() ? `?${params}` : ""
  const path = `/communities${suffix}`
  return (signal ? apiFetch(path, { signal }) : apiFetch(path)) as Promise<CommunitySearchResult[]>
}

export function requestCommunityJoin(communityId: string) {
  return apiFetch(`/communities/${communityId}/join-request`, {
    method: "POST",
    invalidate: ["communities", "profile"],
  }) as Promise<{ request_id: string; status: string }>
}

export function updateCommunityVisibility(communityId: string, isPublic: boolean) {
  return apiFetch(`/communities/${communityId}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ public: isPublic }),
    invalidate: ["communities", "profile"],
  }) as Promise<{ id: string; public: boolean }>
}

export function leaveCommunity() {
  return apiFetch("/communities/membership", {
    method: "DELETE",
    invalidate: ["communities", "profile", "books", "matches", "inbox"],
  }) as Promise<{ message: string; community_id: string }>
}

export function listCommunityMembers(communityId: string, query = "", signal?: AbortSignal) {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""
  return apiFetch(`/communities/${communityId}/members${suffix}`, {
    cache: "no-store",
    signal,
  }) as Promise<ProfileSearchResult[]>
}

export function removeCommunityMember(communityId: string, memberId: string) {
  return apiFetch(`/communities/${communityId}/members/${memberId}`, {
    method: "DELETE",
    invalidate: ["communities", "profile", "books", "matches", "inbox"],
  }) as Promise<{ message: string; member_id: string }>
}
