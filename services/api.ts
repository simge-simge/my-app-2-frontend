import { ENV } from "@/config/env"
import { supabase } from "@/utils/supabase"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

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
