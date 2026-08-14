import { Alert } from "react-native"
import { router } from "expo-router"
import type { ImagePickerAsset } from "expo-image-picker"

import BookForm from "@/components/BookForm"
import { createBook, uploadBookCover } from "@/services/books"
import { runInBackground } from "@/utils/backgroundAction"

export default function NewBookScreen() {
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
    router.back()
    runInBackground(async () => {
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      return createBook({
        title: values.title,
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
      })
    }, {
      event: "books",
      onError: (err) => {
        console.error("Failed to create book", err)
        Alert.alert("Book was not saved", err instanceof Error ? err.message : "Could not save the book.")
      },
    })
  }

  return <BookForm mode="create" onSave={handleSave} />
}
