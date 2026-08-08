import { useEffect, useState } from "react"
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
import * as ImagePicker from "expo-image-picker"
import type { ImagePickerAsset } from "expo-image-picker"

import AppButton from "@/components/AppButton"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import type { Book } from "@/services/books"

type BookFormValues = {
  title: string
  author: string
  description: string
  isbn: string
  cover_url: string | null
}

type Props = {
  mode: "create" | "edit"
  initialBook?: Book
  loading?: boolean
  saving?: boolean
  deleting?: boolean
  onSave: (values: BookFormValues, coverAsset: ImagePickerAsset | null) => Promise<void>
  onDelete?: () => void
}

export default function BookForm({
  mode,
  initialBook,
  loading = false,
  saving = false,
  deleting = false,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(initialBook?.title ?? "")
  const [author, setAuthor] = useState(initialBook?.author ?? "")
  const [description, setDescription] = useState(initialBook?.description ?? "")
  const [isbn, setIsbn] = useState(initialBook?.isbn ?? "")
  const [coverUri, setCoverUri] = useState(initialBook?.cover_url ?? null)
  const [coverAsset, setCoverAsset] = useState<ImagePickerAsset | null>(null)

  const isEditMode = mode === "edit"

  useEffect(() => {
    setTitle(initialBook?.title ?? "")
    setAuthor(initialBook?.author ?? "")
    setDescription(initialBook?.description ?? "")
    setIsbn(initialBook?.isbn ?? "")
    setCoverUri(initialBook?.cover_url ?? null)
    setCoverAsset(null)
  }, [initialBook])

  const storeSelectedImage = (asset: ImagePickerAsset) => {
    setCoverAsset(asset)
    setCoverUri(asset.uri)
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

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      Alert.alert("Missing title", "Please enter a title for the book.")
      return
    }

    await onSave(
      {
        title: trimmedTitle,
        author: author.trim(),
        description: description.trim(),
        isbn: isbn.trim(),
        cover_url: coverAsset ? null : coverUri,
      },
      coverAsset
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading book...</Text>
      </View>
    )
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
        <Text style={styles.title}>{isEditMode ? "Edit Book" : "Add Book"}</Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? "Update your book details or remove it from your library"
            : "Enter the details for the book you want in your library"}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, isEditMode && styles.inputDisabled]}
            value={title}
            onChangeText={setTitle}
            placeholder="Book title"
            editable={!isEditMode}
          />
          {isEditMode ? <Text style={styles.helperText}>Title cannot be changed.</Text> : null}
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
          {coverUri ? <Text style={styles.coverHint}>Selected: {coverUri}</Text> : null}
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

        <AppButton
          title={isEditMode ? "Save Changes" : "Save Book"}
          onPress={handleSubmit}
          loading={saving}
        />

        {isEditMode && onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: deleting, busy: deleting }}
            style={styles.deleteButton}
            onPress={onDelete}
            disabled={deleting}
          >
            <Text style={styles.deleteButtonText}>{deleting ? "Deleting..." : "Delete Book"}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
    width: "100%",
    maxWidth: layout.formMax,
    alignSelf: "center",
  },
  title: {
    fontFamily: typography.serif,
    fontSize: 30,
    fontWeight: "700",
    color: palette.text,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textMuted,
    marginTop: 6,
    marginBottom: 24,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.ink,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: palette.surface,
    fontSize: 15,
    color: palette.text,
  },
  inputDisabled: {
    backgroundColor: palette.surfaceMuted,
    color: palette.textMuted,
  },
  helperText: {
    marginTop: 8,
    fontSize: 12,
    color: palette.textMuted,
  },
  coverButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  coverButtonText: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  coverHint: {
    marginTop: 8,
    fontSize: 12,
    color: palette.textMuted,
  },
  descriptionInput: {
    minHeight: 120,
  },
  deleteButton: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    paddingVertical: 14,
  },
  deleteButtonText: {
    color: palette.danger,
    fontSize: 16,
    fontWeight: "600",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  loadingText: {
    fontSize: 16,
    color: palette.textMuted,
  },
})
