import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import BookDisplay from "@/components/BookDisplay"
import { palette } from "@/constants/theme"
import {
  searchBooks,
  type Book,
  type BookSearchField,
} from "@/services/books"

const SEARCH_DELAY_MS = 300
const SEARCH_FILTERS: { label: string; value: BookSearchField }[] = [
  { label: "All", value: "all" },
  { label: "Title", value: "title" },
  { label: "Author", value: "author" },
  { label: "Owner", value: "owner" },
]

export default function Search() {
  const [query, setQuery] = useState("")
  const [field, setField] = useState<BookSearchField>("all")
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const searchTerm = query.trim()

    if (!searchTerm) {
      setBooks([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timeout = setTimeout(async () => {
      try {
        const response = await searchBooks(searchTerm, field)

        if (!cancelled) {
          setBooks(response)
        }
      } catch (err) {
        console.error("Failed to search books", err)

        if (!cancelled) {
          setBooks([])
          setError("Could not search books right now.")
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }, SEARCH_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [field, query])

  const searchTerm = query.trim()
  const activeFilter = SEARCH_FILTERS.find((filter) => filter.value === field)
  const placeholder =
    field === "all"
      ? "Search books"
      : `Search by ${activeFilter?.label.toLowerCase()}`
  const emptyFilterDescription =
    field === "all"
      ? "across all fields"
      : `by ${activeFilter?.label.toLowerCase()}`

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search Books</Text>
      <Text style={styles.subtitle}>Find available titles in your community</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={palette.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {query ? (
          <Pressable
            accessibilityLabel="Clear search"
            hitSlop={10}
            onPress={() => setQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        contentContainerStyle={styles.filters}
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
      >
        {SEARCH_FILTERS.map((filter) => {
          const selected = filter.value === field

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={filter.value}
              onPress={() => setField(filter.value)}
              style={[styles.filterButton, selected && styles.filterButtonSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.text} />
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => <BookDisplay book={item} showOwner />}
          contentContainerStyle={[
            styles.listContent,
            books.length === 0 && styles.emptyListContent,
          ]}
          columnWrapperStyle={books.length > 1 ? styles.row : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={searchTerm ? "book-outline" : "search-outline"}
                size={36}
                color={palette.textSoft}
              />
              <Text style={styles.emptyTitle}>
                {searchTerm ? "No matching books" : "Search your community"}
              </Text>
              <Text style={styles.emptyText}>
                {searchTerm
                  ? `No available books match "${searchTerm}" ${emptyFilterDescription}.`
                  : "Enter a search term to see available matches."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
  },
  subtitle: {
    fontSize: 15,
    color: palette.textMuted,
    marginTop: 6,
    marginBottom: 18,
  },
  searchBar: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: palette.text,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  filters: {
    gap: 8,
    paddingBottom: 18,
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterButton: {
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 8,
  },
  filterButtonSelected: {
    backgroundColor: palette.surfaceStrong,
    borderColor: palette.surfaceStrong,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.textMuted,
  },
  filterTextSelected: {
    color: palette.white,
  },
  error: {
    color: palette.danger,
    marginBottom: 12,
  },
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
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
  },
  emptyText: {
    maxWidth: 320,
    fontSize: 14,
    lineHeight: 20,
    color: palette.textMuted,
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
})
