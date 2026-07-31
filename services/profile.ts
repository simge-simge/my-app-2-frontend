import { apiFetch } from "./api"

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

export function getProfile() {
  return apiFetch("/profile/me/") as Promise<Profile>
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
