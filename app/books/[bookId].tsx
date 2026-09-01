import { Ionicons } from "@expo/vector-icons"
import { router, useFocusEffect, useLocalSearchParams } from "expo-router"
import { useCallback, useRef, useState } from "react"
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { getCachedApiData } from "@/services/api"
import { getBook, type Book } from "@/services/books"
import { supabase } from "@/utils/supabase"
import { useBookStatusLabel } from "@/localization/bookStatus"
import { useTranslation } from "@/localization/LanguageContext"

export default function BookDetailsScreen() {
  const bookStatusLabel = useBookStatusLabel()
  const { language, t } = useTranslation()
  const { bookId } = useLocalSearchParams<{ bookId: string }>()
  const cachePath = bookId ? `/books/${bookId}` : ""
  const cachedBook = getCachedApiData<Book>(cachePath)
  const [book, setBook] = useState<Book | null>(() => cachedBook ?? null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(() => cachedBook === undefined)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(cachedBook !== undefined)

  const loadBook = useCallback(async (refresh = false) => {
    if (!bookId) return
    if (refresh) setRefreshing(true)
    else if (!hasLoaded.current) setLoading(true)

    try {
      setError(null)
      const [{ data }, response] = await Promise.all([
        supabase.auth.getSession(),
        getBook(bookId),
      ])
      setCurrentUserId(data.session?.user.id ?? null)
      setBook(response)
      hasLoaded.current = true
    } catch (err) {
      console.error("Failed to load book", err)
      setError(t("bookLoadError"))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [bookId, t])

  useFocusEffect(useCallback(() => { loadBook() }, [loadBook]))

  const isOwner = Boolean(book && currentUserId && book.owner_id === currentUserId)
  const openEditor = () => {
    if (!bookId || !isOwner) return
    router.push({ pathname: "/books/edit/[bookId]", params: { bookId } })
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={palette.accent} /></View>
  }

  if (!book) {
    return (
      <View style={styles.center}>
        <Ionicons name="book-outline" size={42} color={palette.textSoft} />
        <Text style={styles.errorTitle}>{t("bookUnavailable")}</Text>
        <Text style={styles.errorText}>{error ?? t("bookNotFound")}</Text>
      </View>
    )
  }

  return (
    <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadBook(true)} tintColor={palette.accent} />}
      >
        <View style={styles.hero}>
          <View style={styles.coverWrap}>
            {book.cover_url ? (
              <Image source={{ uri: book.cover_url }} style={styles.cover} resizeMode="cover" />
            ) : (
              <View style={[styles.cover, styles.coverFallback]}>
                <Text style={styles.coverLetter}>{book.title.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.pageEdge} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.title}>{book.title}</Text>
            <Text style={styles.author}>{book.author || t("unknownAuthor")}</Text>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{bookStatusLabel(book.status)}</Text>
            </View>
            {isOwner ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t("editNamedBook", { title: book.title })} onPress={openEditor} style={({ pressed }) => [styles.editButton, styles.inlineEditButton, pressed && styles.editButtonPressed]}>
                <Ionicons name="create-outline" size={18} color={palette.accentDark} />
                <Text style={styles.editButtonText}>{t("edit")}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>{t("bookInformation")}</Text>
          <DetailRow label={t("author")} value={book.author || t("unknownAuthor")} />
          <DetailRow label={t("isbn")} value={book.isbn || t("notProvided")} />
          <DetailRow label={t("added")} value={formatDate(book.created_at, language, t("unknown"))} />
          <View style={styles.descriptionBlock}>
            <Text style={styles.detailLabel}>{t("description")}</Text>
            <Text style={styles.description}>{book.description || t("noDescriptionProvided")}</Text>
          </View>
        </View>
    </ScrollView>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  )
}

function formatDate(value: string, language: "en" | "tr", fallback: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-US", { month: "long", day: "numeric", year: "numeric" }).format(date)
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 22, paddingBottom: 48, gap: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, padding: 28, backgroundColor: palette.background },
  errorTitle: { fontFamily: typography.serif, fontSize: 22, fontWeight: "700", color: palette.text },
  errorText: { color: palette.textMuted, textAlign: "center" },
  editButton: { minHeight: 36, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, borderRadius: radii.round, backgroundColor: palette.accentSoft },
  editButtonPressed: { opacity: 0.7 },
  inlineEditButton: { marginTop: 14 },
  editButtonText: { color: palette.accentDark, fontSize: 14, fontWeight: "800" },
  hero: { flexDirection: "row", alignItems: "center", gap: 22, padding: 20, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, backgroundColor: palette.paper, ...shadows.lifted },
  coverWrap: { width: 142, height: 208, position: "relative" },
  cover: { width: "100%", height: "100%", borderRadius: radii.sm, backgroundColor: palette.surfaceMuted },
  coverFallback: { alignItems: "center", justifyContent: "center", backgroundColor: palette.blue, borderWidth: 1.5, borderColor: palette.borderStrong },
  coverLetter: { fontFamily: typography.serif, fontSize: 58, fontWeight: "700", color: palette.ink },
  pageEdge: { position: "absolute", right: -5, top: 9, bottom: 9, width: 5, borderWidth: 1, borderLeftWidth: 0, borderColor: palette.borderStrong, borderTopRightRadius: 4, borderBottomRightRadius: 4, backgroundColor: palette.yellow },
  heroText: { flex: 1, minWidth: 0, alignItems: "flex-start" },
  title: { fontFamily: typography.serif, fontSize: 29, lineHeight: 35, fontWeight: "700", color: palette.text },
  author: { marginTop: 9, fontSize: 16, lineHeight: 22, color: palette.textMuted },
  statusPill: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radii.round, backgroundColor: palette.accentSoft },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.accent },
  statusText: { color: palette.accentDark, fontSize: 12, fontWeight: "800", textTransform: "capitalize" },
  detailsCard: { padding: 20, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.soft },
  sectionTitle: { marginBottom: 7, fontFamily: typography.serif, fontSize: 21, fontWeight: "700", color: palette.text },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  detailLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  detailValue: { flex: 1, color: palette.text, fontSize: 14, textAlign: "right" },
  descriptionBlock: { paddingTop: 16, gap: 8 },
  description: { color: palette.text, fontSize: 15, lineHeight: 23 },
})
