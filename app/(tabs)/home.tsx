import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native"
import { useRouter } from "expo-router"
import { useState } from "react"
import { useFocusEffect } from "expo-router"
import { useCallback } from "react" 

import { getProfile } from "@/services/profile"

export default function Home() {
  const router = useRouter()

  const [name, setName] = useState<string | null>(null)
  const [community, setCommunity] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [])
  )

  const loadProfile = async () => {
    try {
      const profile = await getProfile()

      setName(profile.display_name)
      setCommunity(profile.community_name)
    } catch (err) {
      console.error("Failed to load profile", err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.name}>{name ?? "User"}</Text>
          <Text style={styles.community}>{community ?? "Community"}</Text>
        </View>

        <Pressable onPress={() => router.push("/settings")}>
          <Text style={styles.settings}>⚙️</Text>
        </Pressable>
      </View>

      {/* SPACER */}
      <View style={{ flex: 1 }} />

      {/* NAVIGATION BUTTONS */}
      <View style={styles.buttons}>
        <Pressable
          style={styles.button}
          onPress={() => router.push("/library")}
        >
          <Text style={styles.buttonText}>My Library</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/explore")}
        >
          <Text style={styles.buttonText}>Explore Books</Text>
        </Pressable>

        <Pressable
          style={styles.button}
          onPress={() => router.push("/matches")}
        >
          <Text style={styles.buttonText}>My Matches</Text>
        </Pressable>
      </View>

    </View>
  )
}

const styles = StyleSheet.create({

    container: {
      flex: 1,
      padding: 24,
      backgroundColor: "#fff",
    },
  
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  
    name: {
      fontSize: 28,
      fontWeight: "600",
    },
  
    community: {
      fontSize: 16,
      color: "#666",
      marginTop: 4,
    },
  
    settings: {
      fontSize: 26,
    },
  
    buttons: {
      gap: 16,
    },
  
    button: {
      backgroundColor: "#4A6CF7",
      paddingVertical: 16,
      borderRadius: 10,
      alignItems: "center",
    },
  
    buttonText: {
      color: "white",
      fontSize: 16,
      fontWeight: "500",
    },
  
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  
  })