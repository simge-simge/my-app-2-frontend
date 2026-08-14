import { apiFetch } from "./api"

export type Location = {
  id: string
  name: string
  display_name: string
  type: "country" | "city" | "district"
  parent_id: string | null
  country_code: string
}

export function searchLocations(query: string) {
  return apiFetch(`/locations?q=${encodeURIComponent(query.trim())}`, {
    cache: "no-store",
  }) as Promise<Location[]>
}
