import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import type { Book } from "@/services/books"

type Props = {
  book: Book
  onPress?: () => void
}

export default function BookDisplay({ book, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {book.cover_url ? (
        <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={[styles.cover, styles.coverFallback]}>
          <Text style={styles.coverFallbackText}>
            {book.title.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.title}>
          {book.title}
        </Text>

        <Text numberOfLines={1} style={styles.author}>
          {book.author || "Unknown author"}
        </Text>

        <Text numberOfLines={1} style={styles.status}>
          {book.status}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E4E7EC",
    marginBottom: 12,
    minHeight: 220,
  },
  cover: {
    width: "100%",
    height: 130,
    backgroundColor: "#D9E3FF",
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallbackText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4A6CF7",
  },
  content: {
    padding: 12,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  author: {
    fontSize: 13,
    color: "#6B7280",
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A6CF7",
    textTransform: "capitalize",
  },
})
