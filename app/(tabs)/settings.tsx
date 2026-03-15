import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native"
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"

import { getProfile, updateProfile, deleteAccount } from "@/services/profile"
import { signOut } from "@/services/authentication"

export default function Settings() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const [name, setName] = useState("")
  const [community, setCommunity] = useState("")

  const [contacts, setContacts] = useState({
    email: "",
    phone: "",
    instagram: "",
    telegram: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const profile = await getProfile()

      setName(profile.display_name ?? "")
      setCommunity(profile.community_name ?? "")

      setContacts({
        email: profile.contacts?.email ?? "",
        phone: profile.contacts?.phone ?? "",
        instagram: profile.contacts?.instagram ?? "",
        telegram: profile.contacts?.telegram ?? "",
      })
    } catch (err) {
      console.error("Failed to load profile", err)
    } finally {
      setLoading(false)
    }
  }

  const updateContact = (key: string, value: string) => {
    setContacts((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // remove empty contacts
      const filteredContacts = Object.fromEntries(
        Object.entries(contacts).filter(([_, v]) => v.trim() !== "")
      )

      const payload: any = {
        display_name: name,
        community_name: community,
        contacts: filteredContacts,
      }

      await updateProfile(payload)

      Alert.alert("Success", "Profile updated successfully")
    } catch (err) {
      console.error(err)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your profile?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDelete,
        },
      ]
    )
  }

  const confirmDelete = async () => {
    try {
      await deleteAccount()
      router.replace("/login")
    } catch (err) {
      console.error(err)
      Alert.alert("Error", "Failed to delete account")
    }
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)

      const { error } = await signOut()

      if (error) {
        throw error
      }

      router.replace("/")
    } catch (err) {
      console.error("Failed to sign out", err)
      Alert.alert("Error", "Failed to sign out")
    } finally {
      setSigningOut(false)
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
      <Text style={styles.title}>Settings</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />

      <Text style={styles.label}>Community</Text>
      <TextInput
        style={styles.input}
        value={community}
        onChangeText={setCommunity}
        placeholder="Community"
      />

      {/* CONTACTS */}

      <Text style={styles.section}>Contacts</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={contacts.email}
        onChangeText={(v) => updateContact("email", v)}
        placeholder="Email"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={contacts.phone}
        onChangeText={(v) => updateContact("phone", v)}
        placeholder="Phone"
      />

      <Text style={styles.label}>Instagram</Text>
      <TextInput
        style={styles.input}
        value={contacts.instagram}
        onChangeText={(v) => updateContact("instagram", v)}
        placeholder="@username"
      />

      <Text style={styles.label}>Telegram</Text>
      <TextInput
        style={styles.input}
        value={contacts.telegram}
        onChangeText={(v) => updateContact("telegram", v)}
        placeholder="@username"
      />

      <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </Pressable>

      <Pressable
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Text style={styles.signOutText}>
          {signingOut ? "Signing Out..." : "Sign Out"}
        </Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Delete My Profile</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },

  title: {
    fontSize: 28,
    fontWeight: "600",
    marginBottom: 30,
  },

  section: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
  },

  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 18,
  },

  saveButton: {
    backgroundColor: "#4A6CF7",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },

  deleteButton: {
    marginTop: 24,
    alignItems: "center",
  },

  signOutButton: {
    marginTop: 16,
    alignItems: "center",
  },

  signOutText: {
    color: "#1f1f1f",
    fontSize: 16,
    fontWeight: "500",
  },

  deleteText: {
    color: "#ff3b30",
    fontSize: 16,
    fontWeight: "500",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
})
