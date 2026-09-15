import { useCallback, useRef, useState } from "react"
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
import { useTranslation } from "@/localization/LanguageContext"

export default function EditBookScreen() {
  const { t } = useTranslation()
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const cachePath = bookId ? `/books/${bookId}` : ""
  const cachedBook = getCachedApiData<Book>(cachePath)
  const [book, setBook] = useState<Book | null>(() => cachedBook ?? null)
  const [loading, setLoading] = useState(() => cachedBook === undefined)
  const hasLoaded = useRef(cachedBook !== undefined)

  const loadBook = useCallback(async () => {
    if (!bookId) return
    try {
      if (!hasLoaded.current) setLoading(true)
      const [{ data }, response] = await Promise.all([
        supabase.auth.getSession(),
        getBook(bookId),
      ])
      if (!data.session || response.owner_id !== data.session.user.id) {
        Alert.alert(t("notAllowed"), t("ownerEditOnly"))
        router.back()
        return
      }
      setBook(response)
      hasLoaded.current = true
    } catch (err) {
      console.error("Failed to load book editor", err)
      Alert.alert(t("error"), t("selectedBookLoadError"))
      if (!hasLoaded.current) router.back()
    } finally {
      hasLoaded.current = true
      setLoading(false)
    }
  }, [bookId, t])

  useFocusEffect(useCallback(() => { loadBook() }, [loadBook]))

  const handleSave = async (
    values: { title: string; author: string; description: string; isbn: string; cover_url: string | null },
    coverAsset: ImagePickerAsset | null,
  ) => {
    if (!bookId || !book) return
    const optimisticBook: Book = {
      ...book,
      title: values.title,
      author: values.author || null,
      description: values.description || null,
      cover_url: coverAsset?.uri ?? values.cover_url,
      isbn: values.isbn || null,
    }
    router.back()
    runInBackground(async () => {
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      return updateBook(bookId, {
        title: values.title,
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
      })
    }, {
      event: "book-updated",
      optimisticResult: { book: optimisticBook, previous: book },
      onError: (err) => {
        console.error("Failed to update book", err)
        Alert.alert(t("changesNotSaved"), err instanceof Error ? err.message : t("updateBookError"))
      },
    })
  }

  const handleDelete = () => {
    if (!bookId || !book) return
    router.replace("/library")
    runInBackground(() => deleteBook(bookId), {
      event: "book-deleted",
      optimisticResult: { book },
      onError: (err) => {
        console.error("Failed to delete book", err)
        Alert.alert(t("bookNotDeleted"), err instanceof Error ? err.message : t("couldNotDeleteBook"))
      },
    })
  }

  const confirmDelete = () => {
    Alert.alert(t("deleteBook"), t("deleteBookConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: handleDelete },
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
