import { apiFetch } from "./api"
import type { SearchScope } from "./books"
import type { Book } from "./books"

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  contacts: Record<string, string>
  community_id: string | null
  community_name: string | null
  community_location: string | null
  community_public: boolean | null
  admin: boolean
  is_app_admin: boolean
  pending_community_name: string | null
  pending_community_request_id: string | null
  created_at: string
}

export type ProfileSearchResult = {
  id: string
  display_name: string | null
  avatar_url: string | null
  community_id: string | null
  community_name: string | null
  admin: boolean
}

export type MemberProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  community_id: string
  community_name: string | null
  admin: boolean
  created_at: string
}

export type MemberLibrary = {
  member: MemberProfile
  books: Book[]
}

export function searchProfiles(query: string, scope: SearchScope = "community") {
  return apiFetch(
    `/profile/me/search?q=${encodeURIComponent(query)}&scope=${scope}`,
  ) as Promise<ProfileSearchResult[]>
}

export function getProfile() {
  return apiFetch("/profile/me/") as Promise<Profile>
}

export function getMemberLibrary(memberId: string) {
  return apiFetch(`/profile/members/${memberId}`, { cache: "no-store" }) as Promise<MemberLibrary>
}

export function updateProfile(data: Record<string, unknown>) {
  return apiFetch("/profile/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Profile>
}

export function deleteAccount() {
  return apiFetch("/profile/me/", {
    method: "DELETE",
  })
}
