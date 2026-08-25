import { useEffect, useState } from "react"
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native"
import * as Linking from "expo-linking"
import { router } from "expo-router"

import { palette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { createSessionFromUrl, getSession } from "@/services/authentication"
import { updateProfile } from "@/services/profile"

function currentCallbackUrl(linkingUrl: string | null) {
  if (Platform.OS === "web" && typeof window !== "undefined") return window.location.href
  return linkingUrl || Linking.getInitialURL()
}

export default function AuthCallback() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const linkingUrl = Linking.useURL()

  useEffect(() => {
    let active = true
    const complete = async () => {
      try {
        const url = await currentCallbackUrl(linkingUrl)
        if (!url) throw new Error(t("missingVerificationLink"))
        const session = await createSessionFromUrl(url) ?? await getSession()
        if (!session) throw new Error(t("invalidVerificationLink"))

        const metadata = session.user.user_metadata
        if (metadata?.onboarding_profile === true) {
          const profile: Record<string, unknown> = { display_name: metadata.display_name, contacts: metadata.contacts ?? {} }
          if (metadata.location_id) profile.location_id = metadata.location_id
          // Authentication should still complete if optional profile hydration
          // is temporarily unavailable; the fields remain in user metadata.
          try { await updateProfile(profile) } catch { /* editable later in Settings */ }
        }
        if (active) router.replace("/(tabs)/home")
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : t("verificationFailed"))
      }
    }
    void complete()
    return () => { active = false }
  }, [linkingUrl, t])

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.title}>{t("verificationFailed")}</Text>
          <Text style={styles.message}>{error}</Text>
          <Text style={styles.link} accessibilityRole="link" onPress={() => router.replace("/login")}>{t("backToLogin")}</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.title}>{t("verifyingEmail")}</Text>
          <Text style={styles.message}>{t("verificationWait")}</Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: palette.background },
  title: { marginTop: 18, fontFamily: typography.serif, fontSize: 28, fontWeight: "700", color: palette.ink, textAlign: "center" },
  message: { marginTop: 10, color: palette.textMuted, fontSize: 15, lineHeight: 22, textAlign: "center", maxWidth: 420 },
  link: { marginTop: 22, color: palette.accentDark, fontSize: 15, fontWeight: "800", textDecorationLine: "underline", padding: 12 },
})
