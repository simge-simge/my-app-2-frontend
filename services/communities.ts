import { apiFetch } from "./api"

export type CommunitySearchResult = {
  id: string
  name: string
  location: string | null
  member_count: number
  is_member: boolean
  request_pending: boolean
}

export function searchCommunities(query = "", location = "") {
  const params = new URLSearchParams()
  if (query.trim()) params.set("q", query.trim())
  if (location.trim()) params.set("location", location.trim())
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
