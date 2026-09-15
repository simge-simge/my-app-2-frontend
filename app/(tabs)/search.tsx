import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import BookDisplay from "@/components/BookDisplay"
import ConfirmationModal from "@/components/ConfirmationModal"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { requestToBorrowBook, searchBooks, type Book, type SearchScope } from "@/services/books"
import { getProfile, searchProfiles, type Profile, type ProfileSearchResult } from "@/services/profile"
import { listCommunityMembers, removeCommunityMember } from "@/services/communities"
import { supabase } from "@/utils/supabase"
import { runInBackground } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

const SEARCH_DELAY_MS = 300

type SearchMode = "books" | "users"
type UserSort = "nameAsc" | "nameDesc"
type BookSort = "newest" | "oldest" | "titleAsc" | "titleDesc"
type ViewMode = "card" | "list"

export default function Search() {
  const { language, t } = useTranslation()
  const searchModes: { label: string; value: SearchMode }[] = [
    { label: t("searchBooks"), value: "books" },
    { label: t("searchUsers"), value: "users" },
  ]
  const searchScopes: { label: string; value: SearchScope }[] = [
    { label: t("community"), value: "community" },
    { label: t("all"), value: "all" },
  ]
  const [mode, setMode] = useState<SearchMode>("books")
  const [scope, setScope] = useState<SearchScope>("community")
  const [userSort, setUserSort] = useState<UserSort>("nameAsc")
  const [bookSort, setBookSort] = useState<BookSort>("newest")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [query, setQuery] = useState("")
  const [books, setBooks] = useState<Book[]>([])
  const [users, setUsers] = useState<ProfileSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [removingUserIds, setRemovingUserIds] = useState<Set<string>>(() => new Set())
  const [pendingRemoval, setPendingRemoval] = useState<ProfileSearchResult | null>(null)
  const [requestedBookIds, setRequestedBookIds] = useState<Set<string>>(() => new Set())
  const searchContext = useRef("")
  const adminCommunityId = mode === "users" && scope === "community" && currentProfile?.admin
    ? currentProfile.community_id
    : null

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null)
    })
  }, [])

  useEffect(() => {
    let active = true
    getProfile()
      .then((profile) => {
        if (active) setCurrentProfile(profile)
      })
      .catch((err) => console.error("Failed to load search permissions", err))
    return () => { active = false }
  }, [])

  useEffect(() => {
    const searchTerm = query.trim()
    const nextSearchContext = `${mode}:${scope}:${adminCommunityId ?? ""}`
    if (searchContext.current !== nextSearchContext) {
      if (mode === "books") setBooks([])
      else setUsers([])
      searchContext.current = nextSearchContext
    }

    let cancelled = false
    const controller = new AbortController()
    setLoading(false)
    setError(null)

    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        if (mode === "books") {
          const response = await searchBooks(searchTerm, scope, controller.signal)
          if (!cancelled) {
            setBooks(response)
            setUsers([])
          }
        } else {
          const response = adminCommunityId
            ? await listCommunityMembers(adminCommunityId, searchTerm, controller.signal)
            : await searchProfiles(searchTerm, scope, controller.signal)
          if (!cancelled) {
            setUsers(response)
            setBooks([])
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return
        console.error(`Failed to search ${mode}`, err)
        if (!cancelled) {
          setError(t("searchFailed", { type: t(mode) }))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, SEARCH_DELAY_MS)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      controller.abort()
    }
  }, [adminCommunityId, mode, query, scope, t])

  const removeUser = async (user: ProfileSearchResult) => {
    if (!currentProfile?.community_id) return
    setRemovingUserIds((ids) => new Set(ids).add(user.id))
    try {
      await removeCommunityMember(currentProfile.community_id, user.id)
      setUsers((items) => items.filter((item) => item.id !== user.id))
    } catch (err) {
      console.error("Failed to remove community member", err)
      Alert.alert(t("memberNotRemoved"), err instanceof Error ? err.message : t("tryAgain"))
    } finally {
      setRemovingUserIds((ids) => {
        const next = new Set(ids)
        next.delete(user.id)
        return next
      })
    }
  }

  const confirmRemoveUser = (user: ProfileSearchResult) => {
    setPendingRemoval(user)
  }

  const handleBorrowRequest = (book: Book) => {
    setRequestedBookIds((ids) => new Set(ids).add(book.id))
    runInBackground(() => requestToBorrowBook(book.id), {
      onError: (err) => {
        setRequestedBookIds((ids) => {
          const next = new Set(ids)
          next.delete(book.id)
          return next
        })
        console.error("Failed to send borrow request", err)
        Alert.alert(t("requestNotSent"), err instanceof Error ? err.message : t("tryAgain"))
      },
    })
  }

  const searchTerm = query.trim()
  const showingAdminMemberList = Boolean(adminCommunityId)
  const sortedBooks = useMemo(() => {
    const locale = language === "tr" ? "tr-TR" : "en-US"
    return [...books].sort((left, right) => {
      if (bookSort === "titleAsc") return left.title.localeCompare(right.title, locale, { sensitivity: "base" })
      if (bookSort === "titleDesc") return right.title.localeCompare(left.title, locale, { sensitivity: "base" })
      const leftTime = new Date(left.created_at).getTime() || 0
      const rightTime = new Date(right.created_at).getTime() || 0
      return bookSort === "oldest" ? leftTime - rightTime : rightTime - leftTime
    })
  }, [bookSort, books, language])
  const sortedUsers = useMemo(() => {
    const locale = language === "tr" ? "tr-TR" : "en-US"
    return [...users].sort((left, right) => {
      const comparison = (left.display_name || "").localeCompare(
        right.display_name || "",
        locale,
        { sensitivity: "base" },
      )
      return userSort === "nameAsc" ? comparison : -comparison
    })
  }, [language, userSort, users])
  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons
        name={searchTerm ? (mode === "books" ? "book-outline" : "people-outline") : "search-outline"}
        size={36}
        color={palette.textSoft}
      />
      <Text style={styles.emptyTitle}>
        {searchTerm
          ? t("noMatching", { type: t(mode) })
          : showingAdminMemberList
            ? t("noCommunityMembers")
          : t("searchTypePrompt", { type: t(mode) })}
      </Text>
      <Text style={styles.emptyText}>
        {searchTerm
          ? t("noMatchesScope", { type: t(mode), query: searchTerm })
          : showingAdminMemberList
            ? t("noCommunityMembersHint")
          : t("enterSearch", { scope: t(scope === "community" ? "yourCommunity" : "publicCommunities") })}
      </Text>
    </View>
  )

  return (
    <View style={styles.container}>
      <ConfirmationModal
        visible={pendingRemoval !== null}
        title={t("removeCommunityMember")}
        message={t("removeCommunityMemberConfirm", {
          name: pendingRemoval?.display_name || t("unknownReader"),
        })}
        cancelLabel={t("cancel")}
        confirmLabel={t("remove")}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (!pendingRemoval) return
          const member = pendingRemoval
          setPendingRemoval(null)
          void removeUser(member)
        }}
      />
      <Text style={styles.title}>{t("search")}</Text>
      <Text style={styles.subtitle}>{t("searchSubtitle")}</Text>

      <SegmentedControl
        accessibilityLabel={t("searchType")}
        options={searchModes}
        selected={mode}
        onSelect={setMode}
      />

      <SegmentedControl
        accessibilityLabel={t("searchScope")}
        options={searchScopes}
        selected={scope}
        onSelect={setScope}
      />

      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
          onChangeText={setQuery}
          placeholder={mode === "books" ? t("searchBooksPlaceholder") : t("searchUsersPlaceholder")}
          placeholderTextColor={palette.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={query}
        />
        {loading ? <ActivityIndicator size="small" color={palette.accent} /> : null}
        {query ? (
          <Pressable
            accessibilityLabel={t("clearSearch")}
            hitSlop={10}
            onPress={() => setQuery("")}
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={20} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.sortLabel}>{t("sortBy")}</Text>
        <View style={styles.sortOptions}>
          {mode === "books"
            ? ([
                ["newest", "newestFirst"],
                ["oldest", "oldestFirst"],
                ["titleAsc", "titleAscending"],
                ["titleDesc", "titleDescending"],
              ] as const).map(([value, label]) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: bookSort === value }}
                  onPress={() => setBookSort(value)}
                  style={[styles.sortChip, bookSort === value && styles.sortChipSelected]}
                >
                  <Text style={[styles.sortChipText, bookSort === value && styles.sortChipTextSelected]}>{t(label)}</Text>
                </Pressable>
              ))
            : ([
                ["nameAsc", "userNameAscending"],
                ["nameDesc", "userNameDescending"],
              ] as const).map(([value, label]) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: userSort === value }}
                  onPress={() => setUserSort(value)}
                  style={[styles.sortChip, userSort === value && styles.sortChipSelected]}
                >
                  <Text style={[styles.sortChipText, userSort === value && styles.sortChipTextSelected]}>{t(label)}</Text>
                </Pressable>
              ))}
        </View>
      </View>

      {mode === "books" ? (
        <View style={styles.viewControl}>
          <Text style={styles.viewLabel}>{t("displayAs")}</Text>
          <View style={styles.viewOptions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("cardView")}
              accessibilityState={{ selected: viewMode === "card" }}
              onPress={() => setViewMode("card")}
              style={[styles.viewOption, viewMode === "card" && styles.viewOptionSelected]}
            >
              <Ionicons name="grid-outline" size={17} color={viewMode === "card" ? palette.paper : palette.textMuted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("listView")}
              accessibilityState={{ selected: viewMode === "list" }}
              onPress={() => setViewMode("list")}
              style={[styles.viewOption, viewMode === "list" && styles.viewOptionSelected]}
            >
              <Ionicons name="list-outline" size={18} color={viewMode === "list" ? palette.paper : palette.textMuted} />
            </Pressable>
          </View>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && (mode === "books" ? books.length === 0 : users.length === 0) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.text} />
        </View>
      ) : mode === "books" ? (
        <FlatList
          key={`book-results-${viewMode}`}
          data={sortedBooks}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === "card" ? 2 : 1}
          renderItem={({ item }) => {
            const unavailable = item.status !== "available"
            const borrowDisabled = unavailable || item.owner_id === currentUserId || item.borrow_requested || requestedBookIds.has(item.id)
            return (
              <View style={viewMode === "card" ? styles.bookCell : styles.bookListCell}>
                <BookDisplay
                  actionAccessibilityLabel={t("askBorrowBook", { title: item.title })}
                  actionDisabled={borrowDisabled}
                  actionLabel={unavailable
                    ? t("bookUnavailable")
                    : item.owner_id === currentUserId
                      ? t("yourBook")
                      : item.borrow_requested || requestedBookIds.has(item.id)
                        ? t("requestSent")
                        : t("askBorrow")}
                  book={item}
                  onActionPress={() => handleBorrowRequest(item)}
                  onPress={() => router.push({ pathname: "/books/[bookId]", params: { bookId: item.id } })}
                  showOwner
                  onOwnerPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: item.owner_id } })}
                  showCommunity={scope === "all"}
                  style={styles.bookCard}
                  variant={viewMode}
                />
              </View>
            )
          }}
          contentContainerStyle={[styles.listContent, books.length === 0 && styles.emptyListContent]}
          columnWrapperStyle={viewMode === "card" ? styles.bookRow : undefined}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
        />
      ) : (
        <FlatList
          key="user-results"
          data={sortedUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserResult
              user={item}
              showCommunity={scope === "all"}
              canRemove={showingAdminMemberList && item.id !== currentUserId}
              removing={removingUserIds.has(item.id)}
              onRemove={() => confirmRemoveUser(item)}
            />
          )}
          contentContainerStyle={[styles.listContent, users.length === 0 && styles.emptyListContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
        />
      )}
    </View>
  )
}

