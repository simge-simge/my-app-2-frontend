import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import BookDisplay from "@/components/BookDisplay"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { requestToBorrowBook, searchBooks, type Book, type SearchScope } from "@/services/books"
import { searchProfiles, type ProfileSearchResult } from "@/services/profile"
import { supabase } from "@/utils/supabase"

const SEARCH_DELAY_MS = 300

type SearchMode = "books" | "users"

const SEARCH_MODES: { label: string; value: SearchMode }[] = [
  { label: "Search Books", value: "books" },
  { label: "Search Users", value: "users" },
]

const SEARCH_SCOPES: { label: string; value: SearchScope }[] = [
  { label: "Community", value: "community" },
  { label: "All", value: "all" },
]

export default function Search() {
  const [mode, setMode] = useState<SearchMode>("books")
  const [scope, setScope] = useState<SearchScope>("community")
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<ProfileSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [requestingBookIds, setRequestingBookIds] = useState<Set<string>>(() => new Set())
  const [requestedBookIds, setRequestedBookIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null)
    })
  }, [])

  useEffect(() => {
    const searchTerm = query.trim()

    if (!searchTerm) {
      setBooks([])
      setUsers([])
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const timeout = setTimeout(async () => {
      try {
        if (mode === "books") {
          const response = await searchBooks(searchTerm, scope)
          if (!cancelled) {
            setBooks(response)
            setUsers([])
          }
        } else {
          const response = await searchProfiles(searchTerm, scope)
          if (!cancelled) {
            setUsers(response)
            setBooks([])
          }
        }
      } catch (err) {
        console.error(`Failed to search ${mode}`, err)
        if (!cancelled) {
          setBooks([])
          setUsers([])
          setError(`Could not search ${mode} right now.`)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, SEARCH_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [mode, query, scope])

  const handleBorrowRequest = async (book: Book) => {
    setRequestingBookIds((ids) => new Set(ids).add(book.id))
    try {
      await requestToBorrowBook(book.id)
      setRequestedBookIds((ids) => new Set(ids).add(book.id))
    } catch (err) {
      console.error("Failed to send borrow request", err)
      Alert.alert("Request not sent", err instanceof Error ? err.message : "Please try again.")
    } finally {
      setRequestingBookIds((ids) => {
        const next = new Set(ids)
        next.delete(book.id)
        return next
      })
    }
  }

  const searchTerm = query.trim()
  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons
        name={searchTerm ? (mode === "books" ? "book-outline" : "people-outline") : "search-outline"}
        size={36}
        color={palette.textSoft}
      />
      <Text style={styles.emptyTitle}>
        {searchTerm ? `No matching ${mode}` : `Search ${mode}`}
      </Text>
      <Text style={styles.emptyText}>
        {searchTerm
          ? `No ${mode} match "${searchTerm}" in this scope.`
          : `Enter a search term to search ${scope === "community" ? "your community" : "public communities"}.`}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <Text style={styles.subtitle}>Find books and readers in your community</Text>

      <SegmentedControl
        accessibilityLabel="Search type"
        options={SEARCH_MODES}
        selected={mode}
        onSelect={setMode}
      />

      <SegmentedControl
        accessibilityLabel="Search scope"
        options={SEARCH_SCOPES}
        selected={scope}
        onSelect={setScope}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onChangeText={setQuery}
          placeholder={mode === "books" ? "Search books..." : "Search users..."}
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.text} />
        </View>
      ) : mode === "books" ? (
        <FlatList
          key="book-results"
          data={books}
          keyExtractor={(item) => item.id}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.bookCell}>
              <BookDisplay
                book={item}
                showOwner
                showCommunity={scope === "all"}
                style={styles.bookCard}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ask to borrow ${item.title}`}
                disabled={
                  item.owner_id === currentUserId ||
                  requestingBookIds.has(item.id) ||
                  item.borrow_requested || requestedBookIds.has(item.id)
                }
                onPress={() => handleBorrowRequest(item)}
                style={({ pressed }) => [
                  styles.borrowButton,
                  (item.owner_id === currentUserId || item.borrow_requested || requestedBookIds.has(item.id)) && styles.borrowButtonDisabled,
                  pressed && styles.borrowButtonPressed,
                ]}
              >
                {requestingBookIds.has(item.id) ? (
                  <ActivityIndicator size="small" color={palette.white} />
                ) : (
                  <Text style={styles.borrowButtonText}>
                    {item.owner_id === currentUserId
                      ? "Your book"
                      : item.borrow_requested || requestedBookIds.has(item.id)
                        ? "Request sent"
                        : "Ask to borrow"}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
          contentContainerStyle={[styles.listContent, books.length === 0 && styles.emptyListContent]}
          columnWrapperStyle={styles.bookRow}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
        />
      ) : (
        <FlatList
          key="user-results"
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserResult user={item} showCommunity={scope === "all"} />}
          contentContainerStyle={[styles.listContent, users.length === 0 && styles.emptyListContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
        />
      )}
    </View>
  )
}

function SegmentedControl<T extends string>({
  accessibilityLabel,
  options,
  selected,
  onSelect,
}: {
  accessibilityLabel: string
  options: { label: string; value: T }[]
  selected: T
  onSelect: (value: T) => void
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.segmented}>
      {options.map((option) => {
        const isSelected = selected === option.value
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text
              numberOfLines={1}
              style={[styles.segmentText, isSelected && styles.segmentTextSelected]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function UserResult({ user, showCommunity }: { user: ProfileSearchResult; showCommunity: boolean }) {
  const displayName = user.display_name || "Unknown reader"
  return (
    <View style={styles.userCard}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userDetails}>
        <View style={styles.userNameRow}>
          <Text numberOfLines={1} style={styles.userName}>{displayName}</Text>
          {user.admin ? <Ionicons name="shield-checkmark" size={16} color={palette.accentDark} /> : null}
        </View>
        {showCommunity && user.community_name ? (
          <Text numberOfLines={1} style={styles.communityName}>{user.community_name}</Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: "100%",
    maxWidth: layout.contentMax,
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
    marginBottom: 18,
  },
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  segmentSelected: {
    backgroundColor: palette.accent,
    ...shadows.soft,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.textMuted,
  },
  segmentTextSelected: {
    color: palette.white,
  },
  searchBar: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: palette.text },
  clearButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  error: { color: palette.danger, marginBottom: 12 },
  listContent: { paddingBottom: 24 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  bookRow: { gap: 12 },
  bookCell: { flexGrow: 1, flexBasis: 0, width: "48%" },
  bookCard: { width: "100%" },
  borrowButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    paddingHorizontal: 10,
    marginTop: -7,
    marginBottom: 14,
    backgroundColor: palette.accent,
  },
  borrowButtonDisabled: { backgroundColor: palette.textSoft },
  borrowButtonPressed: { opacity: 0.8 },
  borrowButtonText: { color: palette.white, fontSize: 13, fontWeight: "700" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    marginBottom: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: palette.textSoft },
  userDetails: { flex: 1, minWidth: 0, gap: 4 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  userName: { flexShrink: 1, fontSize: 17, fontWeight: "700", color: palette.text },
  communityName: { fontSize: 13, color: palette.textMuted },
  emptyState: { alignSelf: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 22, gap: 8, backgroundColor: palette.blueSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, transform: [{ rotate: "-0.5deg" }] },
  emptyTitle: { marginTop: 4, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  emptyText: { maxWidth: 320, fontSize: 14, lineHeight: 20, color: palette.textMuted, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
})
