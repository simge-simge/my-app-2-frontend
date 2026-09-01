import { Ionicons } from "@expo/vector-icons"
import { useEffect, useMemo, useState, type ReactNode } from "react"
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from "react-native"

import BookDisplay from "@/components/BookDisplay"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import type { Book } from "@/services/books"

type SortOption = "newest" | "oldest" | "titleAsc" | "titleDesc"
type ViewMode = "card" | "list"
const PAGE_SIZES = [10, 20] as const

type Props = {
  books: Book[]
  title: string
  subtitle?: string
  eyebrow?: string
  header?: ReactNode
  message?: string | null
  emptyTitle: string
  emptyText: string
  disabledBookIds?: Set<string>
  refreshing?: boolean
  onRefresh?: () => void
  onBookPress: (book: Book) => void
}

export default function LibraryBrowser({
  books,
  title,
  subtitle,
  eyebrow,
  header,
  message,
  emptyTitle,
  emptyText,
  disabledBookIds,
  refreshing = false,
  onRefresh,
  onBookPress,
}: Props) {
  const { language, t } = useTranslation()
  const [query, setQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [viewMode, setViewMode] = useState<ViewMode>("card")
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10)
  const [page, setPage] = useState(1)

  const visibleBooks = useMemo(() => {
    const locale = language === "tr" ? "tr-TR" : "en-US"
    const normalizedQuery = query.trim().toLocaleLowerCase(locale)
    const filtered = normalizedQuery
      ? books.filter((book) => [book.title, book.author, book.isbn, book.description]
          .some((value) => value?.toLocaleLowerCase(locale).includes(normalizedQuery)))
      : books

    return [...filtered].sort((left, right) => {
      if (sortBy === "titleAsc") return left.title.localeCompare(right.title, locale, { sensitivity: "base" })
      if (sortBy === "titleDesc") return right.title.localeCompare(left.title, locale, { sensitivity: "base" })
      const leftTime = new Date(left.created_at).getTime() || 0
      const rightTime = new Date(right.created_at).getTime() || 0
      return sortBy === "oldest" ? leftTime - rightTime : rightTime - leftTime
    })
  }, [books, language, query, sortBy])

  const totalPages = Math.max(1, Math.ceil(visibleBooks.length / pageSize))
  const pagedBooks = visibleBooks.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => { setPage(1) }, [pageSize, query, sortBy])
  useEffect(() => { setPage((current) => Math.min(current, totalPages)) }, [totalPages])

  const controls = (
    <>
      {header}
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.controlsCard}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color={palette.textMuted} />
          <TextInput accessibilityLabel={t("searchMyLibrary")} value={query} onChangeText={setQuery} placeholder={t("searchLibraryPlaceholder")} placeholderTextColor={palette.textMuted} returnKeyType="search" style={styles.searchInput} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel={t("clearLibrarySearch")} hitSlop={8} onPress={() => setQuery("")} style={styles.clearButton}><Ionicons name="close-circle" size={20} color={palette.textMuted} /></Pressable> : null}
        </View>

        <View style={styles.controlSection}>
          <Text style={styles.controlLabel}>{t("sortBy")}</Text>
          <View style={styles.chipRow}>
            {([[
              "newest", "newestFirst",
            ], ["oldest", "oldestFirst"], ["titleAsc", "titleAscending"], ["titleDesc", "titleDescending"]] as const).map(([value, label]) => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: sortBy === value }} onPress={() => setSortBy(value)} style={[styles.chip, sortBy === value && styles.chipSelected]}>
                <Text style={[styles.chipText, sortBy === value && styles.chipTextSelected]}>{t(label)}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.optionsRow}>
          <View style={styles.compactControl}>
            <Text style={styles.compactLabel}>{t("displayAs")}</Text>
            <View style={styles.compactOptions}>
              <Pressable accessibilityRole="button" accessibilityLabel={t("cardView")} accessibilityState={{ selected: viewMode === "card" }} onPress={() => setViewMode("card")} style={[styles.iconOption, viewMode === "card" && styles.optionSelected]}><Ionicons name="grid-outline" size={17} color={viewMode === "card" ? palette.paper : palette.textMuted} /></Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t("listView")} accessibilityState={{ selected: viewMode === "list" }} onPress={() => setViewMode("list")} style={[styles.iconOption, viewMode === "list" && styles.optionSelected]}><Ionicons name="list-outline" size={18} color={viewMode === "list" ? palette.paper : palette.textMuted} /></Pressable>
            </View>
          </View>
          <View style={styles.compactControl}>
            <Text style={styles.compactLabel}>{t("booksPerPage")}</Text>
            <View style={styles.compactOptions}>
              {PAGE_SIZES.map((size) => <Pressable key={size} accessibilityRole="button" accessibilityState={{ selected: pageSize === size }} onPress={() => setPageSize(size)} style={[styles.pageSizeOption, pageSize === size && styles.optionSelected]}><Text style={[styles.pageSizeText, pageSize === size && styles.selectedText]}>{size}</Text></Pressable>)}
            </View>
          </View>
        </View>
      </View>
      <Text style={styles.resultCount}>{t(visibleBooks.length === 1 ? "libraryResult" : "libraryResults", { count: visibleBooks.length })}</Text>
    </>
  )

  return (
    <FlatList
      key={viewMode}
      data={pagedBooks}
      keyExtractor={(book) => book.id}
      numColumns={viewMode === "card" ? 2 : 1}
      renderItem={({ item }) => {
        const disabled = disabledBookIds?.has(item.id) ?? false
        return <BookDisplay book={item} disabled={disabled} onPress={disabled ? undefined : () => onBookPress(item)} variant={viewMode} />
      }}
      ListHeaderComponent={controls}
      ListEmptyComponent={<View style={styles.emptyCard}><Ionicons name="library-outline" size={36} color={palette.textSoft} /><Text style={styles.emptyTitle}>{query.trim() ? t("noSearchResults") : emptyTitle}</Text><Text style={styles.emptyText}>{query.trim() ? t("noSearchResultsHint") : emptyText}</Text></View>}
      ListFooterComponent={visibleBooks.length ? <View style={styles.pagination}><Pressable accessibilityRole="button" accessibilityLabel={t("previousPage")} accessibilityState={{ disabled: page === 1 }} disabled={page === 1} onPress={() => setPage((current) => Math.max(1, current - 1))} style={[styles.pageButton, page === 1 && styles.disabled]}><Ionicons name="chevron-back" size={18} color={palette.text} /></Pressable><Text style={styles.pageText}>{t("pageOf", { page, total: totalPages })}</Text><Pressable accessibilityRole="button" accessibilityLabel={t("nextPage")} accessibilityState={{ disabled: page === totalPages }} disabled={page === totalPages} onPress={() => setPage((current) => Math.min(totalPages, current + 1))} style={[styles.pageButton, page === totalPages && styles.disabled]}><Ionicons name="chevron-forward" size={18} color={palette.text} /></Pressable></View> : null}
      contentContainerStyle={[styles.content, visibleBooks.length === 0 && styles.emptyContent]}
      columnWrapperStyle={viewMode === "card" && pagedBooks.length > 1 ? styles.row : undefined}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.text} /> : undefined}
    />
  )
}

const styles = StyleSheet.create({
  content: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", padding: 18, paddingBottom: 24 },
  emptyContent: { flexGrow: 1 },
  row: { justifyContent: "space-between" },
  eyebrow: { marginTop: 22, marginBottom: 5, color: palette.accentDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  title: { fontFamily: typography.serif, fontSize: 30, fontWeight: "700", color: palette.text },
  subtitle: { marginTop: 6, color: palette.textMuted, fontSize: 15 },
  message: { marginTop: 10, color: palette.danger },
  controlsCard: { gap: 14, marginTop: 18, marginBottom: 12, padding: 14, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.soft },
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
  pageSizeOption: { minWidth: 34, height: 32, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  optionSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  pageSizeText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  selectedText: { color: palette.paper },
  resultCount: { marginBottom: 9, color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  emptyCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 8, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surfaceMuted },
  emptyTitle: { marginTop: 4, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  emptyText: { color: palette.textMuted, textAlign: "center", lineHeight: 20 },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 8, paddingBottom: 74 },
  pageButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  disabled: { opacity: 0.38 },
  pageText: { minWidth: 110, textAlign: "center", color: palette.text, fontSize: 13, fontWeight: "700" },
})
