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

import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import AdminBadge from "@/components/AdminBadge"
import PageHeader from "@/components/PageHeader"
import LocationPicker from "@/components/LocationPicker"
import { getProfile, updateProfile, deleteAccount, type Profile } from "@/services/profile"
import { signOut } from "@/services/authentication"
import { ApiError, getCachedApiData } from "@/services/api"
import { createCommunity } from "@/services/admin"
import { updateCommunityVisibility } from "@/services/communities"
import type { Location } from "@/services/locations"
import { runInBackground } from "@/utils/backgroundAction"
import LanguageSwitch from "@/components/LanguageSwitch"
import LegalLinks from "@/components/LegalLinks"
import ThemeSwitch from "@/components/ThemeSwitch"
import { useTranslation } from "@/localization/LanguageContext"

type EditableField = "name" | "location" | "phone" | "instagram" | "telegram"

export default function Settings() {
  const router = useRouter()
  const { t } = useTranslation()
  const cachedProfile = getCachedApiData<Profile>("/profile/me/")

  const [loading, setLoading] = useState(() => cachedProfile === undefined)
  const [signingOut, setSigningOut] = useState(false)
  const [editingField, setEditingField] = useState<EditableField | null>(null)

  const [name, setName] = useState(() => cachedProfile?.display_name ?? "")
  const [location, setLocation] = useState<Location | null>(() => cachedProfile?.location ?? null)
  const [savedLocation, setSavedLocation] = useState<Location | null>(() => cachedProfile?.location ?? null)
  const [locationValid, setLocationValid] = useState(true)
  const [community, setCommunity] = useState(() => cachedProfile?.community_name ?? "")
  const [isAdmin, setIsAdmin] = useState(() => cachedProfile?.admin ?? false)
  const [communityId, setCommunityId] = useState<string | null>(() => cachedProfile?.community_id ?? null)
  const [communityPublic, setCommunityPublic] = useState(() => Boolean(cachedProfile?.community_public))
  const [isAppAdmin, setIsAppAdmin] = useState(() => cachedProfile?.is_app_admin ?? false)
  const [pendingCommunity, setPendingCommunity] = useState<string | null>(() => cachedProfile?.pending_community_name ?? null)
  const [communityName, setCommunityName] = useState("")
  const [communityLocation, setCommunityLocation] = useState<Location | null>(null)
  const [communityLocationValid, setCommunityLocationValid] = useState(true)
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
      setLocation(profile.location)
      setSavedLocation(profile.location)
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

  const handleSave = (field: EditableField) => {
    let update: Record<string, unknown>

    if (field === "name") {
      update = { display_name: name }
    } else if (field === "location") {
      if (!locationValid) {
        Alert.alert(t("selectLocation"), t("selectLocationHint"))
        return
      }
      update = { location_id: location?.id ?? null }
      setSavedLocation(location)
    } else {
      const filteredContacts = Object.fromEntries(
        Object.entries(contacts).filter(([key, value]) => key !== "email" && value.trim() !== ""),
      )
      update = { contacts: filteredContacts }
    }

    setEditingField(null)
    runInBackground(() => updateProfile(update), {
      onSuccess: (updatedProfile) => {
        setLocation(updatedProfile.location)
        setSavedLocation(updatedProfile.location)
        setCommunity(updatedProfile.community_name ?? "")
        setPendingCommunity(updatedProfile.pending_community_name)
      },
      onError: (err) => {
        console.error(err)
        void loadProfile()
        Alert.alert(t("changesNotSaved"), err instanceof ApiError ? err.message : t("failedUpdateProfile"))
      },
    })
  }

  const handleCreateCommunity = () => {
    if (!communityName.trim() || !communityAdminEmail.trim() || !communityLocation || !communityLocationValid) {
      Alert.alert(t("missingDetails"), t("missingCommunityDetails"))
      return
    }
    const draft = { name: communityName, location: communityLocation, adminEmail: communityAdminEmail }
    setCommunityName("")
    setCommunityLocation(null)
    setCommunityAdminEmail("")
    runInBackground(() => createCommunity({
      name: draft.name.trim(),
      location_id: draft.location!.id,
      admin_email: draft.adminEmail.trim().toLowerCase(),
    }), {
      onError: (err) => {
        setCommunityName(draft.name)
        setCommunityLocation(draft.location)
        setCommunityAdminEmail(draft.adminEmail)
        console.error(err)
        Alert.alert(t("communityNotCreated"), err instanceof ApiError ? err.message : t("failedCreateCommunity"))
      },
    })
  }

  const handleVisibilityChange = (nextValue: boolean) => {
    if (!communityId) return
    const previousValue = communityPublic
    setCommunityPublic(nextValue)
    runInBackground(() => updateCommunityVisibility(communityId, nextValue), {
      onSuccess: (updated) => setCommunityPublic(updated.public),
      onError: (err) => {
        setCommunityPublic(previousValue)
        console.error("Failed to update community visibility", err)
        Alert.alert(t("changeNotSaved"), err instanceof ApiError ? err.message : t("failedVisibility"))
      },
    })
  }

  const confirmDelete = async () => {
    try {
      await deleteAccount()
      router.replace("/login")
    } catch (err) {
      console.error(err)
      Alert.alert(t("error"), err instanceof ApiError ? err.message : t("failedDelete"))
    }
  }

  const handleDelete = () => {
    Alert.alert(t("deleteAccount"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: confirmDelete },
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
      Alert.alert(t("error"), t("failedSignOut"))
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <PageHeader title={t("settings")} subtitle={t("profileCommunityPreferences")} />
        <View style={styles.loadingCenter}><ActivityIndicator size="large" color={palette.text} /></View>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <PageHeader title={t("settings")} subtitle={t("profileCommunityPreferences")} />
      <View style={styles.languageCard}>
        <Text style={styles.section}>{t("language")}</Text>
        <LanguageSwitch />
      </View>
      <View style={styles.languageCard}>
        <Text style={styles.section}>{t("appearance")}</Text>
        <ThemeSwitch />
      </View>
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.profileHeading}>
            <Text style={styles.section}>{t("profile")}</Text>
            {isAdmin ? <AdminBadge /> : null}
          </View>
        </View>

        <Text style={styles.label}>{t("name")}</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "name" && styles.inputLocked]} value={name} onChangeText={setName} editable={editingField === "name"} placeholder={t("yourName")} placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "name" && styles.fieldActionDisabled]}
            onPress={() => editingField === "name" ? handleSave("name") : setEditingField("name")}
            disabled={editingField !== null && editingField !== "name"}
            accessibilityRole="button"
            accessibilityLabel={editingField === "name" ? "Save name" : "Edit name"}
          >
            <Ionicons name={editingField === "name" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>
        <Text style={styles.label}>{t("location")}</Text>
        {editingField === "location" ? (
          <View style={styles.locationEditor}>
            <LocationPicker
              selected={location}
              onSelect={setLocation}
              onValidityChange={setLocationValid}
            />
            <View style={styles.locationActions}>
              <Pressable style={styles.locationCancel} onPress={() => { setLocation(savedLocation); setEditingField(null) }} accessibilityRole="button" accessibilityLabel={t("cancelLocationEdit")}>
                <Text style={styles.locationCancelText}>{t("cancel")}</Text>
              </Pressable>
              <Pressable style={styles.locationSave} onPress={() => handleSave("location")} disabled={!locationValid} accessibilityRole="button" accessibilityLabel={t("saveLocation")}>
                <Text style={styles.locationSaveText}>{t("save")}</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.fieldControl}>
            <TextInput style={[styles.input, styles.inputLocked]} value={location?.display_name ?? ""} editable={false} placeholder={t("locationNotSet")} placeholderTextColor={palette.textMuted} />
            <Pressable
              style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && styles.fieldActionDisabled]}
              onPress={() => setEditingField("location")}
              disabled={editingField !== null}
              accessibilityRole="button"
              accessibilityLabel={t("editNamed", { name: t("location").toLocaleLowerCase() })}
            >
              <Ionicons name="create-outline" size={21} color={palette.accentDark} />
            </Pressable>
          </View>
        )}
        <Text style={styles.label}>{t("community")}</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, styles.inputLocked]} value={community} editable={false} placeholder={t("notInCommunity")} placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && styles.fieldActionDisabled]}
            onPress={() => router.push("/communities/search")}
            disabled={editingField !== null}
            accessibilityRole="button"
            accessibilityLabel={t("findCommunity")}
          >
            <Ionicons name="create-outline" size={21} color={palette.accentDark} />
          </Pressable>
        </View>
        {pendingCommunity ? (
          <Text style={styles.pendingHint}>{t("requestPending", { name: pendingCommunity })}</Text>
        ) : null}
        <Text style={styles.communityHint}>{t("searchCommunitiesHint")}</Text>

        {isAdmin && communityId ? (
          <View style={styles.visibilityRow}>
            <View style={styles.visibilityCopy}>
              <Text style={styles.visibilityTitle}>{t("publicCommunity")}</Text>
              <Text style={styles.visibilityHint}>
                {communityPublic
                  ? t("communityVisible")
                  : t("communityHidden")}
              </Text>
            </View>
            <Switch
              value={communityPublic}
              onValueChange={handleVisibilityChange}
              trackColor={{ false: palette.border, true: palette.successSoft }}
              thumbColor={communityPublic ? palette.success : palette.textMuted}
              accessibilityLabel={t("publicVisibility")}
            />
          </View>
        ) : null}

        {isAppAdmin ? (
          <View style={styles.adminPanel}>
            <Text style={styles.section}>{t("appAdministration")}</Text>
            <Text style={styles.adminHint}>{t("adminHint")}</Text>
            <TextInput style={styles.adminInput} value={communityName} onChangeText={setCommunityName} placeholder={t("communityName")} placeholderTextColor={palette.textMuted} />
            <LocationPicker
              label="Community location"
              selected={communityLocation}
              onSelect={setCommunityLocation}
              onValidityChange={setCommunityLocationValid}
            />
            <TextInput style={styles.adminInput} value={communityAdminEmail} onChangeText={setCommunityAdminEmail} placeholder={t("communityAdminEmail")} placeholderTextColor={palette.textMuted} autoCapitalize="none" keyboardType="email-address" />
            <Pressable style={({ pressed }) => [styles.primaryAction, pressed && styles.editButtonPressed]} onPress={handleCreateCommunity}>
              <Text style={styles.primaryActionText}>{t("createCommunity")}</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={[styles.section, styles.contactsSection]}>{t("contacts")}</Text>

        <Text style={styles.label}>{t("email")}</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, styles.inputLocked]} value={contacts.email} editable={false} placeholder={t("email")} placeholderTextColor={palette.textMuted} />
        </View>
        <Text style={styles.emailHint}>{t("emailCannotChange")}</Text>

        <Text style={styles.label}>{t("phone")}</Text>
        <View style={styles.fieldControl}>
          <TextInput style={[styles.input, editingField !== "phone" && styles.inputLocked]} value={contacts.phone} onChangeText={(v) => updateContact("phone", v)} editable={editingField === "phone"} placeholder={t("phone")} placeholderTextColor={palette.textMuted} />
          <Pressable
            style={({ pressed }) => [styles.fieldAction, pressed && styles.editButtonPressed, editingField !== null && editingField !== "phone" && styles.fieldActionDisabled]}
            onPress={() => editingField === "phone" ? handleSave("phone") : setEditingField("phone")}
            disabled={editingField !== null && editingField !== "phone"}
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
            disabled={editingField !== null && editingField !== "instagram"}
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
            disabled={editingField !== null && editingField !== "telegram"}
            accessibilityRole="button"
            accessibilityLabel={editingField === "telegram" ? "Save Telegram" : "Edit Telegram"}
          >
            <Ionicons name={editingField === "telegram" ? "checkmark" : "create-outline"} size={21} color={palette.accentDark} />
          </Pressable>
        </View>

        <Pressable style={styles.secondaryAction} onPress={handleSignOut} disabled={signingOut}>
          <Text style={styles.secondaryActionText}>{signingOut ? t("signingOut") : t("signOut")}</Text>
        </Pressable>

        <Pressable style={styles.deleteAction} onPress={handleDelete}>
          <Text style={styles.deleteActionText}>{t("deleteProfile")}</Text>
        </Pressable>
      </View>
      <View style={styles.languageCard}>
        <Text style={styles.section}>{t("legal")}</Text>
        <LegalLinks />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  languageCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%", backgroundColor: palette.paper, borderRadius: radii.lg, borderWidth: 1.5, borderColor: palette.borderStrong, padding: 16 },
  container: {
    padding: 24,
    gap: 22,
    backgroundColor: palette.background,
    width: "100%",
    maxWidth: layout.readingMax,
    alignSelf: "center",
  },
  loadingScreen: { flex: 1, width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 24, backgroundColor: palette.background },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: palette.surface,
    borderRadius: radii.lg,
    padding: 22,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    ...shadows.soft,
  },
  section: {
    fontFamily: typography.serif,
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
    minHeight: 52,
    width: "100%",
    borderWidth: 1.5,
    borderColor: palette.border,
    borderRadius: radii.md,
    padding: 14,
    paddingRight: 58,
    backgroundColor: palette.background,
    color: palette.text,
  },
  fieldControl: {
    position: "relative",
    marginBottom: 18,
  },
  locationEditor: {
    marginBottom: 18,
    gap: 10,
  },
  locationActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  locationCancel: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  locationCancelText: {
    color: palette.textMuted,
    fontWeight: "700",
  },
  locationSave: {
    minHeight: 42,
    justifyContent: "center",
    borderRadius: radii.md,
    paddingHorizontal: 18,
    backgroundColor: palette.accent,
  },
  locationSaveText: {
    color: palette.white,
    fontWeight: "700",
  },
  fieldAction: {
    position: "absolute",
    right: 7,
    top: 3,
    width: 44,
    height: 44,
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
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.md,
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
