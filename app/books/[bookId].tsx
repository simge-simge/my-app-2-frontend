import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { Image } from "expo-image"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getBook, requestToBorrowBook, type Book } from "@/services/books"
import { supabase } from "@/utils/supabase"
import { useBookStatusLabel } from "@/localization/bookStatus"
import { useTranslation } from "@/localization/LanguageContext"
import { runInBackground, subscribeToBackgroundActions } from "@/utils/backgroundAction"

function getOptimisticBookChange(value: unknown): { book: Book; previous?: Book } | undefined {
  if (!value || typeof value !== "object" || !("book" in value)) return undefined
  const change = value as { book?: Book; previous?: Book }
  return change.book?.id ? { book: change.book, previous: change.previous } : undefined
}

export default function BookDetailsScreen() {
  const bookStatusLabel = useBookStatusLabel()
  const { language, t } = useTranslation()
  const { bookId, ownerName: ownerNameParam, communityName: communityNameParam } = useLocalSearchParams<{
    bookId: string
    ownerName?: string
    communityName?: string
  }>()
  const cachePath = bookId ? `/books/${bookId}` : ""
  const cachedBook = getCachedApiData<Book>(cachePath)
  const [book, setBook] = useState<Book | null>(() => cachedBook ?? null)
  const [borrowRequested, setBorrowRequested] = useState(() => cachedBook?.borrow_requested ?? false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => cachedBook === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(cachedBook !== undefined)
  const bookRevision = useRef(0)

  const loadBook = useCallback(async (refresh = false) => {
    if (!bookId) return
    const revisionAtStart = bookRevision.current
    if (refresh) setRefreshing(true)
    else if (!hasLoaded.current) setLoading(true)

    try {
      setError(null)
      const [{ data }, response] = await Promise.all([
        supabase.auth.getSession(),
        getBook(bookId),
      ])
      setCurrentUserId(data.session?.user.id ?? null)
      if (revisionAtStart === bookRevision.current) {
        setBook(response)
        setBorrowRequested(response.borrow_requested ?? false)
      }
      hasLoaded.current = true
    } catch (err) {
      console.error("Failed to load book", err)
      if (revisionAtStart === bookRevision.current) {
        setError(t("bookLoadError"))
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [bookId, t])

  useFocusEffect(useCallback(() => { loadBook() }, [loadBook]))

  useEffect(() => subscribeToBackgroundActions((update) => {
    if (update.event !== "book-updated") return
    const change = getOptimisticBookChange(update.optimisticResult)
    if (!change || change.book.id !== bookId) return
    bookRevision.current += 1

    if (update.status === "pending") setBook(change.book)
    else if (update.status === "failed" && change.previous) setBook(change.previous)
    else if (update.status === "completed" && update.result && typeof update.result === "object") {
      setBook(update.result as Book)
    }
  }), [bookId])

  const isOwner = Boolean(book && currentUserId && book.owner_id === currentUserId)
  const ownerName = book?.owner_name || ownerNameParam
  const communityName = book?.community_name || communityNameParam
  const openEditor = () => {
    if (!bookId || !isOwner) return
    router.push({ pathname: "/books/edit/[bookId]", params: { bookId } })
  }

  const handleBorrowRequest = () => {
    if (!book || book.status !== "available" || isOwner || borrowRequested) return
    setBorrowRequested(true)
    runInBackground(() => requestToBorrowBook(book.id), {
      onError: (err) => {
        setBorrowRequested(false)
        console.error("Failed to send borrow request", err)
        Alert.alert(t("requestNotSent"), err instanceof Error ? err.message : t("tryAgain"))
      },
    })
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.accent} /></View>
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Ionicons name="book-outline" size={42} color={palette.textSoft} />
        <Text style={styles.errorTitle}>{t("bookUnavailable")}</Text>
        <Text style={styles.errorText}>{error ?? t("bookNotFound")}</Text>
      </View>
    )
  }

  return (
    <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBook(true)} tintColor={palette.accent} />}
      >
        <View style={styles.hero}>
          <View style={styles.coverWrap}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="contain" cachePolicy="memory-disk" transition={120} />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Text style={styles.coverLetter}>{book.title.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.pageEdge} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author || t("unknownAuthor")}</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{bookStatusLabel(book.status)}</Text>
            </View>
            {isOwner ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t("editNamedBook", { title: book.title })} onPress={openEditor} style={({ pressed }) => [styles.editButton, styles.inlineEditButton, pressed && styles.editButtonPressed]}>
                <Ionicons name="create-outline" size={18} color={palette.accentDark} />
                <Text style={styles.editButtonText}>{t("edit")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {!isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("askBorrowBook", { title: book.title })}
            accessibilityState={{ disabled: book.status !== "available" || borrowRequested }}
            disabled={book.status !== "available" || borrowRequested}
            onPress={handleBorrowRequest}
            style={({ pressed }) => [
              styles.borrowButton,
              (book.status !== "available" || borrowRequested) && styles.borrowButtonDisabled,
              pressed && styles.borrowButtonPressed,
            ]}
          >
            <Ionicons name={borrowRequested ? "checkmark-circle" : "hand-left-outline"} size={18} color={palette.paper} />
            <Text style={styles.borrowButtonText}>
              {book.status !== "available" ? t("bookUnavailable") : borrowRequested ? t("requestSent") : t("askBorrow")}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t("bookInformation")}</Text>
          {ownerName ? <DetailRow icon="person-outline" label={t("ownerLabel")} value={ownerName} /> : null}
          {communityName ? <DetailRow icon="location-outline" label={t("community")} value={communityName} /> : null}
          <DetailRow label={t("author")} value={book.author || t("unknownAuthor")} />
          <DetailRow label={t("isbn")} value={book.isbn || t("notProvided")} />
          <DetailRow label={t("added")} value={formatDate(book.created_at, language, t("unknown"))} />
          <View style={styles.descriptionBlock}>
            <Text style={styles.detailLabel}>{t("description")}</Text>
            <Text style={styles.description}>{book.description || t("noDescriptionProvided")}</Text>
          </View>
        </View>
    </ScrollView>
  )
}

