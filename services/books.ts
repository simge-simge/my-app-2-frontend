import type { ImagePickerAsset } from "expo-image-picker"
import * as ImageManipulator from "expo-image-manipulator"
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
}

export type UpdateBookInput = {
  title?: string
  author?: string | null
  description?: string | null
  cover_url?: string | null
  isbn?: string | null
}

export type Book = {
  id: string
  owner_id: string
  owner_name?: string | null
  owner_admin?: boolean
  community_id: string
  community_name?: string | null
  borrow_requested?: boolean
  title: string
  author: string | null
  description: string | null
  cover_url: string | null
  isbn: string | null
  status: BookStatus
  created_at: string
}

export function getMyBooks() {
  return apiFetch("/books/me", { cache: "no-store" }) as Promise<Book[]>
}

export type IsbnBookLookup = Pick<
  Book,
  "title" | "author" | "description" | "cover_url" | "isbn"
>

export type ShelfBookCandidate = IsbnBookLookup & {
  language?: string | null
  raw_spine_text: string | null
  confidence: number
  catalog_matched: boolean
}

export type BulkCreateBooksResult = {
  created: Book[]
  skipped_duplicates: number
}

export type ShelfScanJobStatus = "queued" | "processing" | "completed" | "failed"

export type ShelfScanJob = {
  id: string
  status: ShelfScanJobStatus
  books: ShelfBookCandidate[]
  error: string | null
  created_at: string
}

export function lookupBookByIsbn(isbn: string) {
  return apiFetch(`/books/isbn/${encodeURIComponent(isbn)}`, {
    cache: "no-store",
  }) as Promise<IsbnBookLookup>
}

export function getBookFeed() {
  return apiFetch("/books/feed") as Promise<Book[]>
}

export type SearchScope = "community" | "all"

export function searchBooks(query: string, scope: SearchScope = "community") {
  return apiFetch(
    `/books/search?q=${encodeURIComponent(query)}&scope=${scope}`,
  ) as Promise<Book[]>
}

export function requestToBorrowBook(bookId: string) {
  return apiFetch(`/books/${bookId}/borrow-request`, {
    method: "POST",
  }) as Promise<{ message: string; request_id: string }>
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
    }),
  }) as Promise<Book>
}

export function updateBook(bookId: string, data: UpdateBookInput) {
  return apiFetch(`/books/${bookId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }) as Promise<Book>
}

export async function startShelfScan(asset: ImagePickerAsset) {
  const longestSide = Math.max(asset.width ?? 0, asset.height ?? 0)
  const actions: ImageManipulator.Action[] = []

  if (longestSide > 2048) {
    actions.push(asset.width >= asset.height
      ? { resize: { width: 2048 } }
      : { resize: { height: 2048 } })
  }

  const image = await ImageManipulator.manipulateAsync(asset.uri, actions, {
    base64: true,
    compress: 0.82,
    format: ImageManipulator.SaveFormat.JPEG,
  })

  if (!image.base64) throw new Error("Could not read that photo. Please try another one.")

  return apiFetch("/books/shelf-scan", {
    method: "POST",
    body: JSON.stringify({ image_base64: image.base64, mime_type: "image/jpeg" }),
  }) as Promise<Pick<ShelfScanJob, "id" | "status">>
}

export function getShelfScanJob(jobId: string) {
  return apiFetch(`/books/shelf-scan/${encodeURIComponent(jobId)}`, {
    cache: "no-store",
  }) as Promise<ShelfScanJob>
}

export function deleteShelfScanJob(jobId: string) {
  return apiFetch(`/books/shelf-scan/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  }) as Promise<{ message: string }>
}

export function bulkCreateBooks(books: CreateBookInput[]) {
  return apiFetch("/books/bulk", {
    method: "POST",
    body: JSON.stringify({ books }),
  }) as Promise<BulkCreateBooksResult>
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
