import type { ImagePickerAsset } from "expo-image-picker"
import { File } from "expo-file-system"

import { supabase } from "@/utils/supabase"

import { apiFetch } from "./api"

export type BookStatus = "available" | "matched" | "lent"

export type CreateBookInput = {
  title: string
  author?: string | null
  description?: string | null
  cover_url?: string | null
  isbn?: string | null
  status?: BookStatus
}

export type UpdateBookInput = {
  author?: string | null
  description?: string | null
  cover_url?: string | null
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

export function getBook(bookId: string) {
  return apiFetch(`/books/${bookId}`) as Promise<Book>
}

export function createBook(data: CreateBookInput) {
  return apiFetch("/books/", {
    method: "POST",
    body: JSON.stringify({
      title: data.title,
      author: data.author || null,
      description: data.description || null,
      cover_url: data.cover_url || null,
      isbn: data.isbn || null,
      status: data.status ?? "available",
    }),
  }) as Promise<Book>
}

export function updateBook(bookId: string, data: UpdateBookInput) {
  return apiFetch(`/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify({
      author: data.author || null,
      description: data.description || null,
      cover_url: data.cover_url || null,
      isbn: data.isbn || null,
      status: data.status ?? "available",
    }),
  }) as Promise<Book>
}

export function deleteBook(bookId: string) {
  return apiFetch(`/books/${bookId}`, {
    method: "DELETE",
  }) as Promise<{ message: string }>
}

function getFileExtension(asset: ImagePickerAsset) {
  if (asset.fileName?.includes(".")) {
    return asset.fileName.split(".").pop()?.toLowerCase() || "jpg"
  }

  if (asset.mimeType?.includes("/")) {
    return asset.mimeType.split("/").pop()?.toLowerCase() || "jpg"
  }

  return "jpg"
}

function buildCoverPath(asset: ImagePickerAsset) {
  const sessionId = supabase.auth.getSession()

  return sessionId.then(({ data }) => {
    const userId = data.session?.user.id ?? "anonymous"
    const extension = getFileExtension(asset)
    return `${userId}/${Date.now()}.${extension}`
  })
}

export async function uploadBookCover(asset: ImagePickerAsset) {
  const fileBytes = await new File(asset.uri).bytes()
  const filePath = await buildCoverPath(asset)

  const { error } = await supabase.storage
    .from("book_covers")
    .upload(filePath, fileBytes, {
      contentType: asset.mimeType ?? "image/jpeg",
      upsert: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from("book_covers").getPublicUrl(filePath)
  return data.publicUrl
}
