import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { palette } from "@/constants/theme"
import type { Book } from "@/services/books"
import AdminBadge from "@/components/AdminBadge"

type Props = {
  book: Book
  onPress?: () => void
  showOwner?: boolean
}

export default function BookDisplay({ book, onPress, showOwner = false }: Props) {
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

        {showOwner ? (
          <View style={styles.ownerRow}>
            <Text numberOfLines={1} style={styles.owner}>
              Owner: {book.owner_name || "Unknown"}
            </Text>
            {book.owner_admin ? <AdminBadge /> : null}
          </View>
        ) : null}

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
    backgroundColor: palette.surface,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
    minHeight: 220,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cover: {
    width: "100%",
    height: 130,
    backgroundColor: palette.surfaceMuted,
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverFallbackText: {
    fontSize: 32,
    fontWeight: "700",
    color: palette.textSoft,
  },
  content: {
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
  },
  author: {
    fontSize: 13,
    color: palette.textMuted,
  },
  owner: {
    flexShrink: 1,
    fontSize: 12,
    color: palette.textMuted,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  status: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.textSoft,
    textTransform: "capitalize",
  },
})
