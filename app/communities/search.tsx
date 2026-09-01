import { Ionicons } from "@expo/vector-icons"
import { useEffect, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { ApiError } from "@/services/api"
import LocationPicker from "@/components/LocationPicker"
import type { Location } from "@/services/locations"
import {
  requestCommunityJoin,
  searchCommunities,
  type CommunitySearchResult,
} from "@/services/communities"
import { runInBackground } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

export default function CommunitySearch() {
  const { t } = useTranslation()
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState<Location | null>(null)
  const [results, setResults] = useState<CommunitySearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const communities = await searchCommunities(query, location?.id)
        if (active) setResults(communities)
      } catch (err) {
        if (active) {
          console.error("Failed to search communities", err)
          Alert.alert(t("error"), err instanceof ApiError ? err.message : t("couldNotLoadCommunities"))
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 300)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, location?.id, t])

  const handleJoin = (community: CommunitySearchResult) => {
    if (community.is_member || community.request_pending) return
    setResults((current) => current.map((item) => item.id === community.id ? { ...item, request_pending: true } : item))
    runInBackground(() => requestCommunityJoin(community.id), {
      onError: (err) => {
        setResults((current) => current.map((item) => item.id === community.id ? { ...item, request_pending: false } : item))
        console.error("Failed to request community membership", err)
        Alert.alert(t("unableSendRequest"), err instanceof ApiError ? err.message : t("tryAgain"))
      },
    })
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={palette.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchCommunitiesByName")}
          placeholderTextColor={palette.textMuted}
          autoFocus
          returnKeyType="search"
        />
      </View>

      <LocationPicker
        label={t("filterByLocation")}
        selected={location}
        onSelect={setLocation}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={results.length ? styles.list : styles.emptyList}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const disabled = item.is_member || item.request_pending
            const buttonText = item.is_member
              ? t("joined")
              : item.request_pending
                ? "Request sent"
                : t("join")
            return (
              <View style={styles.communityRow}>
                <View style={styles.communityDetails}>
                  <Text style={styles.communityName}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color={palette.textMuted} />
                    <Text style={styles.metaText}>{item.location?.display_name || t("locationNotSpecified")}</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Ionicons name="people-outline" size={14} color={palette.textMuted} />
                    <Text style={styles.metaText}>{t(item.member_count === 1 ? "memberCount" : "membersCount", { count: item.member_count })}</Text>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.joinButton,
                    disabled && styles.joinButtonDisabled,
                    pressed && !disabled && styles.joinButtonPressed,
                  ]}
                  onPress={() => handleJoin(item)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${buttonText} ${item.name}`}
                >
                  <Text style={[styles.joinButtonText, disabled && styles.joinButtonTextDisabled]}>{buttonText}</Text>
                </Pressable>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={38} color={palette.textMuted} />
              <Text style={styles.emptyTitle}>{t("noCommunitiesFound")}</Text>
              <Text style={styles.emptyText}>{t("differentNameLocation")}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", backgroundColor: palette.background, padding: 20, gap: 12 },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, paddingHorizontal: 14, minHeight: 52, backgroundColor: palette.surface },
  searchInput: { flex: 1, color: palette.text, fontSize: 16, paddingVertical: 12 },
  list: { paddingTop: 6, paddingBottom: 30, gap: 10 },
  emptyList: { flexGrow: 1 },
  communityRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, padding: 15, ...shadows.soft },
  communityDetails: { flex: 1, gap: 7 },
  communityName: { color: palette.text, fontFamily: typography.serif, fontSize: 18, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 4 },
  metaText: { color: palette.textMuted, fontSize: 12 },
  metaDot: { color: palette.textMuted, marginHorizontal: 2 },
  joinButton: { minWidth: 70, minHeight: 44, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, backgroundColor: palette.accent, borderWidth: 1, borderColor: palette.accentDark },
  joinButtonDisabled: { backgroundColor: palette.surfaceMuted },
  joinButtonPressed: { opacity: 0.75 },
  joinButtonText: { color: palette.white, fontSize: 13, fontWeight: "700" },
  joinButtonTextDisabled: { color: palette.textMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle: { color: palette.text, fontFamily: typography.serif, fontSize: 19, fontWeight: "700", marginTop: 4 },
  emptyText: { color: palette.textMuted, fontSize: 14 },
})
