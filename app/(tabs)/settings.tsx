import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native"
import { useEffect, useState } from "react"
import { useRouter } from "expo-router"

import { palette } from "@/constants/theme"
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
    setContacts((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const filteredContacts = Object.fromEntries(Object.entries(contacts).filter(([_, v]) => v.trim() !== ""))
      await updateProfile({
        display_name: name,
        community_name: community,
        contacts: filteredContacts,
      } as any)
      Alert.alert("Success", "Profile updated successfully")
    } catch (err) {
      console.error(err)
      Alert.alert("Error", "Failed to update profile")
    } finally {
      setSaving(false)
    }
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

  const handleDelete = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete your profile?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: confirmDelete },
    ])
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const { error } = await signOut()
      if (error) throw error
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
        <ActivityIndicator size="large" color={palette.text} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.section}>Profile</Text>

        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={palette.textMuted} />

        <Text style={styles.label}>Community</Text>
        <TextInput style={styles.input} value={community} onChangeText={setCommunity} placeholder="Community" placeholderTextColor={palette.textMuted} />

        <Text style={styles.section}>Contacts</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={contacts.email} onChangeText={(v) => updateContact("email", v)} placeholder="Email" placeholderTextColor={palette.textMuted} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={contacts.phone} onChangeText={(v) => updateContact("phone", v)} placeholder="Phone" placeholderTextColor={palette.textMuted} />

        <Text style={styles.label}>Instagram</Text>
        <TextInput style={styles.input} value={contacts.instagram} onChangeText={(v) => updateContact("instagram", v)} placeholder="@username" placeholderTextColor={palette.textMuted} />

        <Text style={styles.label}>Telegram</Text>
        <TextInput style={styles.input} value={contacts.telegram} onChangeText={(v) => updateContact("telegram", v)} placeholder="@username" placeholderTextColor={palette.textMuted} />

        <Pressable style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Changes"}</Text>
        </Pressable>

        <Pressable style={styles.secondaryAction} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.secondaryActionText}>{signingOut ? "Signing Out..." : "Sign Out"}</Text>
        </Pressable>

        <Pressable style={styles.deleteAction} onPress={handleDelete}>
          <Text style={styles.deleteActionText}>Delete My Profile</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: palette.background,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: palette.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 18,
  },
  section: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginTop: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    backgroundColor: palette.background,
    color: palette.text,
  },
  saveButton: {
    backgroundColor: palette.accent,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: palette.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryAction: {
    marginTop: 16,
    alignItems: "center",
  },
  secondaryActionText: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  deleteAction: {
    marginTop: 24,
    alignItems: "center",
  },
  deleteActionText: {
    color: palette.danger,
    fontSize: 16,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.background,
  },
})