function DetailRow({ icon, label, value }: { icon?: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelRow}>
        {icon ? <Ionicons name={icon} size={16} color={palette.textMuted} /> : null}
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function formatDate(value: string, language: "en" | "tr", fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 22, paddingBottom: 48, gap: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 28, backgroundColor: palette.background },
  errorTitle: { fontFamily: typography.serif, fontSize: 22, fontWeight: "700", color: palette.text },
  errorText: { color: palette.textMuted, textAlign: "center" },
  editButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderRadius: radii.round, backgroundColor: palette.accentSoft },
  editButtonPressed: { opacity: 0.7 },
  inlineEditButton: { marginTop: 14 },
  editButtonText: { color: palette.accentDark, fontSize: 14, fontWeight: "800" },
  borrowButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 15, borderRadius: radii.round, backgroundColor: palette.accent, ...shadows.soft },
  borrowButtonDisabled: { backgroundColor: palette.textSoft },
  borrowButtonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  borrowButtonText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  hero: { flexDirection: "row", alignItems: "center", gap: 22, padding: 20, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, backgroundColor: palette.paper, ...shadows.lifted },
  coverWrap: { width: 142, height: 208, position: "relative" },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  coverFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.blue, borderWidth: 1.5, borderColor: palette.borderStrong },
  coverLetter: { fontFamily: typography.serif, fontSize: 58, fontWeight: "700", color: palette.ink },
  pageEdge: { position: "absolute", right: -5, top: 9, bottom: 9, width: 5, borderWidth: 1, borderLeftWidth: 0, borderColor: palette.borderStrong, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: palette.yellow },
  heroText: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  title: { fontFamily: typography.serif, fontSize: 29, lineHeight: 35, fontWeight: "700", color: palette.text },
  author: { marginTop: 9, fontSize: 16, lineHeight: 22, color: palette.textMuted },
  statusPill: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.round, backgroundColor: palette.accentSoft },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  statusText: { color: palette.accentDark, fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  detailsCard: { padding: 20, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.soft },
  sectionTitle: { marginBottom: 7, fontFamily: typography.serif, fontSize: 21, fontWeight: "700", color: palette.text },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  detailLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  detailLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  detailValue: { flex: 1, color: palette.text, fontSize: 14, textAlign: "right" },
  descriptionBlock: { paddingTop: 16, gap: 8 },
  description: { color: palette.text, fontSize: 15, lineHeight: 23 },
})
