import { apiFetch } from "./api"

export type MatchBook = {
  id: string
  title: string
  author?: string | null
  description?: string | null
  cover_url: string | null
  isbn?: string | null
  status?: string
  created_at?: string
}

export type MatchUser = {
  id: string
  display_name: string | null
  avatar_url: string | null
  community_id?: string | null
  admin: boolean
  created_at?: string
}

export type MatchContacts = {
  email?: string
  phone?: string
  instagram?: string
  telegram?: string
}

export type Match = {
  match_id: string
  created_at: string
  my_book: MatchBook
  their_book: MatchBook
  other_user: MatchUser
  revealed: boolean
  my_revealed: boolean
  their_revealed: boolean
  contacts: MatchContacts | null
}

export type RevealMatchResponse = {
  match: {
    id: string
    revealed_by_a: boolean
    revealed_by_b: boolean
  }
  contacts: MatchContacts | null
}

export function getMatches() {
  return apiFetch("/matches/") as Promise<Match[]>
}

export function getMatch(matchId: string) {
  return apiFetch(`/matches/${matchId}`) as Promise<Match>
}

export function revealMatchContact(matchId: string) {
  return apiFetch(`/matches/${matchId}/reveal`, {
    method: "PATCH",
  }) as Promise<RevealMatchResponse>
}

export function deleteMatch(matchId: string) {
  return apiFetch(`/matches/${matchId}`, {
    method: "DELETE",
  }) as Promise<{ message: string }>
}
