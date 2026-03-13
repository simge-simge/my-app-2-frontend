import { useCallback, useState } from "react"
import { Alert } from "react-native"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import type { ImagePickerAsset } from "expo-image-picker"

import BookForm from "@/components/BookForm"
import {
  deleteBook,
  getBook,
  type Book,
  updateBook,
  uploadBookCover,
} from "@/services/books"

export default function EditBookScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()

  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const loadBook = useCallback(async () => {
    if (!bookId) {
      return
    }

    try {
      setLoading(true)
      const response = await getBook(bookId)
      setBook(response)
    } catch (err) {
      console.error("Failed to load book", err)
      Alert.alert("Error", "Could not load the selected book.")
      router.back()
    } finally {
      setLoading(false)
    }
  }, [bookId])

  useFocusEffect(
    useCallback(() => {
      loadBook()
    }, [loadBook])
  )

  const handleSave = async (
    values: {
      title: string
      author: string
      description: string
      isbn: string
      cover_url: string | null
    },
    coverAsset: ImagePickerAsset | null
  ) => {
    if (!bookId) {
      return
    }

    try {
      setSaving(true)
      let coverUrl = values.cover_url

      if (coverAsset) {
        coverUrl = await uploadBookCover(coverAsset)
      }

      await updateBook(bookId, {
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
        status: book?.status ?? "available",
      })

      router.replace("/library")
    } catch (err) {
      console.error("Failed to update book", err)
      Alert.alert("Error", err instanceof Error ? err.message : "Could not update the book.")
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = () => {
    Alert.alert("Delete book", "Remove this book from your library?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: handleDelete,
      },
    ])
  }

  const handleDelete = async () => {
    if (!bookId) {
      return
    }

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
