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
import { createBook, lookupBookByIsbn, uploadBookCover, type Book, type IsbnBookLookup } from "@/services/books"
import { runInBackground } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

type AddMethod = "choose" | "manual" | "isbn" | "scan" | "details"
type IsbnSource = "entered" | "scanned"

function normalizeIsbn(value: string) {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase().slice(0, 13)
}

export default function NewBookScreen() {
  const { language, t } = useTranslation()
  const methods = [
    { id: "shelf" as const, icon: "library-outline" as const, title: t("scanShelf"), description: t("scanShelfHint"), tone: palette.yellow },
    { id: "scan" as const, icon: "scan-outline" as const, title: t("scanBarcode"), description: t("scanBarcodeHint"), tone: palette.accentSoft },
    { id: "isbn" as const, icon: "keypad-outline" as const, title: t("enterIsbn"), description: t("enterIsbnHint"), tone: palette.blueSoft },
    { id: "manual" as const, icon: "create-outline" as const, title: t("addManually"), description: t("addManuallyHint"), tone: palette.orangeSoft },
  ]
  const [method, setMethod] = useState<AddMethod>("choose")
  const [isbn, setIsbn] = useState("")
  const [lookingUp, setLookingUp] = useState(false)
  const [draft, setDraft] = useState<IsbnBookLookup | undefined>()
  const [isbnSource, setIsbnSource] = useState<IsbnSource | undefined>()
  const [scanLocked, setScanLocked] = useState(false)
  const [scannerReady, setScannerReady] = useState(false)
  const [cameraError, setCameraError] = useState<string | undefined>()
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const initialValues = useMemo<BookFormValues | undefined>(() => draft ? ({
    title: draft.title,
    author: draft.author ?? "",
    description: draft.description ?? "",
    isbn: draft.isbn ?? "",
    cover_url: draft.cover_url ?? null,
  }) : undefined, [draft])

  const handleSave = async (values: BookFormValues, coverAsset: ImagePickerAsset | null) => {
    const optimisticBook: Book = {
      id: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      owner_id: "pending",
      community_id: "pending",
      title: values.title,
      author: values.author || null,
      description: values.description || null,
      cover_url: coverAsset?.uri ?? values.cover_url,
      isbn: values.isbn || null,
      status: "available",
      created_at: new Date().toISOString(),
    }

    runInBackground(async () => {
      const coverUrl = coverAsset ? await uploadBookCover(coverAsset) : values.cover_url
      return createBook({
        title: values.title, author: values.author || null, description: values.description || null,
        cover_url: coverUrl, isbn: values.isbn || null,
      })
    }, {
      event: "books",
      optimisticResult: optimisticBook,
      onError: (err) => {
        console.error("Failed to create book", err)
        Alert.alert(t("bookNotSaved"), err instanceof Error ? err.message : t("couldNotSaveBook"))
      },
    })
    router.back()
  }

  const findBook = async (rawIsbn: string, source: IsbnSource) => {
    const normalized = normalizeIsbn(rawIsbn)
    if (normalized.length !== 10 && normalized.length !== 13) {
      Alert.alert(t("checkIsbn"), t("isbnLengthHint"))
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
      Alert.alert(t("bookNotFound"), error instanceof Error ? error.message : t("bookLookupFailed"))
      setScanLocked(false)
    } finally {
      setLookingUp(false)
    }
  }

  const chooseMethod = async (nextMethod: "manual" | "isbn" | "scan" | "shelf") => {
    if (nextMethod === "shelf") {
      router.push("/books/shelf-scan")
      return
    }
    if (nextMethod === "manual") {
      setDraft(undefined)
      setIsbnSource(undefined)
      setMethod("manual")
      return
    }
    if (nextMethod === "scan" && !permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert(t("cameraAccessNeeded"), t("allowBarcodeCamera"))
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
        <Pressable accessibilityRole="button" accessibilityLabel={t("chooseAnotherAddMethod")} onPress={() => setMethod("choose")} style={styles.formBack}>
          <Ionicons name="chevron-back" size={19} color={palette.accentDark} />
          <Text style={styles.formBackText}>{t("addAnotherWay")}</Text>
        </Pressable>
        {isbnSource && initialValues?.isbn ? (
          <View accessibilityRole="summary" style={styles.isbnConfirmation}>
            <View style={styles.isbnConfirmationIcon}>
              <Ionicons name="checkmark" size={18} color={palette.success} />
            </View>
            <View style={styles.isbnConfirmationCopy}>
              <Text style={styles.isbnConfirmationLabel}>{t(isbnSource === "entered" ? "isbnEntered" : "isbnScanned")}</Text>
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
          <Pressable accessibilityRole="button" accessibilityLabel={t("backToAddOptions")} onPress={() => { setMethod("choose"); setScanLocked(false) }} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={palette.text} />
            <Text style={styles.backText}>{t("back")}</Text>
          </Pressable>
        ) : null}

        <Text style={styles.eyebrow}>{t("addToLibrary").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}</Text>
        <Text style={styles.title}>{method === "choose" ? t("chooseAddMethod") : method === "scan" ? t("scanIsbnBarcode") : t("enterIsbn")}</Text>
        <Text style={styles.subtitle}>
          {method === "choose" ? t("chooseAddMethodHint") : method === "scan" ? t("scanIsbnHint") : t("enterIsbnLocationHint")}
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
            <Text style={styles.inputLabel}>{t("isbnNumber")}</Text>
            <View style={styles.isbnInputWrap}>
              <Ionicons name="barcode-outline" size={24} color={palette.textMuted} />
              <TextInput value={isbn} onChangeText={(value) => setIsbn(normalizeIsbn(value))} placeholder="978 0 00 000000 0" placeholderTextColor={palette.textMuted} keyboardType="number-pad" autoFocus style={styles.isbnInput} onSubmitEditing={() => void findBook(isbn, "entered")} />
            </View>
            <Text style={styles.hint}>{t("optionalHyphens")}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={lookingUp ? t("findingBook") : t("findBook")} disabled={lookingUp} onPress={() => void findBook(isbn, "entered")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, lookingUp && styles.disabled]}>
              {lookingUp ? <ActivityIndicator color={palette.paper} /> : <Ionicons name="search" size={19} color={palette.paper} />}
              <Text style={styles.primaryButtonText}>{lookingUp ? `${t("findingBook")}…` : t("findBook")}</Text>
            </Pressable>
          </View>
        ) : null}

        {method === "scan" ? (
          <View style={styles.scannerCard}>
            <View style={styles.cameraFrame}>
              {permission?.granted ? (
                <IsbnCameraScanner
                  active={!scanLocked}
                  torchEnabled={torchEnabled}
                  onDetected={handleBarcode}
                  onReady={() => setScannerReady(true)}
                  onError={(message: string) => setCameraError(message)}
                />
              ) : null}
              <View style={styles.cameraTopBar}>
                <View pointerEvents="none" style={styles.cameraModePill}>
                  <Ionicons name="barcode-outline" size={17} color={palette.paper} />
                  <Text style={styles.cameraModeText}>{t("isbnScanner").toLocaleUpperCase(language === "tr" ? "tr-TR" : "en-US")}</Text>
                </View>
                <View style={styles.cameraControls}>
                  {Platform.OS !== "web" ? (
                    <Pressable accessibilityRole="button" accessibilityLabel={torchEnabled ? t("flashlightOff") : t("flashlightOn")} accessibilityState={{ selected: torchEnabled }} onPress={() => setTorchEnabled((enabled) => !enabled)} style={[styles.torchButton, torchEnabled && styles.torchButtonActive]}>
                      <Ionicons name={torchEnabled ? "flash" : "flash-outline"} size={20} color={palette.paper} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
              <View pointerEvents="none" style={styles.scanTarget}>
                <View style={[styles.corner, styles.cornerTopLeft]} /><View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} /><View style={[styles.corner, styles.cornerBottomRight]} /><View style={styles.scanLine} />
              </View>
              <View pointerEvents="none" style={styles.cameraBottomBar}>
                <Text style={styles.cameraInstruction}>{t("barcodeGuide")}</Text>
              </View>
              {lookingUp ? <View style={styles.scanLoading}><ActivityIndicator color={palette.paper} size="large" /><Text style={styles.scanLoadingText}>{t("lookingUpBook")}</Text></View> : null}
              {cameraError ? <View style={styles.cameraMessage}><Ionicons name="warning-outline" size={24} color={palette.paper} /><Text style={styles.cameraMessageText}>{t("cameraUnavailable")}</Text><Text style={styles.cameraMessageDetail}>{cameraError}</Text></View> : null}
            </View>
            {!cameraError ? <Text style={styles.scannerStatus}>{scannerReady ? t("cameraReady") : t("startingCamera")}</Text> : null}
            <View style={styles.scanTip}><Ionicons name="scan-outline" size={20} color={palette.orange} /><Text style={styles.scanTipText}>{t("autofocusHint")}</Text></View>
            <Pressable accessibilityRole="button" onPress={() => setMethod("isbn")} style={styles.textButton}><Text style={styles.textButtonText}>{t("enterIsbnInstead")}</Text></Pressable>
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
  cameraTopBar: { position: "absolute", top: 0, left: 0, right: 0, height: 78, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(12, 14, 11, 0.24)" },
  cameraModePill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.round, backgroundColor: "rgba(18, 21, 16, 0.62)" },
  cameraModeText: { color: palette.paper, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  cameraControls: { flexDirection: "row", alignItems: "center", gap: 7 },
  torchButton: { width: 42, height: 42, borderRadius: radii.round, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18, 21, 16, 0.62)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.32)" },
  torchButtonActive: { backgroundColor: palette.orange, borderColor: palette.paper },
  scanTarget: { position: "absolute", left: 14, right: 14, top: "34%", height: 172 },
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
