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
import { runInBackground } from "@/utils/backgroundAction"

export default function EditBookScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const cachePath = bookId ? `/books/${bookId}` : ""
  const cachedBook = getCachedApiData<Book>(cachePath)
  const [book, setBook] = useState<Book | null>(() => cachedBook ?? null)
  const [loading, setLoading] = useState(true)

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
    router.back()
    runInBackground(async () => {
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      return updateBook(bookId, {
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
        status: book.status,
      })
    }, {
      event: "books",
      onError: (err) => {
        console.error("Failed to update book", err)
        Alert.alert("Changes were not saved", err instanceof Error ? err.message : "Could not update the book.")
      },
    })
  }

  const handleDelete = () => {
    if (!bookId) return
    router.replace("/library")
    runInBackground(() => deleteBook(bookId), {
      event: "books",
      onError: (err) => {
        console.error("Failed to delete book", err)
        Alert.alert("Book was not deleted", err instanceof Error ? err.message : "Could not delete the book.")
      },
    })
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
      onSave={handleSave}
      onDelete={confirmDelete}
    />
  )
}
