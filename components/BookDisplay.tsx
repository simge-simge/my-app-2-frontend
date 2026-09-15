import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"
import { Image } from "expo-image"

import { palette, radii, shadows, typography } from "@/constants/theme"
import type { Book } from "@/services/books"
import { useTranslation } from "@/localization/LanguageContext"
import { useBookStatusLabel } from "@/localization/bookStatus"

type Props = {
  book: Book
  actionAccessibilityLabel?: string
  actionDisabled?: boolean
  actionLabel?: string
  disabled?: boolean
  onActionPress?: () => void
  onPress?: () => void
  onOwnerPress?: () => void
  showOwner?: boolean
  showCommunity?: boolean
  style?: StyleProp<ViewStyle>
  variant?: "card" | "list"
}

export default function BookDisplay({ book, actionAccessibilityLabel, actionDisabled = false, actionLabel, disabled = false, onActionPress, onPress, onOwnerPress, showOwner = false, showCommunity = false, style, variant = "card" }: Props) {
  const { t } = useTranslation()
  const bookStatusLabel = useBookStatusLabel()
  const ownerName = book.owner_name || t("unknown")
  const cover = (
    <View style={[styles.coverWrap, variant === "list" && styles.listCoverWrap]}>
      <View style={styles.spine} />
      {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.cover} contentFit="contain" cachePolicy="memory-disk" transition={120} /> : (
        <View style={[styles.cover, styles.coverFallback]}>
          <View style={styles.fallbackFrame}><Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text></View>
        </View>
      )}
      <View style={styles.pageEdge} />
    </View>
  )
  const content = (
    <View style={[styles.content, variant === "list" && styles.listContent]}>
          <Text numberOfLines={variant === "list" ? 1 : 2} style={[styles.title, variant === "list" && styles.listTitle]}>{book.title}</Text>
          <Text numberOfLines={1} style={styles.author}>{book.author || t("unknownAuthor")}</Text>
          {showOwner ? (
            <Pressable
              accessibilityRole={onOwnerPress ? "button" : undefined}
              accessibilityLabel={onOwnerPress ? t("viewLibrary", { name: ownerName }) : undefined}
              disabled={!onOwnerPress}
              onPress={(event) => { event.stopPropagation(); onOwnerPress?.() }}
            style={styles.ownerRow}
          >
            <Text numberOfLines={1} style={[styles.owner, onOwnerPress && styles.ownerLink]}>{t("owner", { name: ownerName })}</Text>
          </Pressable>
          ) : null}
          {showCommunity && book.community_name ? <Text numberOfLines={1} style={styles.community}>{book.community_name}</Text> : null}
    </View>
  )
  const statusRow = (
    <View style={[styles.statusRow, variant === "list" && styles.listStatusRow]}>
        <View style={styles.statusPill}><Text numberOfLines={1} style={styles.status}>{bookStatusLabel(book.status)}</Text></View>
        {actionLabel ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={actionAccessibilityLabel || actionLabel}
            accessibilityState={{ disabled: actionDisabled }}
            disabled={actionDisabled}
            onPress={onActionPress}
            style={({ pressed }) => [styles.cardAction, actionDisabled && styles.cardActionDisabled, pressed && styles.cardActionPressed]}
          >
            <Text numberOfLines={1} style={[styles.cardActionText, actionDisabled && styles.cardActionTextDisabled]}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
  )

  if (variant === "list") {
    return (
      <View style={[styles.card, styles.listCard, styles.listLayout, style]}>
        <Pressable
          accessible={false}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [styles.listCoverPressable, pressed && styles.pressed]}
        >
          {cover}
        </Pressable>
        <View style={styles.listBody}>
          <Pressable
          accessibilityRole={onPress ? "button" : undefined}
          accessibilityLabel={t("bookBy", { title: book.title, author: book.author || t("unknownAuthor") })}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [styles.details, styles.listDetails, pressed && styles.pressed]}
        >
          {content}
          </Pressable>
          {statusRow}
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.card, style]}>
      <Pressable
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={t("bookBy", { title: book.title, author: book.author || t("unknownAuthor") })}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        {cover}
        {content}
      </Pressable>
      {statusRow}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { width: "48%", backgroundColor: palette.paper, borderRadius: radii.lg, borderCurve: "continuous", borderWidth: 1, borderColor: palette.border, marginBottom: 16, minHeight: 250, ...shadows.soft },
  listCard: { width: "100%", minHeight: 124, marginBottom: 10 },
  listLayout: { flexDirection: "row", alignItems: "stretch" },
  details: { flex: 1 },
  listDetails: { flexGrow: 1 },
  listCoverPressable: { width: 92, alignSelf: "stretch" },
  pressed: { opacity: 0.84 },
  coverWrap: { margin: 8, marginBottom: 0, height: 148, position: "relative", overflow: "hidden", borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  listCoverWrap: { width: "auto", height: "auto", minHeight: 108, flex: 1, alignSelf: "stretch", marginBottom: 8 },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  spine: { position: "absolute", zIndex: 2, left: 5, top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: "rgba(56,51,45,0.28)" },
  pageEdge: { position: "absolute", right: -3, bottom: 6, width: 3, height: "86%", backgroundColor: palette.border, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  coverFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  fallbackFrame: { width: "50%", aspectRatio: 1, borderRadius: radii.round, backgroundColor: palette.paper, alignItems: "center", justifyContent: "center" },
  coverFallbackText: { fontFamily: typography.serif, fontSize: 36, fontWeight: "700", color: palette.ink },
  content: { padding: 13, gap: 5 },
  listBody: { flex: 1, minWidth: 0, justifyContent: "space-between" },
  listContent: { flexGrow: 1, minWidth: 0, justifyContent: "center", paddingLeft: 10, paddingBottom: 6 },
  title: { fontFamily: typography.serif, fontSize: 16, lineHeight: 21, fontWeight: "700", letterSpacing: -0.2, color: palette.ink },
  listTitle: { fontSize: 16 },
  author: { fontSize: 12, color: palette.textMuted },
  owner: { flexShrink: 1, fontSize: 11, color: palette.textMuted },
  ownerLink: { color: palette.accentDark, textDecorationLine: "underline" },
  ownerRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  community: { fontSize: 11, color: palette.textSoft },
  statusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, paddingHorizontal: 12, paddingBottom: 12 },
  listStatusRow: { paddingLeft: 10, paddingTop: 0 },
  statusPill: { minHeight: 28, alignSelf: "flex-start", justifyContent: "center", backgroundColor: palette.accentSoft, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4 },
  status: { fontSize: 11, lineHeight: 14, fontWeight: "600", color: palette.accentDark, textTransform: "capitalize" },
  cardAction: { minHeight: 28, flexShrink: 1, justifyContent: "center", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: palette.accent },
  cardActionDisabled: { backgroundColor: palette.blueSoft },
  cardActionPressed: { opacity: 0.8 },
  cardActionText: { color: palette.white, fontSize: 11, lineHeight: 14, fontWeight: "600" },
  cardActionTextDisabled: { color: palette.text },
})
