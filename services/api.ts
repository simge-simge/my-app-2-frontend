import { ENV } from "@/config/env"
import { supabase } from "@/utils/supabase"

export async function apiFetch(path: string, options: RequestInit = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

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
    throw new Error(
      `API request failed (${response.status} ${response.statusText})${body ? `: ${body}` : ""}`,
    )
  }

  return response.json()
}
