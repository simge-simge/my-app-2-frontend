import DefaultBookCover from "@/components/DefaultBookCover"
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
import { getBook, requestToBorrowBook, updateBook, type Book, type BookStatus } from "@/services/books"
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
  const [ownershipResolved, setOwnershipResolved] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
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
      setOwnershipResolved(true)
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

  const handleStatusChange = (status: Extract<BookStatus, "available" | "lent">) => {
    if (!book || !isOwner || statusSaving) return
    setStatusMenuOpen(false)
    if (book.status === status) return

    const previous = book
    const optimisticBook = { ...book, status }
    setStatusSaving(true)
    runInBackground(() => updateBook(book.id, { status }), {
      event: "book-updated",
      optimisticResult: { book: optimisticBook, previous },
      onSuccess: () => setStatusSaving(false),
      onError: (err) => {
        setStatusSaving(false)
        console.error("Failed to update book status", err)
        Alert.alert(t("changeNotSaved"), t("bookStatusUpdateError"))
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
      <View style={styles.bookCard}>
        {isOwner ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("editNamedBook", { title: book.title })}
            onPress={openEditor}
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
          >
            <Ionicons name="create-outline" size={20} color={palette.accentDark} />
          </Pressable>
        ) : null}
        <View style={styles.hero}>
          <View style={styles.coverWrap}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="contain" cachePolicy="memory-disk" transition={120} />
            ) : (
              <DefaultBookCover title={book.title} author={book.author} style={styles.cover} />
            )}
            <View style={styles.pageEdge} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author || t("unknownAuthor")}</Text>
            <View style={[styles.statusControl, statusMenuOpen && styles.statusControlOpen]}>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, book.status !== "available" && styles.statusDotUnavailable]} />
                <Text style={styles.statusText}>{bookStatusLabel(book.status)}</Text>
              </View>
              {isOwner ? (
                <View style={styles.statusMenuWrap}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t("changeStatus")}
                    accessibilityState={{ expanded: statusMenuOpen, disabled: statusSaving }}
                    disabled={statusSaving}
                    onPress={() => setStatusMenuOpen((open) => !open)}
                    style={({ pressed }) => [styles.statusMenuButton, pressed && styles.statusMenuButtonPressed]}
                  >
                    {statusSaving ? <ActivityIndicator size="small" color={palette.textMuted} /> : null}
                    <Text style={styles.statusMenuButtonText}>{t("changeStatus")}</Text>
                    <Ionicons name={statusMenuOpen ? "chevron-up" : "chevron-down"} size={15} color={palette.textMuted} />
                  </Pressable>
                  {statusMenuOpen ? (
                    <View style={styles.statusDropdown}>
                      <StatusOption
                        label={t("available")}
                        accessibilityLabel={t("markBookAvailable")}
                        selected={book.status === "available"}
                        onPress={() => handleStatusChange("available")}
                      />
                      <StatusOption
                        label={t("unavailable")}
                        accessibilityLabel={t("markBookUnavailable")}
                        selected={book.status !== "available"}
                        onPress={() => handleStatusChange("lent")}
                      />
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.details}>
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
      </View>

      {ownershipResolved && !isOwner ? (
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

function StatusOption({ label, accessibilityLabel, selected, onPress }: { label: string; accessibilityLabel: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.statusOption, pressed && styles.statusOptionPressed]}
    >
      <View style={[styles.statusOptionDot, selected && styles.statusOptionDotSelected]} />
      <Text style={[styles.statusOptionText, selected && styles.statusOptionTextSelected]}>{label}</Text>
      {selected ? <Ionicons name="checkmark" size={16} color={palette.accentDark} /> : null}
    </Pressable>
  )
}

function formatDate(value: string, language: "en" | "tr", fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 28, backgroundColor: palette.background },
  errorTitle: { fontFamily: typography.serif, fontSize: 22, fontWeight: "700", color: palette.text },
  errorText: { color: palette.textMuted, textAlign: "center" },
  editButton: { alignSelf: "flex-end", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radii.round, backgroundColor: palette.accentSoft },
  editButtonPressed: { opacity: 0.7 },
  borrowButton: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 15, borderRadius: radii.round, backgroundColor: palette.accent, ...shadows.soft },
  borrowButtonDisabled: { backgroundColor: palette.textSoft },
  borrowButtonPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  borrowButtonText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  bookCard: { gap: 14, padding: 16, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, backgroundColor: palette.paper, ...shadows.lifted },
  hero: { flexDirection: "row", alignItems: "center", gap: 16, zIndex: 1 },
  coverWrap: { width: 88, height: 128, flexShrink: 0, position: "relative" },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  pageEdge: { position: "absolute", right: -5, top: 9, bottom: 9, width: 5, borderWidth: 1, borderLeftWidth: 0, borderColor: palette.borderStrong, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: palette.yellow },
  heroText: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  title: { fontFamily: typography.serif, fontSize: 23, lineHeight: 28, fontWeight: "700", color: palette.text },
  author: { marginTop: 5, fontSize: 14, lineHeight: 19, color: palette.textMuted },
  statusControl: { marginTop: 10, flexDirection: "row", alignItems: "flex-start", flexWrap: "wrap", gap: 8, zIndex: 2 },
  statusControlOpen: { zIndex: 20 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.round, backgroundColor: palette.accentSoft },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  statusDotUnavailable: { backgroundColor: palette.textSoft },
  statusText: { color: palette.accentDark, fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  statusMenuWrap: { position: "relative", alignItems: "flex-end", zIndex: 30 },
  statusMenuButton: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: palette.border, borderRadius: radii.round, backgroundColor: palette.paper },
  statusMenuButtonPressed: { opacity: 0.7 },
  statusMenuButtonText: { color: palette.textMuted, fontSize: 12, fontWeight: "800" },
  statusDropdown: { position: "absolute", top: "100%", marginTop: 6, right: 0, width: 168, zIndex: 40, padding: 6, borderWidth: 1, borderColor: palette.border, borderRadius: radii.md, backgroundColor: palette.paper, ...shadows.lifted },
  statusOption: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, borderRadius: radii.sm },
  statusOptionPressed: { backgroundColor: palette.surfaceMuted },
  statusOptionDot: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: palette.textSoft },
  statusOptionDotSelected: { borderColor: palette.accent, backgroundColor: palette.accent },
  statusOptionText: { flex: 1, color: palette.text, fontSize: 13, fontWeight: "700" },
  statusOptionTextSelected: { color: palette.accentDark },
  details: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.border },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 14, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  detailLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  detailLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  detailValue: { flex: 1, color: palette.text, fontSize: 14, textAlign: "right" },
  descriptionBlock: { paddingTop: 10, gap: 5 },
  description: { color: palette.text, fontSize: 14, lineHeight: 20 },
})
