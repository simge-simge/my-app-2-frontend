import { useCallback, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"
import { useFocusEffect } from "expo-router"

import { getBookFeed, type Book } from "@/services/books"
import { createSwipe, type SwipeDirection } from "@/services/swipes"

const SWIPE_THRESHOLD = 120
const SWIPE_OUT_DURATION = 220
const STACK_SIZE = 3

export default function Explore() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimatingSwipe, setIsAnimatingSwipe] = useState(false)
  const position = useRef(new Animated.ValueXY()).current
  const { width } = useWindowDimensions()

  const loadBooks = useCallback(async (showLoader = false) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      setError(null)
      const response = await getBookFeed()
      setBooks(response)
      setCurrentIndex(0)
      setIsAnimatingSwipe(false)
      position.setValue({ x: 0, y: 0 })
    } catch (err) {
      console.error("Failed to load book feed", err)
      setError("Could not load books right now.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [position])

  useFocusEffect(
    useCallback(() => {
      loadBooks(true)
    }, [loadBooks])
  )

  const handleRefresh = () => {
    setRefreshing(true)
    loadBooks()
  }

  const forceSwipe = useCallback(
    (direction: SwipeDirection) => {
      const activeBook = books[currentIndex]

      if (!activeBook || isAnimatingSwipe) {
        return
      }

      setIsAnimatingSwipe(true)

      Animated.timing(position, {
        toValue: {
          x: direction === "right" ? width + 120 : -width - 120,
          y: 0,
        },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: true,
      }).start(async ({ finished }) => {
        if (!finished) {
          setIsAnimatingSwipe(false)
          return
        }

        try {
          setError(null)
          await createSwipe({
            target_book_id: activeBook.id,
            target_owner_user_id: activeBook.owner_id,
            direction,
          })
          position.setValue({ x: 0, y: 0 })
          setCurrentIndex((prev) => prev + 1)
        } catch (err) {
          console.error(`Failed to create ${direction} swipe`, err)
          position.setValue({ x: 0, y: 0 })
          setError("Could not save your swipe right now.")
        } finally {
          setIsAnimatingSwipe(false)
        }
      })
    },
    [books, currentIndex, isAnimatingSwipe, position, width]
  )

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
      friction: 5,
    }).start()
  }, [position])

  const panResponder = useMemo(
    () =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !isAnimatingSwipe && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !isAnimatingSwipe &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) &&
        Math.abs(gesture.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, gesture) => {
        if (isAnimatingSwipe) {
          return
        }

        position.setValue({ x: gesture.dx, y: gesture.dy })
      },
      onPanResponderRelease: (_, gesture) => {
        if (isAnimatingSwipe) {
          return
        }

        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe("right")
          return
        }

        if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe("left")
          return
        }

        resetPosition()
      },
      onPanResponderTerminate: resetPosition,
    }),
    [forceSwipe, isAnimatingSwipe, position, resetPosition]
  )

  const activeBook = books[currentIndex]
  const stackedBooks = books.slice(currentIndex + 1, currentIndex + STACK_SIZE + 1)
  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ["-14deg", "0deg", "14deg"],
    extrapolate: "clamp",
  })
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  })
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  })

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
      <Text style={styles.subtitle}>Swipe right or left to move through your community feed</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={[styles.content, books.length === 0 && styles.emptyListContent]}>
        {books.length === 0 || !activeBook ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No books to explore</Text>
            <Text style={styles.emptyText}>
              You have seen every available book in your feed for now.
            </Text>
          </View>
        ) : (
          <View style={styles.deckSection}>
            <View style={styles.deck}>
              {stackedBooks
                .slice()
                .reverse()
                .map((book, reverseIndex) => {
                  const stackIndex = stackedBooks.length - reverseIndex
                  const stackedStyle = {
                    top: stackIndex * 12,
                    transform: [{ scale: 1 - stackIndex * 0.04 }],
                    opacity: 1 - stackIndex * 0.14,
                    zIndex: STACK_SIZE - stackIndex,
                  } as const

                  return (
                    <View key={book.id} style={[styles.card, styles.stackedCard, stackedStyle]}>
                      <BookCard book={book} />
                    </View>
                  )
                })}

              <Animated.View
                key={activeBook.id}
                style={[
                  styles.card,
                  styles.topCard,
                  {
                    transform: [...position.getTranslateTransform(), { rotate }],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                <Animated.View style={[styles.swipeBadge, styles.likeBadge, { opacity: likeOpacity }]}>
                  <Text style={styles.swipeBadgeText}>RIGHT</Text>
                </Animated.View>
                <Animated.View style={[styles.swipeBadge, styles.nopeBadge, { opacity: nopeOpacity }]}>
                  <Text style={styles.swipeBadgeText}>LEFT</Text>
                </Animated.View>
                <BookCard book={activeBook} />
              </Animated.View>
            </View>

            <Text style={styles.counter}>
              {currentIndex + 1} / {books.length}
            </Text>

            <Text style={styles.refreshText} onPress={refreshing ? undefined : handleRefresh}>
              {refreshing ? "Refreshing..." : "Refresh deck"}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

function BookCard({ book }: { book: Book }) {
  const coverHeight = Math.min(Dimensions.get("window").width * 0.95, 360)

  return (
    <View key={book.id} style={styles.cardInner}>
      {book.cover_url ? (
        <Image
          key={`${book.id}-${book.cover_url}`}
          source={{ uri: book.cover_url }}
          style={[styles.cover, { height: coverHeight }]}
          resizeMode="cover"
          fadeDuration={0}
        />
      ) : (
        <View key={`${book.id}-fallback`} style={[styles.cover, styles.coverFallback, { height: coverHeight }]}>
          <Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.metaRow}>
          <Text style={styles.status}>{book.status}</Text>
          <Text style={styles.author}>{book.author || "Unknown author"}</Text>
        </View>

        <Text style={styles.cardTitle}>{book.title}</Text>

        <Text numberOfLines={4} style={styles.description}>
          {book.description || "No description yet for this book."}
        </Text>
      </View>
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
  content: {
    flex: 1,
    paddingBottom: 28,
  },
  deckSection: {
    flex: 1,
    paddingTop: 10,
  },
  deck: {
    flex: 1,
    minHeight: 620,
    position: "relative",
  },
  card: {
    position: "absolute",
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#E4E7EC",
    overflow: "hidden",
    shadowColor: "#101828",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  topCard: {
    top: 0,
    zIndex: 10,
  },
  outgoingCard: {
    zIndex: 20,
  },
  stackedCard: {
    left: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  cardInner: {
    backgroundColor: "#FFFFFF",
  },
  cover: {
    width: "100%",
    backgroundColor: "#D9E3FF",
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallbackText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#4A6CF7",
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  status: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4A6CF7",
    textTransform: "capitalize",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  author: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    color: "#667085",
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
    color: "#111827",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475467",
  },
  swipeBadge: {
    position: "absolute",
    top: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 3,
    borderRadius: 14,
    zIndex: 20,
    transform: [{ rotate: "-12deg" }],
  },
  likeBadge: {
    left: 20,
    borderColor: "#12B76A",
    backgroundColor: "rgba(18, 183, 106, 0.12)",
  },
  nopeBadge: {
    right: 20,
    borderColor: "#F04438",
    backgroundColor: "rgba(240, 68, 56, 0.12)",
    transform: [{ rotate: "12deg" }],
  },
  swipeBadgeText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: 1,
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
  counter: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    color: "#667085",
  },
  refreshText: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#4A6CF7",
  },
})
