import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native"
import { useCallback, useState } from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { getProfile } from "@/services/profile"
import { getRandomHomeDisplayImage, getRandomQuote, type Quote } from "@/services/quotes"

export default function Home() {
  const router = useRouter()

  const [name, setName] = useState<string | null>(null)
  const [community, setCommunity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [quote, setQuote] = useState<Quote>(() => getRandomQuote())
  const [displayImage, setDisplayImage] = useState(() => getRandomHomeDisplayImage())

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile()

      setName(profile.display_name)
      setCommunity(profile.community_name)
    } catch (err) {
      console.error("Failed to load profile", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      setQuote(getRandomQuote())
      setDisplayImage(getRandomHomeDisplayImage())
      loadProfile()
    }, [loadProfile])
  )

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#183153" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.name}>{name ?? "User"}</Text>
          <Text style={styles.community}>{community ?? "Community"}</Text>
        </View>

        <Pressable style={styles.settingsButton} onPress={() => router.push("/settings")}>
          <Ionicons name="settings-outline" size={22} color="#183153" />
        </Pressable>
      </View>

      <View style={styles.quoteCard}>
        <View style={styles.quoteImageWrap}>
          <Image source={displayImage} style={styles.quoteImage} resizeMode="cover" />
          <View style={styles.quoteImageOverlay} />
          <Text style={styles.quoteLabel}>Shelf Note</Text>
        </View>

        <View style={styles.quoteContent}>
          <Text style={styles.quoteMark}>{"\u201c"}</Text>
          <Text style={styles.quoteText}>{quote.quote}</Text>
          <Text style={styles.quoteAuthor}>- {quote.author}</Text>
        </View>
      </View>

      <View style={styles.buttons}>
        <View style={styles.primaryButtonRow}>
          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/explore")}>
            <Ionicons name="compass-outline" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Explore Books</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/search")}>
            <Ionicons name="search" size={20} color="#FFF9F0" />
            <Text style={styles.buttonText}>Search</Text>
          </Pressable>
        </View>

        <View style={styles.bottomButtonRow}>
          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/library")}>
            <Text style={styles.buttonText}>My Library</Text>
          </Pressable>

          <Pressable style={[styles.button, styles.halfButton]} onPress={() => router.push("/matches")}>
            <Text style={styles.buttonText}>My Matches</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: "#F7F2E8",
    gap: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#9A6B39",
    marginBottom: 6,
  },
  name: {
    fontSize: 30,
    fontWeight: "700",
    color: "#183153",
  },
  community: {
    fontSize: 16,
    color: "#6D5D4B",
    marginTop: 6,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9F0",
    borderWidth: 1,
    borderColor: "#E7D9C5",
  },
  quoteCard: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#FFF9F0",
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E7D9C5",
    shadowColor: "#74543C",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  quoteImageWrap: {
    height: 260,
    justifyContent: "flex-end",
    padding: 18,
    backgroundColor: "#183153",
  },
  quoteImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  quoteImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(24, 49, 83, 0.34)",
  },
  quoteLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#E7C38A",
    zIndex: 1,
  },
  quoteContent: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 24,
  },
  quoteMark: {
    fontSize: 44,
    lineHeight: 44,
    color: "#9A6B39",
    marginBottom: 8,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 32,
    color: "#183153",
    fontWeight: "600",
  },
  quoteAuthor: {
    marginTop: 18,
    fontSize: 15,
    color: "#6D5D4B",
    fontWeight: "600",
  },
  buttons: {
    marginTop: "auto",
    gap: 16,
  },
  bottomButtonRow: {
    flexDirection: "row",
    gap: 14,
  },
  primaryButtonRow: {
    flexDirection: "row",
    gap: 14,
  },
  button: {
    minHeight: 58,
    flexDirection: "row",
    backgroundColor: "#C86C3A",
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#8A4522",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  halfButton: {
    flex: 1,
  },
  buttonText: {
    color: "#FFF9F0",
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F2E8",
  },
})
