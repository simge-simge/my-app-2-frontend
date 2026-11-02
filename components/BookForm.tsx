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
import type { ImagePickerAsset } from "expo-image-picker"

import AppButton from "@/components/AppButton"
import ImageUploadControls from "@/components/ImageUploadControls"
import { layout, palette, radii, typography } from "@/constants/theme"
import type { Book } from "@/services/books"
import { useTranslation } from "@/localization/LanguageContext"

export type BookFormValues = {
  title: string
  author: string
  description: string
  isbn: string
  cover_url: string | null
  status?: "available" | "lent"
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
  const [status, setStatus] = useState<"available" | "lent">(initialBook?.status === "available" ? "available" : "lent")
  const [coverAsset, setCoverAsset] = useState<ImagePickerAsset | null>(null)

  const isEditMode = mode === "edit"

  useEffect(() => {
    setTitle(initialBook?.title ?? initialValues?.title ?? "")
    setAuthor(initialBook?.author ?? initialValues?.author ?? "")
    setDescription(initialBook?.description ?? initialValues?.description ?? "")
    setIsbn(initialBook?.isbn ?? initialValues?.isbn ?? "")
    setCoverUri(initialBook?.cover_url ?? initialValues?.cover_url ?? null)
    setStatus(initialBook?.status === "available" ? "available" : "lent")
    setCoverAsset(null)
  }, [initialBook, initialValues])

  const storeSelectedImage = (asset: ImagePickerAsset) => {
    setCoverAsset(asset)
    setCoverUri(asset.uri)
    console.log("Selected cover image URI:", asset.uri)
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
        status: isEditMode ? status : undefined,
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
          {coverUri ? <Image source={{ uri: coverUri }} style={styles.coverPreview} resizeMode="contain" /> : null}
          <ImageUploadControls disabled={saving} onSelect={storeSelectedImage} />
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

        {isEditMode ? (
          <View style={styles.availabilityCard}>
            <View style={styles.availabilityCopy}>
              <Text style={styles.label}>{t("bookAvailability")}</Text>
              <Text style={styles.helperText}>
                {status === "available" ? t("bookDiscoverable") : t("bookHiddenFromDiscover")}
              </Text>
            </View>
            <Pressable
              accessibilityRole="switch"
              accessibilityState={{ checked: status === "available" }}
              onPress={() => setStatus((value) => value === "available" ? "lent" : "available")}
              style={[styles.availabilityToggle, status === "available" && styles.availabilityToggleOn]}
            >
              <Text style={[styles.availabilityToggleText, status === "available" && styles.availabilityToggleTextOn]}>
                {status === "available" ? t("available") : t("unavailable")}
              </Text>
            </Pressable>
          </View>
        ) : null}

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
  coverPreview: {
    width: 104,
    height: 148,
    borderRadius: radii.sm,
    marginBottom: 12,
    backgroundColor: palette.surfaceMuted,
  },
  descriptionInput: {
    minHeight: 120,
  },
  availabilityCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    marginBottom: 22,
    padding: 14,
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    backgroundColor: palette.surface,
  },
  availabilityCopy: { flex: 1 },
  availabilityToggle: {
    minWidth: 104,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: palette.surfaceMuted,
  },
  availabilityToggleOn: { backgroundColor: palette.successSoft },
  availabilityToggleText: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  availabilityToggleTextOn: { color: palette.success },
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
