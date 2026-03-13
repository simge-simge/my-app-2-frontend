import { useCallback, useState } from "react"
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

import BookDisplay from "@/components/BookDisplay"
import { getMyBooks, type Book } from "@/services/books"

export default function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBooks = useCallback(async (showLoader = false) => {
    if (showLoader) {
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
        <ActivityIndicator size="large" color="#4A6CF7" />
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
        renderItem={({ item }) => <BookDisplay book={item} />}
        contentContainerStyle={[
          styles.listContent,
          books.length === 0 && styles.emptyListContent,
        ]}
        columnWrapperStyle={books.length > 1 ? styles.row : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#4A6CF7" />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No books yet</Text>
            <Text style={styles.emptyText}>
              Add books from the app and they will appear here.
            </Text>
          </View>
        }
      />

      <Pressable style={styles.addButton} onPress={() => router.push("/books/new")}>
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FC",
    paddingHorizontal: 18,
    paddingTop: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    marginTop: 6,
    marginBottom: 18,
  },
  error: {
    color: "#B42318",
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F8FC",
  },
  addButton: {
    position: "absolute",
    bottom: 24,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#4A6CF7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1D4ED8",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 34,
    fontWeight: "400",
  },
})
