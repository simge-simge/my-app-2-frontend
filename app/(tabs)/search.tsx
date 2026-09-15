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
const PAGE_SIZES = [10, 20] as const

type SearchMode = "all" | "books" | "users"
type UserSort = "nameAsc" | "nameDesc"
type BookSort = "newest" | "oldest" | "titleAsc" | "titleDesc"
type ViewMode = "card" | "list"

export default function Search() {
  const { language, t } = useTranslation()
  const searchModes: { label: string; value: SearchMode }[] = [
    { label: t("all"), value: "all" },
    { label: t("filterBooks"), value: "books" },
    { label: t("filterUsers"), value: "users" },
  ]
  const searchScopes: { label: string; value: SearchScope }[] = [
    { label: t("all"), value: "all" },
    { label: t("community"), value: "community" },
  ]
  const [mode, setMode] = useState<SearchMode>("all")
  const [scope, setScope] = useState<SearchScope>("all")
  const [userSort, setUserSort] = useState<UserSort>("nameAsc")
  const [bookSort, setBookSort] = useState<BookSort>("newest")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10)
  const [page, setPage] = useState(1)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [openFilter, setOpenFilter] = useState<"type" | "scope" | null>(null)
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
      if (mode !== "users") setBooks([])
      if (mode !== "books") setUsers([])
      searchContext.current = nextSearchContext
    }

    let cancelled = false
    const controller = new AbortController()
    setLoading(false)
    setError(null)

    const timeout = setTimeout(async () => {
      setLoading(true)
      try {
        if (mode === "all") {
          const [bookResponse, userResponse] = await Promise.all([
            searchBooks(searchTerm, scope, controller.signal),
            searchProfiles(searchTerm, scope, controller.signal),
          ])
          if (!cancelled) {
            setBooks(bookResponse)
            setUsers(userResponse)
          }
        } else if (mode === "books") {
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
          setError(t("searchFailed", { type: mode === "all" ? t("booksAndUsers") : t(mode) }))
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
  const resultType = mode === "all" ? t("booksAndUsers") : t(mode)
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
  const combinedResults = useMemo(() => [
    ...sortedBooks.map((item) => ({ kind: "book" as const, item })),
    ...sortedUsers.map((item) => ({ kind: "user" as const, item })),
  ], [sortedBooks, sortedUsers])
  const resultCount = mode === "all" ? combinedResults.length : mode === "books" ? sortedBooks.length : sortedUsers.length
  const totalPages = Math.max(1, Math.ceil(resultCount / pageSize))
  const pageStart = (page - 1) * pageSize
  const pagedCombinedResults = combinedResults.slice(pageStart, pageStart + pageSize)
  const pagedBooks = sortedBooks.slice(pageStart, pageStart + pageSize)
  const pagedUsers = sortedUsers.slice(pageStart, pageStart + pageSize)

  useEffect(() => { setPage(1) }, [bookSort, mode, pageSize, query, scope, userSort])
  useEffect(() => { setPage((current) => Math.min(current, totalPages)) }, [totalPages])

  const pagination = resultCount ? (
    <View style={styles.pagination}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("previousPage")} accessibilityState={{ disabled: page === 1 }} disabled={page === 1} onPress={() => setPage((current) => Math.max(1, current - 1))} style={[styles.pageButton, page === 1 && styles.disabled]}>
        <Ionicons name="chevron-back" size={18} color={palette.text} />
      </Pressable>
      <Text style={styles.pageText}>{t("pageOf", { page, total: totalPages })}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={t("nextPage")} accessibilityState={{ disabled: page === totalPages }} disabled={page === totalPages} onPress={() => setPage((current) => Math.min(totalPages, current + 1))} style={[styles.pageButton, page === totalPages && styles.disabled]}>
        <Ionicons name="chevron-forward" size={18} color={palette.text} />
      </Pressable>
    </View>
  ) : null
  const emptyState = (
    <View style={styles.emptyState}>
      <Ionicons
        name={searchTerm ? (mode === "books" ? "book-outline" : mode === "users" ? "people-outline" : "search-outline") : "search-outline"}
        size={36}
        color={palette.textSoft}
      />
      <Text style={styles.emptyTitle}>
        {searchTerm
          ? t("noMatching", { type: resultType })
          : showingAdminMemberList
            ? t("noCommunityMembers")
          : t("searchTypePrompt", { type: resultType })}
      </Text>
      <Text style={styles.emptyText}>
        {searchTerm
          ? t("noMatchesScope", { type: resultType, query: searchTerm })
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
      <View onTouchEnd={() => setOpenFilter(null)}>
        <Text style={styles.title}>{t("search")}</Text>
        <Text style={styles.subtitle}>{t("searchSubtitle")}</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={palette.textMuted} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onFocus={() => setOpenFilter(null)}
            onChangeText={setQuery}
            placeholder={mode === "books" ? t("searchBooksPlaceholder") : mode === "users" ? t("searchUsersPlaceholder") : t("searchAllPlaceholder")}
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
              onPress={() => {
                setOpenFilter(null)
                setQuery("")
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={palette.textMuted} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("options")}
          accessibilityState={{ expanded: optionsOpen }}
          onPress={() => {
            setOpenFilter(null)
            setOptionsOpen((open) => !open)
          }}
          style={({ pressed }) => [styles.optionsButton, optionsOpen && styles.optionsButtonSelected, pressed && styles.filterPressed]}
        >
          <Ionicons name="options-outline" size={21} color={optionsOpen ? palette.paper : palette.textMuted} />
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <FilterDropdown
          accessibilityLabel={t("searchType")}
          icon="book-outline"
          label={t("filterType")}
          options={searchModes}
          selected={mode}
          onSelect={setMode}
          open={openFilter === "type"}
          onOpenChange={(open) => setOpenFilter(open ? "type" : null)}
        />
        <FilterDropdown
          accessibilityLabel={t("searchScope")}
          icon="person-outline"
          label={t("filterScope")}
          options={searchScopes}
          selected={scope}
          onSelect={setScope}
          open={openFilter === "scope"}
          onOpenChange={(open) => setOpenFilter(open ? "scope" : null)}
        />
      </View>

      {optionsOpen ? <View style={styles.controlsCard} onTouchStart={() => setOpenFilter(null)}>
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
            : mode === "users" ? ([
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
              ))
            : ([
                ["newest", "newestFirst"],
                ["oldest", "oldestFirst"],
                ["titleAsc", "titleAscending"],
                ["titleDesc", "titleDescending"],
              ] as const).map(([value, label]) => (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: bookSort === value }}
                  onPress={() => {
                    setBookSort(value)
                    if (value === "titleAsc") setUserSort("nameAsc")
                    if (value === "titleDesc") setUserSort("nameDesc")
                  }}
                  style={[styles.sortChip, bookSort === value && styles.sortChipSelected]}
                >
                  <Text style={[styles.sortChipText, bookSort === value && styles.sortChipTextSelected]}>{t(label)}</Text>
                </Pressable>
              ))}
          </View>
        </View>

        <View style={styles.optionsRow}>
          {mode !== "users" ? <View style={styles.viewControl}>
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
          </View> : null}
          <View style={styles.viewControl}>
            <Text style={styles.viewLabel}>{t("itemsPerPage")}</Text>
            <View style={styles.viewOptions}>
              {PAGE_SIZES.map((size) => (
                <Pressable
                  key={size}
                  accessibilityRole="button"
                  accessibilityState={{ selected: pageSize === size }}
                  onPress={() => setPageSize(size)}
                  style={[styles.pageSizeOption, pageSize === size && styles.viewOptionSelected]}
                >
                  <Text style={[styles.pageSizeText, pageSize === size && styles.pageSizeTextSelected]}>{size}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </View> : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading && (mode === "books" ? books.length === 0 : mode === "users" ? users.length === 0 : books.length === 0 && users.length === 0) ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={palette.text} />
        </View>
      ) : mode === "all" ? (
        <FlatList
          key={`all-results-${viewMode}`}
          data={pagedCombinedResults}
          keyExtractor={({ kind, item }) => `${kind}-${item.id}`}
          numColumns={viewMode === "card" ? 2 : 1}
          renderItem={({ item: result }) => result.kind === "book" ? (
            <View style={viewMode === "card" ? styles.bookCell : styles.bookListCell}>
              <BookDisplay
                actionAccessibilityLabel={t("askBorrowBook", { title: result.item.title })}
                actionDisabled={result.item.status !== "available" || result.item.owner_id === currentUserId || result.item.borrow_requested || requestedBookIds.has(result.item.id)}
                actionLabel={result.item.status !== "available"
                  ? t("bookUnavailable")
                  : result.item.owner_id === currentUserId
                    ? t("yourBook")
                    : result.item.borrow_requested || requestedBookIds.has(result.item.id)
                      ? t("requestSent")
                      : t("askBorrow")}
                book={result.item}
                onActionPress={() => handleBorrowRequest(result.item)}
                onPress={() => router.push({
                  pathname: "/books/[bookId]",
                  params: {
                    bookId: result.item.id,
                    ...(result.item.owner_name ? { ownerName: result.item.owner_name } : {}),
                    ...(result.item.community_name ? { communityName: result.item.community_name } : {}),
                  },
                })}
                showOwner
                onOwnerPress={() => router.push({ pathname: "/members/[memberId]", params: { memberId: result.item.owner_id } })}
                showCommunity={scope === "all"}
                style={styles.bookCard}
                variant={viewMode}
              />
            </View>
          ) : (
            <View style={viewMode === "card" ? styles.bookCell : styles.bookListCell}>
              <UserResult
                user={result.item}
                showCommunity={scope === "all"}
                canRemove={false}
                removing={false}
                onRemove={() => {}}
              />
            </View>
          )}
          contentContainerStyle={[styles.listContent, books.length === 0 && users.length === 0 && styles.emptyListContent]}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => setOpenFilter(null)}
          onTouchStart={() => setOpenFilter(null)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
          ListFooterComponent={pagination}
          columnWrapperStyle={viewMode === "card" ? styles.bookRow : undefined}
        />
      ) : mode === "books" ? (
        <FlatList
          key={`book-results-${viewMode}`}
          data={pagedBooks}
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
                  onPress={() => router.push({
                    pathname: "/books/[bookId]",
                    params: {
                      bookId: item.id,
                      ...(item.owner_name ? { ownerName: item.owner_name } : {}),
                      ...(item.community_name ? { communityName: item.community_name } : {}),
                    },
                  })}
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
          onScrollBeginDrag={() => setOpenFilter(null)}
          onTouchStart={() => setOpenFilter(null)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
          ListFooterComponent={pagination}
        />
      ) : (
        <FlatList
          key="user-results"
          data={pagedUsers}
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
          onScrollBeginDrag={() => setOpenFilter(null)}
          onTouchStart={() => setOpenFilter(null)}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={emptyState}
          ListFooterComponent={pagination}
        />
      )}
    </View>
  )
}

function FilterDropdown<T extends string>({
  accessibilityLabel,
  icon,
  label,
  options,
  selected,
  onSelect,
  open,
  onOpenChange,
}: {
  accessibilityLabel: string
  icon: keyof typeof Ionicons.glyphMap
  label: string
  options: { label: string; value: T }[]
  selected: T
  onSelect: (value: T) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const selectedOption = options.find((option) => option.value === selected) ?? options[0]
  return (
    <View style={[styles.filterDropdown, open && styles.filterDropdownOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel}: ${selectedOption.label}`}
        accessibilityState={{ expanded: open }}
        onPress={() => onOpenChange(!open)}
        style={({ pressed }) => [styles.filterButton, pressed && styles.filterPressed]}
      >
        <Ionicons name={icon} size={19} color={palette.textMuted} />
        <Text numberOfLines={1} style={styles.filterButtonText}>
          <Text style={styles.filterButtonLabel}>{label}: </Text>
          {selectedOption.label}
        </Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={15} color={palette.textMuted} />
      </Pressable>
      {open ? (
        <View style={styles.filterMenu}>
          {options.map((option) => {
            const isSelected = selected === option.value
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={option.value}
                onPress={() => {
                  onSelect(option.value)
                  onOpenChange(false)
                }}
                style={({ pressed }) => [styles.filterOption, isSelected && styles.filterOptionSelected, pressed && styles.filterPressed]}
              >
                <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>{option.label}</Text>
                {isSelected ? <Ionicons name="checkmark" size={16} color={palette.accentDark} /> : null}
              </Pressable>
            )
          })}
        </View>
      ) : null}
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
  searchBar: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: palette.surface,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: 14,
  },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  optionsButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  optionsButtonSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: palette.text },
  clearButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  filterRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, zIndex: 10 },
  filterDropdown: { flex: 1, position: "relative" },
  filterDropdownOpen: { zIndex: 20 },
  filterButton: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.border, borderRadius: 16, backgroundColor: palette.paper, ...shadows.soft },
  filterButtonLabel: { color: palette.textMuted, fontWeight: "600" },
  filterButtonText: { flex: 1, minWidth: 0, color: palette.text, fontSize: 13, fontWeight: "800" },
  filterPressed: { opacity: 0.72 },
  filterMenu: { position: "absolute", top: 49, left: 0, right: 0, padding: 5, borderWidth: 1, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper, ...shadows.soft },
  filterOption: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 11, borderRadius: 9 },
  filterOptionSelected: { backgroundColor: palette.accentSoft },
  filterOptionText: { color: palette.text, fontSize: 13, fontWeight: "600" },
  filterOptionTextSelected: { color: palette.accentDark, fontWeight: "800" },
  controlsCard: { gap: 14, marginBottom: 14, padding: 14, borderWidth: 1, borderColor: palette.border, borderRadius: radii.lg, backgroundColor: palette.surface },
  sortSection: { gap: 7 },
  sortLabel: { color: palette.textMuted, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  sortOptions: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sortChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: 11, borderWidth: 1, borderColor: palette.border, borderRadius: radii.round, backgroundColor: palette.paper },
  sortChipSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  sortChipText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  sortChipTextSelected: { color: palette.paper },
  optionsRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 18 },
  viewControl: { flexDirection: "row", alignItems: "center", gap: 7 },
  viewLabel: { color: palette.textMuted, fontSize: 10, fontWeight: "700" },
  viewOptions: { flexDirection: "row", gap: 5 },
  viewOption: { width: 34, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  pageSizeOption: { minWidth: 34, height: 32, alignItems: "center", justifyContent: "center", paddingHorizontal: 7, borderWidth: 1, borderColor: palette.border, borderRadius: radii.sm, backgroundColor: palette.paper },
  viewOptionSelected: { borderColor: palette.accentDark, backgroundColor: palette.accent },
  pageSizeText: { color: palette.textMuted, fontSize: 11, fontWeight: "800" },
  pageSizeTextSelected: { color: palette.paper },
  error: { color: palette.danger, marginBottom: 12 },
  listContent: { paddingBottom: 24 },
  emptyListContent: { flexGrow: 1, justifyContent: "center" },
  bookRow: { gap: 12 },
  bookCell: { flexGrow: 1, flexBasis: 0, width: "48%" },
  bookListCell: { width: "100%" },
  bookCard: { width: "100%" },
  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingTop: 12, paddingBottom: 62 },
  pageButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  disabled: { opacity: 0.38 },
  pageText: { minWidth: 110, textAlign: "center", color: palette.text, fontSize: 13, fontWeight: "700" },
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
