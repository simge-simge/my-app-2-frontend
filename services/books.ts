import { apiFetch } from "./api"

export type BookStatus = "available" | "matched" | "lent"

export type CreateBookInput = {
  title: string
  author?: string | null
  description?: string | null
  isbn?: string | null
  status?: BookStatus
}

export type Book = {
  id: string
  owner_id: string
  community_id: string
  title: string
  author: string | null
  description: string | null
  cover_url: string | null
  isbn: string | null
  status: BookStatus
  created_at: string
}

export function getMyBooks() {
  return apiFetch("/books/me") as Promise<Book[]>
}

export function createBook(data: CreateBookInput) {
  return apiFetch("/books/", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      author: data.author || null,
      description: data.description || null,
      isbn: data.isbn || null,
      status: data.status ?? "available",
    }),
  }) as Promise<Book>
}