function SegmentedControl<T extends string>({
  accessibilityLabel,
  options,
  selected,
  onSelect,
}: {
  accessibilityLabel: string
  options: { label: string; value: T }[]
  selected: T
  onSelect: (value: T) => void
}) {
  return (
    <View accessibilityLabel={accessibilityLabel} style={styles.segmented}>
      {options.map((option) => {
        const isSelected = selected === option.value
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={[styles.segment, isSelected && styles.segmentSelected]}
          >
            <Text
              numberOfLines={1}
              style={[styles.segmentText, isSelected && styles.segmentTextSelected]}
            >
              {option.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function UserResult({
  user,
  showCommunity,
  canRemove,
  removing,
  onRemove,
}: {
  user: ProfileSearchResult
  showCommunity: boolean
  canRemove: boolean
  removing: boolean
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const displayName = user.display_name || t("unknownReader")
  return (
    <View style={styles.userCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("viewLibrary", { name: displayName })}
        onPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: user.id } })}
        style={({ pressed }) => [styles.userMain, pressed && styles.userCardPressed]}
      >
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userDetails}>
        <View style={styles.userNameRow}>
          <Text numberOfLines={1} style={styles.userName}>{displayName}</Text>
          {user.admin ? <Ionicons name="shield-checkmark" size={16} color={palette.accentDark} /> : null}
        </View>
        {showCommunity ? (
          <Text numberOfLines={1} style={styles.communityName}>{user.community_name || t("notInCommunity")}</Text>
        ) : null}
      </View>
        <Ionicons name="chevron-forward" size={19} color={palette.textMuted} />
      </Pressable>
      {canRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("removeNamedFromCommunity", { name: displayName })}
          disabled={removing}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeMemberButton, pressed && styles.userCardPressed]}
        >
          {removing
            ? <ActivityIndicator size="small" color={palette.danger} />
            : <Ionicons name="person-remove-outline" size={20} color={palette.danger} />}
        </Pressable>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
    paddingHorizontal: 18,
    paddingTop: 16,
    width: "100%",
    maxWidth: layout.contentMax,
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
  segmented: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
    marginBottom: 10,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    paddingHorizontal: 12,
  },
  segmentSelected: {
    backgroundColor: palette.accent,
    ...shadows.soft,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.textMuted,
  },
  segmentTextSelected: {
    color: palette.white,
  },
  searchBar: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: palette.text },
  clearButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  sortSection: { gap: 7, marginTop: -6, marginBottom: 16 },
  sortLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  sortOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sortChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: palette.border, borderRadius: radii.round, backgroundColor: palette.paper },
  sortChipSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  sortChipText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  sortChipTextSelected: { color: palette.paper },
  viewControl: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: -6, marginBottom: 16 },
  viewLabel: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  viewOptions: { flexDirection: "row", gap: 5 },
  viewOption: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  viewOptionSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  error: { color: palette.danger, marginBottom: 12 },
  listContent: { paddingBottom: 24 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  bookRow: { gap: 12 },
  bookCell: { flexGrow: 1, flexBasis: 0, width: "48%" },
  bookListCell: { width: "100%" },
  bookCard: { width: "100%" },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    marginBottom: 10,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.surface,
  },
  userMain: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12, padding: 8 },
  removeMemberButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: palette.surfaceMuted },
  userCardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.surfaceMuted },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700", color: palette.textSoft },
  userDetails: { flex: 1, minWidth: 0, gap: 4 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  userName: { flexShrink: 1, fontSize: 17, fontWeight: "700", color: palette.text },
  communityName: { fontSize: 13, color: palette.textMuted },
  emptyState: { alignSelf: "center", alignItems: "center", paddingHorizontal: 24, paddingVertical: 22, gap: 8, backgroundColor: palette.blueSoft, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.lg, transform: [{ rotate: "-0.5deg" }] },
  emptyTitle: { marginTop: 4, fontFamily: typography.serif, fontSize: 20, fontWeight: "700", color: palette.text },
  emptyText: { maxWidth: 320, fontSize: 14, lineHeight: 20, color: palette.textMuted, textAlign: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
})
