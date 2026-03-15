import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native"
import { useFocusEffect } from "expo-router"

import BookDisplay from "@/components/BookDisplay"
import { getBookFeed, type Book } from "@/services/books"

export default function Explore() {
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
      const response = await getBookFeed()
      setBooks(response)
    } catch (err) {
      console.error("Failed to load book feed", err)
      setError("Could not load books right now.")
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
      <Text style={styles.title}>Explore</Text>
      <Text style={styles.subtitle}>Books available from your community feed</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <BookDisplay
            book={item}
            onPress={undefined}
          />
        )}
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
            <Text style={styles.emptyTitle}>No books to explore</Text>
            <Text style={styles.emptyText}>
              You have seen every available book in your feed for now.
            </Text>
          </View>
        }
      />
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
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  row: {
    justifyContent: "space-between",
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
})
