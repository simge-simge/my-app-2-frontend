import { Ionicons } from "@expo/vector-icons"
import { useEffect, useRef, useState } from "react"
import { Animated, Image, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native"

import { palette, radii, shadows, typography } from "@/constants/theme"
import type { Book } from "@/services/books"
import { useBookStatusLabel } from "@/localization/bookStatus"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  books: Book[]
  direction?: "left" | "right"
  reduceMotion: boolean
  showCommunity?: boolean
  coverSources?: Record<string, ImageSourcePropType>
  onBookPress: (book: Book) => void
}

const CARD_WIDTH = 142

export default function LandingBookRail({
  books,
  direction = "left",
  reduceMotion,
  showCommunity = false,
  coverSources,
  onBookPress,
}: Props) {
  const travel = useRef(new Animated.Value(direction === "left" ? 8 : -38)).current
  const animation = useRef<Animated.CompositeAnimation | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    animation.current?.stop()

    if (reduceMotion || paused || books.length < 2) {
      if (reduceMotion) travel.setValue(0)
      return
    }

    const start = direction === "left" ? 8 : -38
    const end = direction === "left" ? -38 : 8
    travel.setValue(start)
    animation.current = Animated.loop(
      Animated.sequence([
        Animated.timing(travel, { toValue: end, duration: 9000, useNativeDriver: true }),
        Animated.timing(travel, { toValue: start, duration: 9000, useNativeDriver: true }),
      ]),
    )
    animation.current.start()

    return () => animation.current?.stop()
  }, [books.length, direction, paused, reduceMotion, travel])

  return (
    <View style={styles.viewport}>
      <Animated.View style={[styles.row, { transform: [{ translateX: travel }] }]}>
        {books.map((book, index) => (
          <LandingBookCard
            key={`${direction}-${book.id}-${index}`}
            book={book}
            index={index}
            showCommunity={showCommunity}
            coverSource={coverSources?.[book.id]}
            onPress={() => onBookPress(book)}
            onInteractionStart={() => setPaused(true)}
            onInteractionEnd={() => setPaused(false)}
          />
        ))}
      </Animated.View>
    </View>
  )
}

function LandingBookCard({
  book,
  index,
  showCommunity,
  coverSource,
  onPress,
  onInteractionStart,
  onInteractionEnd,
}: {
  book: Book
  index: number
  showCommunity: boolean
  coverSource?: ImageSourcePropType
  onPress: () => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
}) {
  const bookStatusLabel = useBookStatusLabel()
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const tilt = index % 3 === 0 ? "-1.5deg" : index % 3 === 1 ? "1deg" : "-0.4deg"

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("bookBy", { title: book.title, author: book.author || t("unknownAuthor") })}
      onPress={onPress}
      onPressIn={onInteractionStart}
      onPressOut={onInteractionEnd}
      onHoverIn={() => {
        setHovered(true)
        onInteractionStart()
      }}
      onHoverOut={() => {
        setHovered(false)
        onInteractionEnd()
      }}
      style={({ pressed }) => [
        styles.card,
        { transform: [{ rotate: tilt }, { translateY: pressed || hovered ? -6 : 0 }, { scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={styles.coverWrap}>
        <View style={styles.spine} />
        {coverSource || book.cover_url ? (
          <Image source={coverSource ?? { uri: book.cover_url! }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <Ionicons name="book-outline" size={24} color={palette.ink} />
            <Text style={styles.fallbackLetter}>{book.title.slice(0, 1).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.pages} />
        <View style={[styles.bookmark, index % 2 === 0 && styles.bookmarkAlt]} />
      </View>

      <View style={styles.copy}>
        <Text numberOfLines={2} style={styles.title}>{book.title}</Text>
        <Text numberOfLines={1} style={styles.author}>{book.author || t("unknownAuthor")}</Text>
        {showCommunity && book.community_name ? (
          <View style={styles.communityRow}>
            <Ionicons name="people-outline" size={12} color={palette.accentDark} />
            <Text numberOfLines={1} style={styles.community}>{book.community_name}</Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.status}>{bookStatusLabel(book.status)}</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  viewport: { width: "100%", overflow: "hidden", paddingVertical: 7 },
  row: { flexDirection: "row", gap: 12, paddingHorizontal: 5 },
  card: {
    width: CARD_WIDTH,
    minHeight: 230,
    flexShrink: 0,
    backgroundColor: palette.paper,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    borderCurve: "continuous",
    ...shadows.soft,
  },
  coverWrap: { height: 142, margin: 7, marginBottom: 0, position: "relative" },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  coverFallback: { alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: palette.blueSoft },
  fallbackLetter: { fontFamily: typography.serif, fontSize: 30, fontWeight: "700", color: palette.ink },
  spine: { position: "absolute", left: 5, top: 0, bottom: 0, width: 3, zIndex: 2, backgroundColor: "rgba(56,51,45,0.24)", borderRadius: 2 },
  pages: { position: "absolute", right: -3, bottom: 5, width: 4, height: "88%", backgroundColor: palette.yellow, borderWidth: 1, borderLeftWidth: 0, borderColor: palette.borderStrong, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  bookmark: { position: "absolute", right: 12, top: -4, width: 12, height: 25, backgroundColor: palette.orange, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  bookmarkAlt: { backgroundColor: palette.rose },
  copy: { padding: 11, gap: 4 },
  title: { minHeight: 38, fontFamily: typography.serif, fontSize: 16, lineHeight: 19, fontWeight: "700", color: palette.ink },
  author: { fontSize: 11, color: palette.textMuted },
  communityRow: { minWidth: 0, flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  community: { flex: 1, fontSize: 10, color: palette.accentDark, fontWeight: "700" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green, borderWidth: 1, borderColor: palette.accentDark },
  status: { fontSize: 10, color: palette.accentDark, fontWeight: "800", textTransform: "capitalize" },
})
