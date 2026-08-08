import { useCallback, useState } from "react"
import { Alert } from "react-native"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import type { ImagePickerAsset } from "expo-image-picker"

import BookForm from "@/components/BookForm"
import { getCachedApiData } from "@/services/api"
import {
  deleteBook,
  getBook,
  type Book,
  updateBook,
  uploadBookCover,
} from "@/services/books"
import { supabase } from "@/utils/supabase"

export default function EditBookScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const cachePath = bookId ? `/books/${bookId}` : ""
  const cachedBook = getCachedApiData<Book>(cachePath)
  const [book, setBook] = useState<Book | null>(() => cachedBook ?? null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadBook = useCallback(async () => {
    if (!bookId) return
    try {
      setLoading(true)
      const [{ data }, response] = await Promise.all([
        supabase.auth.getSession(),
        getBook(bookId),
      ])
      if (!data.session || response.owner_id !== data.session.user.id) {
        Alert.alert("Not allowed", "Only the book owner can edit this book.")
        router.back()
        return
      }
      setBook(response)
    } catch (err) {
      console.error("Failed to load book editor", err)
      Alert.alert("Error", "Could not load the selected book.")
      router.back()
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useFocusEffect(useCallback(() => { loadBook() }, [loadBook]))

  const handleSave = async (
    values: { title: string; author: string; description: string; isbn: string; cover_url: string | null },
    coverAsset: ImagePickerAsset | null,
  ) => {
    if (!bookId || !book) return
    try {
      setSaving(true)
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      await updateBook(bookId, {
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
        status: book.status,
      })
      router.back()
    } catch (err) {
      console.error("Failed to update book", err)
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update the book.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!bookId) return
    try {
      setDeleting(true)
      await deleteBook(bookId)
      router.replace("/library")
    } catch (err) {
      console.error("Failed to delete book", err)
      Alert.alert("Error", err instanceof Error ? err.message : "Could not delete the book.")
    } finally {
      setDeleting(false)
    }
  }

  const confirmDelete = () => {
    Alert.alert("Delete book", "Remove this book from your library?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: handleDelete },
    ])
  }

  return (
    <BookForm
      mode="edit"
      initialBook={book ?? undefined}
      loading={loading}
      saving={saving}
      deleting={deleting}
      onSave={handleSave}
      onDelete={confirmDelete}
    />
  )
}
