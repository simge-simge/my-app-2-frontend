import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"

import { palette, radii, shadows, typography } from "@/constants/theme"
import type { Book } from "@/services/books"
import AdminBadge from "@/components/AdminBadge"
import { useTranslation } from "@/localization/LanguageContext"
import { useBookStatusLabel } from "@/localization/bookStatus"

type Props = { book: Book; disabled?: boolean; onPress?: () => void; onOwnerPress?: () => void; showOwner?: boolean; showCommunity?: boolean; style?: StyleProp<ViewStyle>; variant?: "card" | "list" }

export default function BookDisplay({ book, disabled = false, onPress, onOwnerPress, showOwner = false, showCommunity = false, style, variant = "card" }: Props) {
  const { t } = useTranslation()
  const bookStatusLabel = useBookStatusLabel()
  const ownerName = book.owner_name || t("unknown")
  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={t("bookBy", { title: book.title, author: book.author || t("unknownAuthor") })}
      accessibilityState={{ disabled }}
      disabled={disabled}
      style={({ pressed }) => [styles.card, variant === "list" && styles.listCard, pressed && styles.pressed, style]}
      onPress={onPress}
    >
      <View style={[styles.coverWrap, variant === "list" && styles.listCoverWrap]}>
        <View style={styles.spine} />
        {book.cover_url ? <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" /> : (
          <View style={[styles.cover, styles.coverFallback]}>
            <View style={styles.fallbackFrame}><Text style={styles.coverFallbackText}>{book.title.slice(0, 1).toUpperCase()}</Text></View>
          </View>
        )}
        <View style={styles.pageEdge} />
      </View>
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
            {book.owner_admin ? <AdminBadge /> : null}
          </Pressable>
        ) : null}
        {showCommunity && book.community_name ? <Text numberOfLines={1} style={styles.community}>{book.community_name}</Text> : null}
        <View style={styles.statusPill}><Text numberOfLines={1} style={styles.status}>{bookStatusLabel(book.status)}</Text></View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { width: "48%", backgroundColor: palette.paper, borderRadius: radii.md, borderCurve: "continuous", borderWidth: 1.5, borderColor: palette.borderStrong, marginBottom: 16, minHeight: 250, ...shadows.soft },
  listCard: { width: "100%", minHeight: 112, flexDirection: "row", marginBottom: 10 },
  pressed: { transform: [{ scale: 0.975 }, { rotate: "-0.6deg" }], shadowOpacity: 0.03 },
  coverWrap: { margin: 8, marginBottom: 0, height: 148, position: "relative" },
  listCoverWrap: { width: 68, height: 94, flexShrink: 0, marginBottom: 8 },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  spine: { position: "absolute", zIndex: 2, left: 5, top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: "rgba(56,51,45,0.28)" },
  pageEdge: { position: "absolute", right: -4, bottom: 5, width: 4, height: "88%", backgroundColor: palette.yellow, borderTopRightRadius: 4, borderBottomRightRadius: 4, borderWidth: 1, borderLeftWidth: 0, borderColor: palette.borderStrong },
  coverFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.blue },
  fallbackFrame: { width: "54%", aspectRatio: 1, borderRadius: 999, borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.yellow, alignItems: "center", justifyContent: "center" },
  coverFallbackText: { fontFamily: typography.serif, fontSize: 36, fontWeight: "700", color: palette.ink },
  content: { padding: 12, gap: 5 },
  listContent: { flex: 1, minWidth: 0, justifyContent: "center", paddingLeft: 10 },
  title: { fontFamily: typography.serif, fontSize: 17, lineHeight: 21, fontWeight: "700", color: palette.ink },
  listTitle: { fontSize: 16 },
  author: { fontSize: 12, color: palette.textMuted },
  owner: { flexShrink: 1, fontSize: 11, color: palette.textMuted },
  ownerLink: { color: palette.accentDark, textDecorationLine: "underline" },
  ownerRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  community: { fontSize: 11, color: palette.textSoft },
  statusPill: { alignSelf: "flex-start", marginTop: 2, backgroundColor: palette.accentSoft, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4 },
  status: { fontSize: 10, fontWeight: "800", color: palette.accentDark, textTransform: "capitalize" },
})
