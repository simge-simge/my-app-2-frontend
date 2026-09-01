import { useEffect, useState } from "react"
import {
  Alert,
  Image,
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
import WebCameraCapture from "@/components/WebCameraCapture"
import WebImageCropper from "@/components/WebImageCropper"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import type { Book } from "@/services/books"
import { useTranslation } from "@/localization/LanguageContext"

export type BookFormValues = {
  title: string
  author: string
  description: string
  isbn: string
  cover_url: string | null
}

type Props = {
  mode: "create" | "edit"
  initialBook?: Book
  initialValues?: Partial<BookFormValues>
  loading?: boolean
  saving?: boolean
  deleting?: boolean
  onSave: (values: BookFormValues, coverAsset: ImagePickerAsset | null) => Promise<void>
  onDelete?: () => void
}

export default function BookForm({
  mode,
  initialBook,
  initialValues,
  loading = false,
  saving = false,
  deleting = false,
  onSave,
  onDelete,
}: Props) {
  const { t } = useTranslation()
  const [title, setTitle] = useState(initialBook?.title ?? initialValues?.title ?? "")
  const [author, setAuthor] = useState(initialBook?.author ?? initialValues?.author ?? "")
  const [description, setDescription] = useState(initialBook?.description ?? initialValues?.description ?? "")
  const [isbn, setIsbn] = useState(initialBook?.isbn ?? initialValues?.isbn ?? "")
  const [coverUri, setCoverUri] = useState(initialBook?.cover_url ?? initialValues?.cover_url ?? null)
  const [coverAsset, setCoverAsset] = useState<ImagePickerAsset | null>(null)
  const [coverCameraOpen, setCoverCameraOpen] = useState(false)
  const [webCropAsset, setWebCropAsset] = useState<ImagePickerAsset | null>(null)

  const isEditMode = mode === "edit"

  useEffect(() => {
    setTitle(initialBook?.title ?? initialValues?.title ?? "")
    setAuthor(initialBook?.author ?? initialValues?.author ?? "")
    setDescription(initialBook?.description ?? initialValues?.description ?? "")
    setIsbn(initialBook?.isbn ?? initialValues?.isbn ?? "")
    setCoverUri(initialBook?.cover_url ?? initialValues?.cover_url ?? null)
    setCoverAsset(null)
    setWebCropAsset(null)
    setCoverCameraOpen(false)
  }, [initialBook, initialValues])

  const storeSelectedImage = (asset: ImagePickerAsset) => {
    setCoverAsset(asset)
    setCoverUri(asset.uri)
    console.log("Selected cover image URI:", asset.uri)
  }

  const editOrStoreSelectedImage = (asset: ImagePickerAsset) => {
    if (Platform.OS === "web") {
      setWebCropAsset(asset)
      return
    }
    storeSelectedImage(asset)
  }

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(t("permissionNeeded"), t("allowPhotoCover"))
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
      editOrStoreSelectedImage(selectedAsset)
    }
  }

  const handleCaptureImage = async () => {
    if (Platform.OS === "web") {
      setCoverCameraOpen(true)
      return
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(t("permissionNeeded"), t("allowCameraCover"))
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
      editOrStoreSelectedImage(selectedAsset)
    }
  }

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      Alert.alert(t("missingTitle"), t("enterBookTitle"))
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
        <Text style={styles.loadingText}>{t("loadingBook")}</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <WebImageCropper
        asset={webCropAsset}
        onCancel={() => setWebCropAsset(null)}
        onComplete={(asset) => {
          storeSelectedImage(asset)
          setWebCropAsset(null)
        }}
      />
      <WebCameraCapture
        visible={coverCameraOpen}
        onCancel={() => setCoverCameraOpen(false)}
        onCapture={(asset) => {
          setCoverCameraOpen(false)
          editOrStoreSelectedImage(asset)
        }}
      />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{isEditMode ? t("editBook") : t("addBook")}</Text>
        <Text style={styles.subtitle}>
          {isEditMode
            ? t("editBookSubtitle")
            : t("addBookSubtitle")}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t("titleLabel")}</Text>
          <TextInput
            style={[styles.input, isEditMode && styles.inputDisabled]}
            value={title}
            onChangeText={setTitle}
            placeholder={t("bookTitlePlaceholder")}
            editable={!isEditMode}
          />
          {isEditMode ? <Text style={styles.helperText}>{t("titleCannotChange")}</Text> : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("author")}</Text>
          <TextInput
            style={styles.input}
            value={author}
            onChangeText={setAuthor}
            placeholder={t("authorName")}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("isbn")}</Text>
          <TextInput
            style={styles.input}
            value={isbn}
            onChangeText={setIsbn}
            placeholder="ISBN"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("coverImage")}</Text>
          {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverPreview} resizeMode="cover" /> : null}
          <View style={styles.coverActions}>
            <Pressable accessibilityRole="button" style={[styles.coverButton, styles.coverPickerButton]} onPress={() => void handlePickFromLibrary()}>
              <Text style={styles.coverButtonText}>{t("pickFromLibrary")}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" style={[styles.coverButton, styles.coverPickerButton]} onPress={() => void handleCaptureImage()}>
              <Text style={styles.coverButtonText}>{t("captureNewImage")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t("description")}</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder={t("shortDescription")}
            multiline
            textAlignVertical="top"
          />
        </View>

        <AppButton
          title={isEditMode ? t("saveChanges") : t("saveBook")}
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
            <Text style={styles.deleteButtonText}>{deleting ? t("deleting") : t("deleteBook")}</Text>
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
  coverActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  coverPickerButton: {
    minHeight: 40,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  coverPreview: {
    width: 104,
    height: 148,
    borderRadius: radii.sm,
    marginBottom: 12,
    backgroundColor: palette.surfaceMuted,
  },
  coverButtonText: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
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
