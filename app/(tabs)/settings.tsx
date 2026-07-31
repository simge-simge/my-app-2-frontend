import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  ScrollView,
  Switch,
} from "react-native"
import { useCallback, useState } from "react"
import { useFocusEffect, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"

import { palette } from "@/constants/theme"
import AdminBadge from "@/components/AdminBadge"
import { getProfile, updateProfile, deleteAccount, type Profile } from "@/services/profile"
import { signOut } from "@/services/authentication"
import { ApiError, getCachedApiData } from "@/services/api"
import { createCommunity } from "@/services/admin"
import { updateCommunityVisibility } from "@/services/communities"

type EditableField = "name" | "phone" | "instagram" | "telegram"

export default function Settings() {
  const router = useRouter()
  const cachedProfile = getCachedApiData<Profile>("/profile/me/")

  const [loading, setLoading] = useState(() => cachedProfile === undefined)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [editingField, setEditingField] = useState<EditableField | null>(null)

  const [name, setName] = useState(() => cachedProfile?.display_name ?? "")
  const [community, setCommunity] = useState(() => cachedProfile?.community_name ?? "")
  const [isAdmin, setIsAdmin] = useState(() => cachedProfile?.admin ?? false)
  const [communityId, setCommunityId] = useState<string | null>(() => cachedProfile?.community_id ?? null)
  const [communityPublic, setCommunityPublic] = useState(() => Boolean(cachedProfile?.community_public))
  const [visibilitySaving, setVisibilitySaving] = useState(false)
  const [isAppAdmin, setIsAppAdmin] = useState(() => cachedProfile?.is_app_admin ?? false)
  const [pendingCommunity, setPendingCommunity] = useState<string | null>(() => cachedProfile?.pending_community_name ?? null)
  const [communityName, setCommunityName] = useState("")
  const [communityLocation, setCommunityLocation] = useState("")
  const [communityAdminEmail, setCommunityAdminEmail] = useState("")

  const [contacts, setContacts] = useState(() => ({
    email: cachedProfile?.contacts?.email ?? "",
    phone: cachedProfile?.contacts?.phone ?? "",
    instagram: cachedProfile?.contacts?.instagram ?? "",
    telegram: cachedProfile?.contacts?.telegram ?? "",
  }))

  const loadProfile = useCallback(async () => {
    try {
      const profile = await getProfile()

      setName(profile.display_name ?? "")
      setCommunity(profile.community_name ?? "")
      setIsAdmin(profile.admin)
      setCommunityId(profile.community_id)
      setCommunityPublic(Boolean(profile.community_public))
      setIsAppAdmin(profile.is_app_admin)
      setPendingCommunity(profile.pending_community_name)
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
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadProfile()
    }, [loadProfile]),
  )

  const updateContact = (key: "phone" | "instagram" | "telegram", value: string) => {
    setContacts((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (field: EditableField) => {
    try {
      setSaving(true)
      let update: Record<string, unknown>

      if (field === "name") {
        update = { display_name: name }
      } else {
        const filteredContacts = Object.fromEntries(
          Object.entries(contacts).filter(([key, value]) => key !== "email" && value.trim() !== ""),
        )
        update = { contacts: filteredContacts }
      }

      const updatedProfile = await updateProfile(update)
      setCommunity(updatedProfile.community_name ?? "")
      setPendingCommunity(updatedProfile.pending_community_name)
      setEditingField(null)
      Alert.alert("Success", "Field updated successfully")
    } catch (err) {
      console.error(err)
      Alert.alert("Error", err instanceof ApiError ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCommunity = async () => {
    if (!communityName.trim() || !communityAdminEmail.trim()) {
      Alert.alert("Missing details", "Enter a community name and the admin's account email.")
      return
    }
    try {
      setSaving(true)
      const created = await createCommunity({
        name: communityName.trim(),
        location: communityLocation.trim() || undefined,
        admin_email: communityAdminEmail.trim().toLowerCase(),
      })
      setCommunityName("")
      setCommunityLocation("")
      setCommunityAdminEmail("")
      Alert.alert("Community created", `${created.name} was created and its admin was assigned.`)
    } catch (err) {
      console.error(err)
      Alert.alert("Error", err instanceof ApiError ? err.message : "Failed to create community")
    } finally {
      setSaving(false)
    }
  }

  const handleVisibilityChange = async (nextValue: boolean) => {
    if (!communityId) return
    try {
      setVisibilitySaving(true)
      const updated = await updateCommunityVisibility(communityId, nextValue)
      setCommunityPublic(updated.public)
    } catch (err) {
      console.error("Failed to update community visibility", err)
      Alert.alert("Error", err instanceof ApiError ? err.message : "Failed to update community visibility")
    } finally {
      setVisibilitySaving(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteAccount()
      router.replace("/login")
    } catch (err) {
      console.error(err)
      Alert.alert("Error", err instanceof ApiError ? err.message : "Failed to delete account")
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
        <View style={styles.sectionHeader}>
          <View style={styles.profileHeading}>
            <Text style={styles.section}>Profile</Text>
            {isAdmin ? <AdminBadge /> : null}
          </View>
        </View>

        <Text style={styles.label}>Name</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "name" && styles.inputLocked]} value={name} onChangeText={setName} editable={editingField === "name"} placeholder="Your name" placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "name" && styles.fieldActionDisabled]}
            onPress={() => editingField === "name" ? handleSave("name") : setEditingField("name")}
            disabled={saving || (editingField !== null && editingField !== "name")}
            accessibilityRole="button"
            accessibilityLabel={editingField === "name" ? "Save name" : "Edit name"}
          >
            <Ionicons name={editingField === "name" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>
        <Text style={styles.label}>Community</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, styles.inputLocked]} value={community} editable={false} placeholder="Not in a community" placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed]}
            onPress={() => router.push("/communities/search")}
            disabled={saving}
            accessibilityRole="button"
            accessibilityLabel="Find a community"
          >
            <Ionicons name="create-outline" size={21} color={palette.accentDark} />
          </Pressable>
        </View>
        {pendingCommunity ? (
          <Text style={styles.pendingHint}>Request pending for {pendingCommunity}</Text>
        ) : null}
        <Text style={styles.communityHint}>Search communities by name or location.</Text>

        {isAdmin && communityId ? (
          <View style={styles.visibilityRow}>
            <View style={styles.visibilityCopy}>
              <Text style={styles.visibilityTitle}>Public community</Text>
              <Text style={styles.visibilityHint}>
                {communityPublic
                  ? "Your community appears in search results."
                  : "Your community is hidden from search results."}
              </Text>
            </View>
            <Switch
              value={communityPublic}
              onValueChange={handleVisibilityChange}
              disabled={visibilitySaving}
              trackColor={{ false: palette.border, true: palette.successSoft }}
              thumbColor={communityPublic ? palette.success : palette.textMuted}
              accessibilityLabel="Public community visibility"
            />
          </View>
        ) : null}

        {isAppAdmin ? (
          <View style={styles.adminPanel}>
            <Text style={styles.section}>App administration</Text>
            <Text style={styles.adminHint}>Create a community and assign its first admin by account email.</Text>
            <TextInput style={styles.adminInput} value={communityName} onChangeText={setCommunityName} placeholder="Community name" placeholderTextColor={palette.textMuted} />
            <TextInput style={styles.adminInput} value={communityLocation} onChangeText={setCommunityLocation} placeholder="Location (optional)" placeholderTextColor={palette.textMuted} />
            <TextInput style={styles.adminInput} value={communityAdminEmail} onChangeText={setCommunityAdminEmail} placeholder="Community admin email" placeholderTextColor={palette.textMuted} autoCapitalize="none" keyboardType="email-address" />
            <Pressable style={({ pressed }) => [styles.primaryAction, pressed && styles.editButtonPressed, saving && styles.fieldActionDisabled]} onPress={handleCreateCommunity} disabled={saving}>
              <Text style={styles.primaryActionText}>{saving ? "Creating..." : "Create community"}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.section, styles.contactsSection]}>Contacts</Text>

        <Text style={styles.label}>Email</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, styles.inputLocked]} value={contacts.email} editable={false} placeholder="Email" placeholderTextColor={palette.textMuted} />
        </View>
        <Text style={styles.emailHint}>Email address cannot be changed.</Text>

        <Text style={styles.label}>Phone</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "phone" && styles.inputLocked]} value={contacts.phone} onChangeText={(v) => updateContact("phone", v)} editable={editingField === "phone"} placeholder="Phone" placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "phone" && styles.fieldActionDisabled]}
            onPress={() => editingField === "phone" ? handleSave("phone") : setEditingField("phone")}
            disabled={saving || (editingField !== null && editingField !== "phone")}
            accessibilityRole="button"
            accessibilityLabel={editingField === "phone" ? "Save phone" : "Edit phone"}
          >
            <Ionicons name={editingField === "phone" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>

        <Text style={styles.label}>Instagram</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "instagram" && styles.inputLocked]} value={contacts.instagram} onChangeText={(v) => updateContact("instagram", v)} editable={editingField === "instagram"} placeholder="@username" placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "instagram" && styles.fieldActionDisabled]}
            onPress={() => editingField === "instagram" ? handleSave("instagram") : setEditingField("instagram")}
            disabled={saving || (editingField !== null && editingField !== "instagram")}
            accessibilityRole="button"
            accessibilityLabel={editingField === "instagram" ? "Save Instagram" : "Edit Instagram"}
          >
            <Ionicons name={editingField === "instagram" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>

        <Text style={styles.label}>Telegram</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "telegram" && styles.inputLocked]} value={contacts.telegram} onChangeText={(v) => updateContact("telegram", v)} editable={editingField === "telegram"} placeholder="@username" placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "telegram" && styles.fieldActionDisabled]}
            onPress={() => editingField === "telegram" ? handleSave("telegram") : setEditingField("telegram")}
            disabled={saving || (editingField !== null && editingField !== "telegram")}
            accessibilityRole="button"
            accessibilityLabel={editingField === "telegram" ? "Save Telegram" : "Edit Telegram"}
          >
            <Ionicons name={editingField === "telegram" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>

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
  section: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 12,
  },
  profileHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  editButtonPressed: {
    opacity: 0.7,
  },
  contactsSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: palette.textMuted,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    paddingRight: 58,
    backgroundColor: palette.background,
    color: palette.text,
  },
  fieldControl: {
    position: "relative",
    marginBottom: 18,
  },
  fieldAction: {
    position: "absolute",
    right: 7,
    top: 6,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.accentSoft,
  },
  fieldActionDisabled: {
    opacity: 0.4,
  },
  inputLocked: {
    backgroundColor: palette.surfaceMuted,
    color: palette.textMuted,
  },
  emailHint: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 18,
  },
  pendingHint: {
    color: palette.textSoft,
    fontSize: 13,
    fontWeight: "600",
    marginTop: -12,
    marginBottom: 18,
  },
  communityHint: {
    color: palette.textMuted,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 18,
  },
  visibilityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    backgroundColor: palette.surfaceMuted,
    padding: 14,
    marginTop: -6,
    marginBottom: 20,
  },
  visibilityCopy: {
    flex: 1,
    gap: 4,
  },
  visibilityTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
  },
  visibilityHint: {
    color: palette.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  adminPanel: {
    backgroundColor: palette.surfaceMuted,
    borderRadius: 18,
    padding: 16,
    marginBottom: 22,
    gap: 10,
  },
  adminHint: {
    color: palette.textMuted,
    fontSize: 13,
    marginBottom: 2,
  },
  adminInput: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 13,
    backgroundColor: palette.surface,
    color: palette.text,
  },
  primaryAction: {
    borderRadius: 14,
    padding: 13,
    alignItems: "center",
    backgroundColor: palette.accent,
    marginTop: 2,
  },
  primaryActionText: {
    color: palette.white,
    fontSize: 15,
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
