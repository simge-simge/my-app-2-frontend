import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { router, useFocusEffect } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import BookDisplay from "@/components/BookDisplay"
import { palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getMyBooks, type Book } from "@/services/books"

export default function Library() {
  const cachedBooks = getCachedApiData<Book[]>("/books/me")
  const [books, setBooks] = useState<Book[]>(() => cachedBooks ?? [])
  const [loading, setLoading] = useState(() => cachedBooks === undefined)
  const hasLoaded = useRef(cachedBooks !== undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBooks = useCallback(async (showLoader = false) => {
    if (showLoader && !hasLoaded.current) {
      setLoading(true)
    }

    try {
      setError(null)
      const response = await getMyBooks()
      setBooks(response)
    } catch (err) {
      console.error("Failed to load books", err)
      setError("Could not load your library.")
    } finally {
      hasLoaded.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadBooks(true)
    }, [loadBooks])
  )

  const handleRefresh = () => {
    setRefreshing(true)
    loadBooks()
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
      <Text style={styles.title}>My Library</Text>
      <Text style={styles.subtitle}>Books you have added to your shelf</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => <BookDisplay book={item} onPress={() => router.push(`/books/${item.id}`)} />}
        contentContainerStyle={[styles.listContent, books.length === 0 && styles.emptyListContent]}
        columnWrapperStyle={books.length > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.text} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIllustration}><Ionicons name="library-outline" size={34} color={palette.ink} /></View>
            <Text style={styles.emptyTitle}>No books yet</Text>
            <Text style={styles.emptyText}>Add your first book and begin a shelf worth sharing.</Text>
          </View>
        }
      />

      <Pressable accessibilityRole="button" accessibilityLabel="Add book" style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]} onPress={() => router.push("/books/new")}>
        <Ionicons name="add" size={32} color={palette.white} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 18,
    paddingTop: 18,
    width: "100%",
    maxWidth: 960,
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
