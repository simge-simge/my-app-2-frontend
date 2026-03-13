import { Alert } from "react-native"
import { router } from "expo-router"
import type { ImagePickerAsset } from "expo-image-picker"

import BookForm from "@/components/BookForm"
import { createBook, uploadBookCover } from "@/services/books"

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
    try {
      let coverUrl = values.cover_url

      if (coverAsset) {
        coverUrl = await uploadBookCover(coverAsset)
      }

      await createBook({
        title: values.title,
        author: values.author || null,
        description: values.description || null,
        cover_url: coverUrl,
        isbn: values.isbn || null,
      })

      router.replace("/library")
    } catch (err) {
      console.error("Failed to create book", err)
      Alert.alert("Error", err instanceof Error ? err.message : "Could not save the book.")
    }
  }

  return <BookForm mode="create" onSave={handleSave} />
}
