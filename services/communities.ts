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

export function searchCommunities(query = "", locationId?: string) {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (locationId) params.set("location_id", locationId)
  const suffix = params.toString() ? `?${params}` : ""
  return apiFetch(`/communities${suffix}`) as Promise<CommunitySearchResult[]>
}

export function requestCommunityJoin(communityId: string) {
  return apiFetch(`/communities/${communityId}/join-request`, {
    method: "POST",
  }) as Promise<{ request_id: string; status: string }>
}

export function updateCommunityVisibility(communityId: string, isPublic: boolean) {
  return apiFetch(`/communities/${communityId}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ public: isPublic }),
  }) as Promise<{ id: string; public: boolean }>
}

export function leaveCommunity() {
  return apiFetch("/communities/membership", {
    method: "DELETE",
  }) as Promise<{ message: string; community_id: string }>
}

export function listCommunityMembers(communityId: string, query = "") {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""
  return apiFetch(`/communities/${communityId}/members${suffix}`, {
    cache: "no-store",
  }) as Promise<ProfileSearchResult[]>
}

export function removeCommunityMember(communityId: string, memberId: string) {
  return apiFetch(`/communities/${communityId}/members/${memberId}`, {
    method: "DELETE",
  }) as Promise<{ message: string; member_id: string }>
}
