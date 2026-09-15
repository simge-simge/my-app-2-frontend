import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from "react-native"
import { router, useFocusEffect } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import LibraryBrowser from "@/components/LibraryBrowser"
import { palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getMyBooks, type Book } from "@/services/books"
import { subscribeToBackgroundActions } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

function isBook(value: unknown): value is Book {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<Book>
  return typeof candidate.id === "string"
    && typeof candidate.owner_id === "string"
    && typeof candidate.title === "string"
}

function isBookList(value: unknown): value is Book[] {
  return Array.isArray(value) && value.every(isBook)
}

function isOptimisticBookChange(value: unknown): value is { book: Book; previous?: Book; index?: number } {
  if (!value || typeof value !== "object" || !("book" in value)) return false
  return isBook(value.book)
}

export default function Library() {
  const { t } = useTranslation()
  const cachedBooks = getCachedApiData<Book[]>("/books/me")
  const [books, setBooks] = useState<Book[]>(() => cachedBooks ?? [])
  const [loading, setLoading] = useState(() => cachedBooks === undefined)
  const hasLoaded = useRef(cachedBooks !== undefined)
  const booksRevision = useRef(0)
  const [pendingBookIds, setPendingBookIds] = useState(() => new Set<string>())
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBooks = useCallback(async (showLoader = false, forceRefresh = false) => {
    const revisionAtStart = booksRevision.current
    if (showLoader && !hasLoaded.current) {
      setLoading(true)
    }

    try {
      setError(null)
      const response = await getMyBooks(forceRefresh)
      if (revisionAtStart === booksRevision.current) {
        setBooks(response)
      }
    } catch (err) {
      console.error("Failed to load books", err)
      if (revisionAtStart === booksRevision.current) {
        setError(t("couldNotLoadLibrary"))
      }
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [t])

  useFocusEffect(
    useCallback(() => {
      loadBooks(true)
    }, [loadBooks])
  )

  useEffect(() => subscribeToBackgroundActions((update) => {
    if (update.event === "book-updated" && isOptimisticBookChange(update.optimisticResult)) {
      const { book: optimisticBook, previous } = update.optimisticResult
      booksRevision.current += 1
      if (update.status === "pending") {
        setPendingBookIds((ids) => new Set(ids).add(optimisticBook.id))
        setBooks((items) => items.some((book) => book.id === optimisticBook.id)
          ? items.map((book) => book.id === optimisticBook.id ? optimisticBook : book)
          : [optimisticBook, ...items])
      } else {
        setPendingBookIds((ids) => {
          const next = new Set(ids)
          next.delete(optimisticBook.id)
          return next
        })
        if (update.status === "failed" && previous) {
          setBooks((items) => items.some((book) => book.id === previous.id)
            ? items.map((book) => book.id === previous.id ? previous : book)
            : [previous, ...items])
        } else if (update.status === "completed" && isBook(update.result)) {
          const savedBook = { ...update.result, cover_url: optimisticBook.cover_url }
          setBooks((items) => items.some((book) => book.id === savedBook.id)
            ? items.map((book) => book.id === savedBook.id ? savedBook : book)
            : [savedBook, ...items])
        }
      }
      return
    }

    if (update.event === "book-deleted" && isOptimisticBookChange(update.optimisticResult)) {
      const { book: deletedBook, index = 0 } = update.optimisticResult
      booksRevision.current += 1
      if (update.status === "pending") {
        setBooks((items) => items.filter((book) => book.id !== deletedBook.id))
      } else if (update.status === "failed") {
        setBooks((items) => {
          if (items.some((book) => book.id === deletedBook.id)) return items
          const next = [...items]
          next.splice(Math.min(index, next.length), 0, deletedBook)
          return next
        })
      }
      return
    }

    if (update.event !== "books") return

    const publishedBooks = isBookList(update.result)
      ? update.result
      : undefined

    if ((update.status === "pending" || update.status === "completed") && publishedBooks) {
      booksRevision.current += 1
      setBooks((currentBooks) => [
        ...publishedBooks,
        ...currentBooks.filter((book) => !publishedBooks.some((createdBook) => createdBook.id === book.id)),
      ])
      return
    }

    const optimisticBook = isBook(update.optimisticResult)
      ? update.optimisticResult
      : undefined

    if (update.status === "pending" && isBook(update.result)) {
      const pendingBook = update.result
      booksRevision.current += 1
      setPendingBookIds((currentIds) => new Set(currentIds).add(pendingBook.id))
      setBooks((currentBooks) => [
        pendingBook,
        ...currentBooks.filter((book) => book.id !== pendingBook.id),
      ])
      return
    }

    if (update.status === "failed") {
      if (!optimisticBook) return
      booksRevision.current += 1
      setPendingBookIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(optimisticBook.id)
        return nextIds
      })
      setBooks((currentBooks) => currentBooks.filter((book) => book.id !== optimisticBook.id))
      return
    }

    if (update.status !== "completed") return

    if (!isBook(update.result)) {
      void loadBooks()
      return
    }
    const savedBook = update.result
    const displayedBook = optimisticBook
      ? {
          ...savedBook,
          title: optimisticBook.title,
          author: optimisticBook.author,
          description: optimisticBook.description,
          cover_url: optimisticBook.cover_url,
          isbn: optimisticBook.isbn,
          status: optimisticBook.status,
        }
      : savedBook

    booksRevision.current += 1
    if (optimisticBook) {
      setPendingBookIds((currentIds) => {
        const nextIds = new Set(currentIds)
        nextIds.delete(optimisticBook.id)
        return nextIds
      })
    }
    setBooks((currentBooks) => {
      const withoutOptimisticBook = optimisticBook
        ? currentBooks.filter((book) => book.id !== optimisticBook.id)
        : currentBooks
      const existingIndex = withoutOptimisticBook.findIndex((book) => book.id === displayedBook.id)
      if (existingIndex === -1) return [displayedBook, ...withoutOptimisticBook]

      const updatedBooks = [...withoutOptimisticBook]
      updatedBooks[existingIndex] = displayedBook
      return updatedBooks
    })
  }), [loadBooks])

  const handleRefresh = () => {
    setRefreshing(true)
    loadBooks(false, true)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.text} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LibraryBrowser
        books={books}
        title={t("myLibrary")}
        subtitle={t("booksAddedSubtitle")}
        message={error}
        emptyTitle={t("noBooks")}
        emptyText={t("noBooksHint")}
        disabledBookIds={pendingBookIds}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onBookPress={(book) => router.push(`/books/${book.id}`)}
      />

      <Pressable accessibilityRole="button" accessibilityLabel={t("addBookLabel")} style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} onPress={() => router.push("/books/new")}>
        <Ionicons name="add" size={32} color={palette.white} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
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
    marginBottom: 18,
  },
  error: {
    color: palette.danger,
    marginBottom: 12,
  },
  controlsCard: { gap: 14, marginBottom: 12, padding: 14, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.soft },
  searchBox: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  searchInput: { flex: 1, minWidth: 0, color: palette.text, fontSize: 14, paddingVertical: 10 },
  clearButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  controlSection: { gap: 7 },
  controlLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: palette.border, borderRadius: radii.round, backgroundColor: palette.paper },
  chipSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  chipText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  chipTextSelected: { color: palette.paper },
  optionsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 18 },
  compactControl: { flexDirection: "row", alignItems: "center", gap: 7 },
  compactLabel: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  compactOptions: { flexDirection: "row", gap: 5 },
  iconOption: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  iconOptionSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  pageSizeOption: { minWidth: 34, height: 32, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  pageSizeText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  pageSizeTextSelected: { color: palette.paper },
  resultCount: { marginBottom: 9, color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  listContent: {
    paddingBottom: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    justifyContent: "space-between",
  },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 8, paddingBottom: 74 },
  pageButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  pageButtonDisabled: { opacity: 0.38 },
  pageText: { minWidth: 110, textAlign: "center", color: palette.text, fontSize: 13, fontWeight: "700" },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyIllustration: { width: 78, height: 62, borderRadius: radii.md, borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center", marginBottom: 14, transform: [{ rotate: "-3deg" }] },
  emptyTitle: {
    fontFamily: typography.serif,
    fontSize: 21,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: palette.textMuted,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: palette.accentDark,
    ...shadows.lifted,
  },
  addButtonPressed: { transform: [{ scale: 0.94 }] },
})
