import { useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import { router } from "expo-router"
import * as ImagePicker from "expo-image-picker"
import type { ImagePickerAsset } from "expo-image-picker"

import AppButton from "@/components/AppButton"
import { createBook, uploadBookCover } from "@/services/books"

export default function NewBookScreen() {
  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [description, setDescription] = useState("")
  const [isbn, setIsbn] = useState("")
  const [coverAsset, setCoverAsset] = useState<ImagePickerAsset | null>(null)
  const [saving, setSaving] = useState(false)

  const storeSelectedImage = (asset: ImagePickerAsset) => {
    setCoverAsset(asset)
    console.log("Selected cover image URI:", asset.uri)
  }

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to choose a cover image.")
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    const selectedAsset = result.assets[0]

    if (selectedAsset?.uri) {
      storeSelectedImage(selectedAsset)
    }
  }

  const handleCaptureImage = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync()

    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to capture a cover image.")
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    })

    if (result.canceled || !result.assets?.length) {
      return
    }

    const selectedAsset = result.assets[0]

    if (selectedAsset?.uri) {
      storeSelectedImage(selectedAsset)
    }
  }

  const handleCoverImage = () => {
    Alert.alert("Cover image", "Choose how to add the cover image.", [
      { text: "Cancel", style: "cancel" },
      { text: "Pick from library", onPress: handlePickFromLibrary },
      { text: "Capture new image", onPress: handleCaptureImage },
    ])
  }

  const handleSave = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      Alert.alert("Missing title", "Please enter a title for the book.")
      return
    }

    try {
      setSaving(true)
      let coverUrl: string | null = null

      if (coverAsset) {
        coverUrl = await uploadBookCover(coverAsset)
        console.log("Uploaded cover image URL:", coverUrl)
      }

      await createBook({
        title: trimmedTitle,
        author: author.trim() || null,
        description: description.trim() || null,
        cover_url: coverUrl,
        isbn: isbn.trim() || null,
      })

      router.replace("/library")
    } catch (err) {
      console.error("Failed to create book", err)
      Alert.alert("Error", "Could not save the book.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Add Book</Text>
        <Text style={styles.subtitle}>Enter the details for the book you want in your library</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Book title"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Author</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder="Author name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>ISBN</Text>
          <TextInput
            style={styles.input}
            value={isbn}
            onChangeText={setIsbn}
            placeholder="ISBN"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Cover Image</Text>
          <Pressable style={styles.coverButton} onPress={handleCoverImage}>
            <Text style={styles.coverButtonText}>Choose or Capture Cover</Text>
          </Pressable>
          {coverAsset?.uri ? <Text style={styles.coverHint}>Selected: {coverAsset.uri}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Short description"
            multiline
            textAlignVertical="top"
          />
        </View>

        <AppButton title="Save Book" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: "#F7F8FC",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    fontSize: 15,
  },
  coverButton: {
    borderWidth: 1,
    borderColor: "#4A6CF7",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#EEF3FF",
    alignItems: "center",
  },
  coverButtonText: {
    color: "#2447D5",
    fontSize: 15,
    fontWeight: "600",
  },
  coverHint: {
    marginTop: 8,
    fontSize: 12,
    color: "#667085",
  },
  descriptionInput: {
    minHeight: 120,
  },
})
