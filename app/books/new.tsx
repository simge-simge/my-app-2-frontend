import { useMemo, useState } from "react"
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useCameraPermissions } from "expo-camera"
import { router } from "expo-router"
import type { ImagePickerAsset } from "expo-image-picker"

import BookForm, { type BookFormValues } from "@/components/BookForm"
import IsbnCameraScanner from "@/components/IsbnCameraScanner"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { createBook, lookupBookByIsbn, uploadBookCover, type IsbnBookLookup } from "@/services/books"
import { runInBackground } from "@/utils/backgroundAction"

type AddMethod = "choose" | "manual" | "isbn" | "scan" | "details"
type IsbnSource = "entered" | "scanned"

const methods = [
  { id: "scan" as const, icon: "scan-outline" as const, title: "Scan the barcode", description: "Point your camera at the ISBN barcode on the back cover.", tone: palette.accentSoft },
  { id: "isbn" as const, icon: "keypad-outline" as const, title: "Enter an ISBN", description: "Type the ISBN-10 or ISBN-13 and we’ll fill in the details.", tone: palette.blueSoft },
  { id: "manual" as const, icon: "create-outline" as const, title: "Add details manually", description: "Enter the title, author, cover, and description yourself.", tone: palette.orangeSoft },
]

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 13)
}

