import { apiFetch } from "./api"
import type { Location } from "./locations"

export type CommunityAdminResult = {
  id: string
  name: string
  location_id: string
  location?: Location
  admin: {
    id: string
    display_name: string | null
  }
}

export function createCommunity(data: {
  name: string
  location_id: string
  admin_email: string
}) {
  return apiFetch("/admin/communities", {
    method: "POST",
    body: JSON.stringify(data),
  }) as Promise<CommunityAdminResult>
}

export function assignCommunityAdmin(communityId: string, adminEmail: string) {
  return apiFetch(`/admin/communities/${communityId}/admins`, {
    method: "PUT",
    body: JSON.stringify({ admin_email: adminEmail }),
  }) as Promise<CommunityAdminResult>
}
