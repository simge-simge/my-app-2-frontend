import { useEffect, useState } from "react"
import {
  ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import AsyncStorage from "@react-native-async-storage/async-storage"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { ApiError } from "@/services/api"
import {
  bulkCreateBooks, deleteShelfScanJob, getShelfScanJob, startShelfScan, type ShelfBookCandidate,
} from "@/services/books"
import { useTranslation } from "@/localization/LanguageContext"
import { ACTIVE_SHELF_SCAN_JOB_KEY } from "@/utils/storageKeys"
import WebCameraCapture from "@/components/WebCameraCapture"
import WebImageCropper from "@/components/WebImageCropper"

type ReviewBook = ShelfBookCandidate & { key: string; selected: boolean }

export default function ShelfScanScreen() {
  const { language, t } = useTranslation()
  const analysisStages = [
    { title: t("readingSpines"), detail: t("findingTitlesAuthors") },
    { title: t("matchingTitles"), detail: t("checkingCatalog") },
    { title: t("preparingReview"), detail: t("largerShelfWait") },
  ]
  const [photoUri, setPhotoUri] = useState<string | null>(null)
  const [photoAsset, setPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [webCropAsset, setWebCropAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [webCameraOpen, setWebCameraOpen] = useState(false)
  const [books, setBooks] = useState<ReviewBook[]>([])
  const [jobId, setJobId] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisStage, setAnalysisStage] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void AsyncStorage.getItem(ACTIVE_SHELF_SCAN_JOB_KEY).then((storedJobId) => {
      if (!active || !storedJobId) return
      setJobId(storedJobId)
      setAnalyzing(true)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!jobId) return
    let active = true
    let pollTimer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      try {
        const job = await getShelfScanJob(jobId)
        if (!active) return
        if (job.status === "queued" || job.status === "processing") {
          setAnalyzing(true)
          pollTimer = setTimeout(() => void poll(), 2_000)
          return
        }
        if (job.status === "failed") {
          setAnalyzing(false)
          setJobId(null)
          setError(job.error || t("shelfAnalyzeError"))
          await AsyncStorage.removeItem(ACTIVE_SHELF_SCAN_JOB_KEY)
          return
        }

        const suggestions = job.books.map((book, index) => ({
          ...book,
          key: `${index}-${book.title}`,
          selected: true,
        }))
        setBooks(suggestions)
        setAnalyzing(false)
        if (!suggestions.length) {
          setJobId(null)
          setError(t("noReadableSpines"))
          await AsyncStorage.removeItem(ACTIVE_SHELF_SCAN_JOB_KEY)
        }
      } catch (reason) {
        if (!active) return
        if (reason instanceof ApiError && reason.status === 404) {
          setAnalyzing(false)
          setJobId(null)
          setError(t("shelfScanExpired"))
          await AsyncStorage.removeItem(ACTIVE_SHELF_SCAN_JOB_KEY)
          return
        }
        setAnalyzing(true)
        setError(t("shelfScanRetrying"))
        pollTimer = setTimeout(() => void poll(), 5_000)
      }
    }

    void poll()
    return () => {
      active = false
      if (pollTimer) clearTimeout(pollTimer)
    }
  }, [jobId, t])

  useEffect(() => {
    if (!analyzing) {
      setAnalysisStage(0)
      return
    }

    const matchingTimer = setTimeout(() => setAnalysisStage(1), 7_000)
    const reviewTimer = setTimeout(() => setAnalysisStage(2), 18_000)
    return () => {
      clearTimeout(matchingTimer)
      clearTimeout(reviewTimer)
    }
  }, [analyzing])

  const analyze = async (asset: ImagePicker.ImagePickerAsset) => {
    setBooks([])
    setError(null)
    setAnalysisStage(0)
    setAnalyzing(true)
    try {
      const job = await startShelfScan(asset)
      await AsyncStorage.setItem(ACTIVE_SHELF_SCAN_JOB_KEY, job.id)
      setJobId(job.id)
    } catch (reason) {
      setAnalyzing(false)
      setError(reason instanceof Error ? reason.message : t("shelfAnalyzeError"))
    }
  }

  const selectPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    setPhotoAsset(asset)
    setPhotoUri(asset.uri)
    setBooks([])
    setError(null)
  }

  const editOrSelectPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    if (Platform.OS === "web") {
      setWebCropAsset(asset)
      return
    }
    selectPhoto(asset)
  }

  const takePhoto = async () => {
    if (Platform.OS === "web") {
      setWebCameraOpen(true)
      return
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t("cameraAccessNeeded"), t("allowShelfCamera"))
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    })
    if (!result.canceled && result.assets[0]) editOrSelectPhoto(result.assets[0])
  }

  const choosePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert(t("photoAccessNeeded"), t("allowShelfPhoto"))
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    })
    if (!result.canceled && result.assets[0]) editOrSelectPhoto(result.assets[0])
  }

  const updateBook = (key: string, changes: Partial<ReviewBook>) => {
    setBooks((current) => current.map((book) => book.key === key ? { ...book, ...changes } : book))
  }

  const selectedBooks = books.filter((book) => book.selected && book.title.trim())

  const saveBooks = async () => {
    if (!selectedBooks.length) {
      Alert.alert(t("chooseOneBook"), t("chooseDetectedBook"))
      return
    }
    setSaving(true)
    try {
      const result = await bulkCreateBooks(selectedBooks.map((book) => ({
        title: book.title.trim(),
        author: book.author?.trim() || null,
        description: book.description,
        cover_url: book.cover_url,
        isbn: book.isbn,
      })))
      const skipped = result.skipped_duplicates
        ? t(result.skipped_duplicates === 1 ? "duplicateSkipped" : "duplicatesSkipped", { count: result.skipped_duplicates })
        : ""
      Alert.alert(t("shelfAdded"), t(result.created.length === 1 ? "bookAddedCount" : "booksAddedCount", { count: result.created.length, skipped }))
      if (jobId) {
        try {
          await deleteShelfScanJob(jobId)
        } catch (cleanupError) {
          console.warn("Imported shelf scan job could not be removed", cleanupError)
        }
      }
      await AsyncStorage.removeItem(ACTIVE_SHELF_SCAN_JOB_KEY)
      setJobId(null)
      router.replace("/library")
    } catch (reason) {
      Alert.alert(t("booksNotAdded"), reason instanceof Error ? reason.message : t("tryAgain"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <WebImageCropper
        asset={webCropAsset}
        purpose="shelf"
        onCancel={() => setWebCropAsset(null)}
        onComplete={(asset) => {
          selectPhoto(asset)
          setWebCropAsset(null)
        }}
      />
      <WebCameraCapture
        visible={webCameraOpen}
        onCancel={() => setWebCameraOpen(false)}
        onCapture={(asset) => {
          setWebCameraOpen(false)
          editOrSelectPhoto(asset)
        }}
      />
      <Text style={styles.eyebrow}>{t("quickImport").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}</Text>
      <Text style={styles.title}>{t("shelfListTitle")}</Text>
      <Text style={styles.subtitle}>{t("shelfPhotoHint")}</Text>

      {!photoUri ? (
        <View style={styles.guideCard}>
          <View style={styles.guideIcon}><Ionicons name="library-outline" size={34} color={palette.accentDark} /></View>
          <Text style={styles.guideTitle}>{t("readyShelfPhoto")}</Text>
          <Text style={styles.guideText}>{t("shelfReviewHint")}</Text>
        </View>
      ) : (
        <Image source={{ uri: photoUri }} accessibilityLabel={t("selectedShelf")} resizeMode="cover" style={styles.preview} />
      )}

      <View style={styles.photoActions}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("takeShelfPhoto")} disabled={analyzing || saving} onPress={() => void takePhoto()} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Ionicons name="camera-outline" size={20} color={palette.paper} />
          <Text style={styles.primaryButtonText}>{photoUri ? t("retake") : t("takePhoto")}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t("chooseShelfPhoto")} disabled={analyzing || saving} onPress={() => void choosePhoto()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Ionicons name="images-outline" size={20} color={palette.accentDark} />
          <Text style={styles.secondaryButtonText}>{t("choosePhoto")}</Text>
        </Pressable>
      </View>

      {photoAsset && !analyzing && !books.length ? (
        <Pressable accessibilityRole="button" accessibilityLabel={t("submitShelfPhoto")} onPress={() => void analyze(photoAsset)} style={({ pressed }) => [styles.submitButton, pressed && styles.pressed]}>
          <Ionicons name="sparkles-outline" size={20} color={palette.paper} />
          <Text style={styles.submitButtonText}>{t("submitPhoto")}</Text>
        </Pressable>
      ) : null}

      <View style={styles.privacyNote}>
        <Ionicons name="shield-checkmark-outline" size={18} color={palette.success} />
        <Text style={styles.privacyText}>{t("shelfPhotoPrivacy")}</Text>
      </View>

      {analyzing ? (
        <View>
          <View accessibilityRole="progressbar" style={styles.statusCard}>
            <ActivityIndicator color={palette.accent} />
            <View style={styles.statusCopy}>
              <Text accessibilityLiveRegion="polite" style={styles.statusTitle}>{analysisStages[analysisStage].title}</Text>
              <Text style={styles.statusText}>{analysisStages[analysisStage].detail}</Text>
            </View>
          </View>
          <Text style={styles.leaveNote}>{t("shelfScanLeaveHint")}</Text>
        </View>
      ) : null}

      {error && !analyzing ? (
        <View style={styles.errorCard}><Ionicons name="alert-circle-outline" size={22} color={palette.danger} /><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {books.length ? (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <View><Text style={styles.resultsTitle}>{t(books.length === 1 ? "reviewSuggestion" : "reviewSuggestions", { count: books.length })}</Text><Text style={styles.resultsSubtitle}>{t("correctSuggestions")}</Text></View>
            <Text style={styles.selectedCount}>{t("selectedCount", { count: selectedBooks.length })}</Text>
          </View>

          {books.map((book, index) => (
            <View key={book.key} style={[styles.bookCard, !book.selected && styles.bookCardMuted]}>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: book.selected }} accessibilityLabel={t("includeNamed", { name: book.title })} onPress={() => updateBook(book.key, { selected: !book.selected })} style={[styles.checkbox, book.selected && styles.checkboxSelected]}>
                {book.selected ? <Ionicons name="checkmark" size={17} color={palette.paper} /> : null}
              </Pressable>
              <View style={styles.bookFields}>
                <View style={styles.bookMeta}>
                  <Text style={styles.bookNumber}>{t("bookNumber", { count: index + 1 }).toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}</Text>
                  <Text style={[styles.matchBadge, !book.catalog_matched && styles.readBadge]}>{book.catalog_matched ? t("catalogMatch").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US") : t("readConfidence", { count: Math.round(book.confidence * 100) }).toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}</Text>
                </View>
                <TextInput accessibilityLabel={`${t("titleLabel")} ${index + 1}`} value={book.title} editable={book.selected} onChangeText={(title) => updateBook(book.key, { title })} placeholder={t("bookTitlePlaceholder")} placeholderTextColor={palette.textMuted} style={styles.titleInput} />
                <TextInput accessibilityLabel={`${t("author")} ${index + 1}`} value={book.author ?? ""} editable={book.selected} onChangeText={(author) => updateBook(book.key, { author })} placeholder={t("authorOptional")} placeholderTextColor={palette.textMuted} style={styles.authorInput} />
              </View>
            </View>
          ))}

          <Pressable accessibilityRole="button" accessibilityLabel={t(selectedBooks.length === 1 ? "addBookCount" : "addBooksCount", { count: selectedBooks.length })} disabled={saving || !selectedBooks.length} onPress={() => void saveBooks()} style={({ pressed }) => [styles.saveButton, (saving || !selectedBooks.length) && styles.disabled, pressed && styles.pressed]}>
            {saving ? <ActivityIndicator color={palette.paper} /> : <Ionicons name="checkmark-circle-outline" size={21} color={palette.paper} />}
            <Text style={styles.saveButtonText}>{saving ? t("addingBooks") : t(selectedBooks.length === 1 ? "addBookCount" : "addBooksCount", { count: selectedBooks.length })}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { width: "100%", maxWidth: layout.formMax, alignSelf: "center", padding: 24, paddingBottom: 56 },
  eyebrow: { color: palette.accentDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.25, marginBottom: 10 },
  title: { color: palette.text, fontFamily: typography.serif, fontSize: 31, lineHeight: 38, fontWeight: "700" },
  subtitle: { color: palette.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  guideCard: { minHeight: 230, marginTop: 24, padding: 24, alignItems: "center", justifyContent: "center", borderRadius: radii.xl, borderWidth: 1.5, borderStyle: "dashed", borderColor: palette.borderStrong, backgroundColor: palette.surface },
  guideIcon: { width: 68, height: 68, borderRadius: radii.round, alignItems: "center", justifyContent: "center", backgroundColor: palette.accentSoft },
  guideTitle: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 16 },
  guideText: { color: palette.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 7 },
  preview: { width: "100%", height: 250, marginTop: 24, borderRadius: radii.xl, backgroundColor: palette.surfaceMuted },
  photoActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  primaryButton: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radii.md, backgroundColor: palette.accent, borderWidth: 1.5, borderColor: palette.accentDark },
  primaryButtonText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  secondaryButton: { flex: 1, minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radii.md, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.borderStrong },
  secondaryButtonText: { color: palette.accentDark, fontSize: 14, fontWeight: "800" },
  submitButton: { minHeight: 56, marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: radii.md, backgroundColor: palette.accent, borderWidth: 1.5, borderColor: palette.accentDark, ...shadows.soft },
  submitButtonText: { color: palette.paper, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  privacyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 14, paddingHorizontal: 4 },
  privacyText: { flex: 1, color: palette.textMuted, fontSize: 12, lineHeight: 18 },
  statusCard: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 22, padding: 17, borderRadius: radii.lg, backgroundColor: palette.accentSoft },
  statusCopy: { flex: 1 },
  statusTitle: { color: palette.text, fontSize: 14, fontWeight: "800" },
  statusText: { color: palette.textMuted, fontSize: 12, marginTop: 3 },
  leaveNote: { color: palette.accentDark, fontSize: 12, lineHeight: 18, fontWeight: "700", textAlign: "center", marginTop: 10, paddingHorizontal: 10 },
  errorCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 22, padding: 15, borderRadius: radii.md, backgroundColor: palette.dangerSoft },
  errorText: { flex: 1, color: palette.danger, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  results: { marginTop: 28 },
  resultsHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  resultsTitle: { color: palette.text, fontSize: 18, fontWeight: "800" },
  resultsSubtitle: { color: palette.textMuted, fontSize: 12, marginTop: 4 },
  selectedCount: { color: palette.accentDark, fontSize: 12, fontWeight: "800", paddingTop: 3 },
  bookCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 15, marginBottom: 11, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface, ...shadows.soft },
  bookCardMuted: { opacity: 0.56 },
  checkbox: { width: 28, height: 28, marginTop: 2, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.paper },
  checkboxSelected: { backgroundColor: palette.accent, borderColor: palette.accentDark },
  bookFields: { flex: 1 },
  bookMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bookNumber: { color: palette.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  matchBadge: { color: palette.success, fontSize: 9, fontWeight: "800", letterSpacing: 0.4, backgroundColor: palette.successSoft, paddingHorizontal: 7, paddingVertical: 4, borderRadius: radii.round },
  readBadge: { color: palette.textSoft, backgroundColor: palette.orangeSoft },
  titleInput: { minHeight: 42, color: palette.text, fontSize: 16, fontWeight: "800", borderBottomWidth: 1, borderBottomColor: palette.border, paddingVertical: 7 },
  authorInput: { minHeight: 40, color: palette.textMuted, fontSize: 14, paddingVertical: 7 },
  saveButton: { minHeight: 56, marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, borderRadius: radii.md, backgroundColor: palette.accent, borderWidth: 1.5, borderColor: palette.accentDark },
  saveButtonText: { color: palette.paper, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.55 },
})