export default function NewBookScreen() {
  const [method, setMethod] = useState<AddMethod>("choose")
  const [isbn, setIsbn] = useState("")
  const [lookingUp, setLookingUp] = useState(false)
  const [draft, setDraft] = useState<IsbnBookLookup | undefined>()
  const [isbnSource, setIsbnSource] = useState<IsbnSource | undefined>()
  const [scanLocked, setScanLocked] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | undefined>()
  const [permission, requestPermission] = useCameraPermissions()
  const initialValues = useMemo<BookFormValues | undefined>(() => draft ? ({
    title: draft.title,
    author: draft.author ?? "",
    description: draft.description ?? "",
    isbn: draft.isbn ?? "",
    cover_url: draft.cover_url ?? null,
  }) : undefined, [draft])

  const handleSave = async (values: BookFormValues, coverAsset: ImagePickerAsset | null) => {
    router.back()
    runInBackground(async () => {
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      return createBook({
        title: values.title, author: values.author || null, description: values.description || null,
        cover_url: coverUrl, isbn: values.isbn || null,
      })
    }, {
      event: "books",
      onError: (err) => {
        console.error("Failed to create book", err)
        Alert.alert("Book was not saved", err instanceof Error ? err.message : "Could not save the book.")
      },
    })
  }

  const findBook = async (rawIsbn: string, source: IsbnSource) => {
    const normalized = normalizeIsbn(rawIsbn)
    if (normalized.length !== 10 && normalized.length !== 13) {
      Alert.alert("Check the ISBN", "Enter a 10 or 13 character ISBN.")
      setScanLocked(false)
      return
    }
    console.log(`ISBN ${source}:`, normalized)
    setIsbn(normalized)
    setIsbnSource(source)
    setLookingUp(true)
    try {
      const result = await lookupBookByIsbn(normalized)
      setDraft(result)
      setIsbn(result.isbn ?? normalized)
      setMethod("details")
    } catch (error) {
      Alert.alert("Book not found", error instanceof Error ? error.message : "We couldn't look up that ISBN. You can still add the book manually.")
      setScanLocked(false)
    } finally {
      setLookingUp(false)
    }
  }

  const chooseMethod = async (nextMethod: "manual" | "isbn" | "scan") => {
    if (nextMethod === "manual") {
      setDraft(undefined)
      setIsbnSource(undefined)
      setMethod("manual")
      return
    }
    if (nextMethod === "scan" && !permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert("Camera access needed", "Allow camera access to scan a book barcode, or enter the ISBN instead.")
        return
      }
    }
    setMethod(nextMethod)
  }

  const handleBarcode = (data: string) => {
    if (scanLocked) return
    setScanLocked(true)
    setIsbn(normalizeIsbn(data))
    void findBook(data, "scanned")
  }

  if (method === "manual" || method === "details") {
    return (
      <View style={styles.flex}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose another way to add a book" onPress={() => setMethod("choose")} style={styles.formBack}>
          <Ionicons name="chevron-back" size={19} color={palette.accentDark} />
          <Text style={styles.formBackText}>Add another way</Text>
        </Pressable>
        {isbnSource && initialValues?.isbn ? (
          <View accessibilityRole="summary" style={styles.isbnConfirmation}>
            <View style={styles.isbnConfirmationIcon}>
              <Ionicons name="checkmark" size={18} color={palette.success} />
            </View>
            <View style={styles.isbnConfirmationCopy}>
              <Text style={styles.isbnConfirmationLabel}>ISBN {isbnSource}</Text>
              <Text selectable style={styles.isbnConfirmationValue}>{initialValues.isbn}</Text>
            </View>
          </View>
        ) : null}
        <BookForm mode="create" initialValues={initialValues} onSave={handleSave} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {method !== "choose" ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back to add book options" onPress={() => { setMethod("choose"); setScanLocked(false) }} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        ) : null}

        <Text style={styles.eyebrow}>ADD TO YOUR LIBRARY</Text>
        <Text style={styles.title}>{method === "choose" ? "How would you like to add it?" : method === "scan" ? "Scan the ISBN barcode" : "Enter the ISBN"}</Text>
        <Text style={styles.subtitle}>
          {method === "choose" ? "Choose the quickest option for the book in your hands." : method === "scan" ? "Hold the barcode inside the frame. We’ll recognize it automatically." : "You’ll usually find it above the barcode on the back cover."}
        </Text>

        {method === "choose" ? (
          <View style={styles.methodList}>
            {methods.map((item) => (
              <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} onPress={() => void chooseMethod(item.id)} style={({ pressed }) => [styles.methodCard, pressed && styles.pressed]}>
                <View style={[styles.iconTile, { backgroundColor: item.tone }]}><Ionicons name={item.icon} size={25} color={palette.accentDark} /></View>
                <View style={styles.methodCopy}><Text style={styles.methodTitle}>{item.title}</Text><Text style={styles.methodDescription}>{item.description}</Text></View>
                <Ionicons name="chevron-forward" size={21} color={palette.textMuted} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {method === "isbn" ? (
          <View style={styles.lookupCard}>
            <Text style={styles.inputLabel}>ISBN number</Text>
            <View style={styles.isbnInputWrap}>
              <Ionicons name="barcode-outline" size={24} color={palette.textMuted} />
              <TextInput value={isbn} onChangeText={(value) => setIsbn(normalizeIsbn(value))} placeholder="978 0 00 000000 0" placeholderTextColor={palette.textMuted} keyboardType="number-pad" autoFocus style={styles.isbnInput} onSubmitEditing={() => void findBook(isbn, "entered")} />
            </View>
            <Text style={styles.hint}>Hyphens and spaces are optional.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={lookingUp ? "Finding book" : "Find book"} disabled={lookingUp} onPress={() => void findBook(isbn, "entered")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, lookingUp && styles.disabled]}>
              {lookingUp ? <ActivityIndicator color={palette.paper} /> : <Ionicons name="search" size={19} color={palette.paper} />}
              <Text style={styles.primaryButtonText}>{lookingUp ? "Finding book…" : "Find book"}</Text>
            </Pressable>
          </View>
        ) : null}

        {method === "scan" ? (
          <View style={styles.scannerCard}>
            <View style={styles.cameraFrame}>
              {permission?.granted ? (
                <IsbnCameraScanner
                  active={!scanLocked}
                  onDetected={handleBarcode}
                  onReady={() => setScannerReady(true)}
                  onError={(message: string) => setCameraError(message)}
                />
              ) : null}
              <View pointerEvents="none" style={styles.cameraTopBar}>
                <View style={styles.cameraModePill}>
                  <Ionicons name="barcode-outline" size={17} color={palette.paper} />
                  <Text style={styles.cameraModeText}>ISBN SCANNER</Text>
                </View>
              </View>
              <View pointerEvents="none" style={styles.scanTarget}>
                <View style={[styles.corner, styles.cornerTopLeft]} /><View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} /><View style={[styles.corner, styles.cornerBottomRight]} /><View style={styles.scanLine} />
              </View>
              <View pointerEvents="none" style={styles.cameraBottomBar}>
                <Text style={styles.cameraInstruction}>Align the full barcode inside the frame</Text>
              </View>
              {lookingUp ? <View style={styles.scanLoading}><ActivityIndicator color={palette.paper} size="large" /><Text style={styles.scanLoadingText}>Looking up this book…</Text></View> : null}
              {cameraError ? <View style={styles.cameraMessage}><Ionicons name="warning-outline" size={24} color={palette.paper} /><Text style={styles.cameraMessageText}>Camera unavailable</Text><Text style={styles.cameraMessageDetail}>{cameraError}</Text></View> : null}
            </View>
            {!cameraError ? <Text style={styles.scannerStatus}>{scannerReady ? "Camera ready · Looking for an ISBN barcode" : "Starting camera…"}</Text> : null}
            <View style={styles.scanTip}><Ionicons name="sunny-outline" size={20} color={palette.orange} /><Text style={styles.scanTipText}>Use good lighting and keep the book steady.</Text></View>
            <Pressable accessibilityRole="button" onPress={() => setMethod("isbn")} style={styles.textButton}><Text style={styles.textButtonText}>Can’t scan it? Enter ISBN instead</Text></Pressable>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { padding: 24, paddingBottom: 48, width: "100%", maxWidth: layout.formMax, alignSelf: "center" },
  backButton: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 3, minHeight: 44, marginBottom: 12 },
  backText: { color: palette.text, fontSize: 15, fontWeight: "700" },
  eyebrow: { color: palette.accentDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.25, marginBottom: 10 },
  title: { color: palette.text, fontFamily: typography.serif, fontSize: 32, lineHeight: 39, fontWeight: "700" },
  subtitle: { color: palette.textMuted, fontSize: 15, lineHeight: 22, marginTop: 8 },
  methodList: { gap: 13, marginTop: 28 },
  methodCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface, ...shadows.soft },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  iconTile: { width: 48, height: 48, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  methodCopy: { flex: 1 },
  methodTitle: { color: palette.text, fontSize: 16, fontWeight: "800", marginBottom: 4 },
  methodDescription: { color: palette.textMuted, fontSize: 13, lineHeight: 19 },
  lookupCard: { marginTop: 28, padding: 18, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surface, ...shadows.soft },
  inputLabel: { color: palette.ink, fontSize: 13, fontWeight: "800", marginBottom: 8 },
  isbnInputWrap: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  isbnInput: { flex: 1, color: palette.text, fontSize: 18, letterSpacing: 0.8, paddingVertical: 12 },
  hint: { color: palette.textMuted, fontSize: 12, marginTop: 8 },
  primaryButton: { minHeight: 54, marginTop: 20, borderRadius: radii.md, backgroundColor: palette.accent, borderWidth: 1.5, borderColor: palette.accentDark, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  primaryButtonText: { color: palette.paper, fontSize: 16, fontWeight: "800" },
  disabled: { opacity: 0.7 },
  scannerCard: { marginTop: 25, width: "100%" },
  cameraFrame: { width: "100%", maxWidth: 400, aspectRatio: 3 / 4, alignSelf: "center", overflow: "hidden", borderRadius: radii.xl, backgroundColor: palette.surfaceStrong, borderWidth: 3, borderColor: palette.surface, ...shadows.lifted },
  cameraTopBar: { position: "absolute", top: 0, left: 0, right: 0, height: 78, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12, 14, 11, 0.24)" },
  cameraModePill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.round, backgroundColor: "rgba(18, 21, 16, 0.62)" },
  cameraModeText: { color: palette.paper, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  scanTarget: { position: "absolute", left: 28, right: 28, top: "36%", height: 148 },
  corner: { position: "absolute", width: 36, height: 36, borderColor: palette.paper },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 9 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 9 },
  cornerBottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 9 },
  cornerBottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 9 },
  scanLine: { position: "absolute", left: 12, right: 12, top: "50%", height: 2, backgroundColor: palette.orange },
  cameraBottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, minHeight: 82, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12, 14, 11, 0.38)" },
  cameraInstruction: { color: palette.paper, fontSize: 13, fontWeight: "700", textAlign: "center" },
  scanLoading: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: "rgba(20, 24, 18, 0.72)" },
  scanLoadingText: { color: palette.paper, fontSize: 15, fontWeight: "700" },
  cameraMessage: { ...StyleSheet.absoluteFillObject, paddingHorizontal: 28, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(20, 24, 18, 0.82)" },
  cameraMessageText: { color: palette.paper, fontSize: 16, fontWeight: "800" },
  cameraMessageDetail: { color: palette.paper, opacity: 0.82, fontSize: 12, lineHeight: 18, textAlign: "center" },
  scannerStatus: { color: palette.success, fontSize: 12, fontWeight: "800", textAlign: "center", marginTop: 11 },
  scanTip: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 14 },
  scanTipText: { color: palette.textMuted, fontSize: 13 },
  textButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 7 },
  textButtonText: { color: palette.accentDark, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  formBack: { zIndex: 2, flexDirection: "row", alignItems: "center", gap: 3, minHeight: 44, paddingHorizontal: 24, maxWidth: layout.formMax, width: "100%", alignSelf: "center", backgroundColor: palette.background },
  formBackText: { color: palette.accentDark, fontSize: 14, fontWeight: "800" },
  isbnConfirmation: { flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 11, marginHorizontal: 24, marginBottom: 2, maxWidth: layout.formMax - 48, borderRadius: radii.md, borderWidth: 1, borderColor: palette.success, backgroundColor: palette.successSoft },
  isbnConfirmationIcon: { width: 32, height: 32, borderRadius: radii.round, alignItems: "center", justifyContent: "center", backgroundColor: palette.surface },
  isbnConfirmationCopy: { flex: 1 },
  isbnConfirmationLabel: { color: palette.success, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.7 },
  isbnConfirmationValue: { color: palette.text, fontSize: 15, fontWeight: "800", letterSpacing: 0.6, marginTop: 2 },
})
