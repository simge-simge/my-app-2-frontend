import type { Book } from "@/services/books"
import type { Match } from "@/services/matches"

export const book = (overrides: Partial<Book> = {}): Book => ({
  id: "10000000-0000-0000-0000-000000000001",
  owner_id: "20000000-0000-0000-0000-000000000002",
  community_id: "30000000-0000-0000-0000-000000000001",
  title: "The Left Hand of Darkness",
  author: "Ursula K. Le Guin",
  description: "A science-fiction classic.",
  cover_url: null,
  isbn: "9780441478125",
  status: "available",
  created_at: "2026-01-02T12:00:00Z",
  ...overrides,
})

export const match = (overrides: Partial<Match> = {}): Match => ({
  match_id: "40000000-0000-0000-0000-000000000001",
  created_at: "2026-01-02T12:00:00Z",
  my_book: { id: "book-a", title: "My Book", cover_url: null },
  their_book: { id: "book-b", title: "Their Book", cover_url: null },
  other_user: { id: "user-b", display_name: "Ada Reader", avatar_url: null, admin: false },
  revealed: false,
  my_revealed: false,
  their_revealed: false,
  contacts: null,
  ...overrides,
})
