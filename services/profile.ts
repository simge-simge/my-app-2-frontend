import { apiFetch } from "./api"

export function getProfile() {
  return apiFetch("/profile/me/")
}

export function updateProfile(data: any) {
  return apiFetch("/profile/me/", {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export function deleteAccount() {
  return apiFetch("/profile/me/", {
    method: "DELETE",
  })
}