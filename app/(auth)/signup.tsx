import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { BookDoodles } from "@/components/BookDoodles"
import GentleEntrance from "@/components/GentleEntrance"
import LocationPicker from "@/components/LocationPicker"
import { AuthDivider, GoogleAuthButton } from "@/components/SocialAuth"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { resendSignupVerification, signInWithGoogle, signUp } from "@/services/authentication"
import { updateProfile } from "@/services/profile"
import type { Location } from "@/services/locations"
import { runInBackground } from "@/utils/backgroundAction"
import { useTranslation } from "@/localization/LanguageContext"

export function generateUsername(email: string) {
  const emailPrefix = email.split("@")[0] ?? ""
  const base = emailPrefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || "reader"
  const suffix = Math.random().toString(36).slice(2, 6).padEnd(4, "0")
  return `${base}_${suffix}`
}

export default function Signup() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [location, setLocation] = useState<Location | null>(null)
  const [locationValid, setLocationValid] = useState(true)
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [telegram, setTelegram] = useState("")
  const [signupWarning, setSignupWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true)
      setSignupWarning(null)
      const result = await signInWithGoogle()
      if (result.error) setSignupWarning(result.error.message)
      else if (result.data.session) router.replace("/(tabs)/home")
    } catch (error) {
      setSignupWarning(error instanceof Error ? error.message : t("tryAgain"))
    } finally { setGoogleLoading(false) }
  }

  const handleResend = async () => {
    if (!verificationEmail) return
    try {
      setResending(true)
      const { error } = await resendSignupVerification(verificationEmail)
      if (error) Alert.alert(t("emailNotSent"), error.message)
      else Alert.alert(t("emailSent"), t("verificationResent"))
    } finally { setResending(false) }
  }

  const handleSignup = async () => {
    if (!email.trim() || !password) { Alert.alert(t("createAccountFailed"), t("enterEmailPassword")); return }
    if (!locationValid) { Alert.alert(t("createAccountFailed"), t("selectOrClearLocation")); return }
    try {
      setLoading(true)
      setSignupWarning(null)
      const normalizedEmail = email.trim()
      if (password.length < 8) { setSignupWarning(t("passwordRequirements")); return }
      const contacts = Object.fromEntries(
        Object.entries({ phone, instagram, telegram })
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value !== ""),
      )
      const profileUpdate: Record<string, unknown> = {
        display_name: name.trim() || generateUsername(normalizedEmail),
        contacts,
      }
      if (location) profileUpdate.location_id = location.id

      const { data, error } = await signUp(normalizedEmail, password, {
        display_name: profileUpdate.display_name as string,
        contacts,
        ...(location ? { location_id: location.id } : {}),
        onboarding_profile: true,
      })
      if (error) {
        if (error.code === "user_already_exists" || error.code === "email_exists") {
          // Match Supabase's anti-enumeration behavior: do not disclose whether
          // an address is already registered.
          setVerificationEmail(normalizedEmail)
          return
        }
        setSignupWarning(error.message || t("accountCreationFailed"))
        return
      }
      if (!data.session) {
        setVerificationEmail(normalizedEmail)
        return
      }
      router.replace("/(tabs)/home")
      runInBackground(() => updateProfile(profileUpdate), {
        onError: () => Alert.alert(t("profileIncomplete"), t("profileIncompleteMessage")),
      })
    } catch (error) {
      setSignupWarning(error instanceof Error ? error.message : t("accountCreationFailed"))
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <GentleEntrance style={styles.card}>
          <BookDoodles compact />
          {verificationEmail ? (
            <View accessibilityRole="alert">
              <Text style={styles.eyebrow}>{t("oneMoreStep")}</Text>
              <Text style={styles.title}>{t("checkYourEmail")}</Text>
              <Text style={styles.subtitle}>{t("verificationSentTo", { email: verificationEmail })}</Text>
              <Text style={styles.verificationHint}>{t("verificationHint")}</Text>
              <AppButton title={t("resendVerification")} variant="secondary" onPress={handleResend} loading={resending} />
              <Pressable style={styles.linkTarget} onPress={() => router.replace("/login")} accessibilityRole="link">
                <Text style={styles.link}>{t("backToLogin")}</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.eyebrow}>{t("joinCircle")}</Text>
              <Text style={styles.title}>{t("makeRoom")}</Text>
              <Text style={styles.subtitle}>{t("signupSubtitle")}</Text>
              <View style={styles.form}>
                <GoogleAuthButton onPress={handleGoogleSignup} loading={googleLoading} />
                <AuthDivider />
                <AppInput placeholder={t("email")} value={email} onChangeText={(value) => { setEmail(value); setSignupWarning(null) }} />
                <AppInput placeholder={t("password")} value={password} secure autoComplete="new-password" onChangeText={(value) => { setPassword(value); setSignupWarning(null) }} />
                <Text style={styles.passwordHint}>{t("passwordRequirements")}</Text>
                <Text style={styles.optionalHint}>{t("profileOptional")}</Text>
                <AppInput placeholder={t("nameOptional")} value={name} onChangeText={setName} />
                <View style={styles.locationField}>
                  <LocationPicker label={t("locationOptional")} selected={location} onSelect={setLocation} onValidityChange={setLocationValid} />
                </View>
                <AppInput placeholder={t("phoneOptional")} value={phone} onChangeText={setPhone} />
                <AppInput placeholder={t("instagramOptional")} value={instagram} onChangeText={setInstagram} />
                <AppInput placeholder={t("telegramOptional")} value={telegram} onChangeText={setTelegram} />
                <AppButton title={t("createAccountAction")} onPress={handleSignup} loading={loading} />
                {signupWarning ? (
                  <View style={styles.warning} accessibilityRole="alert">
                    <Text style={styles.warningTitle}>{t("createAccountFailed")}</Text>
                    <Text style={styles.warningText}>{signupWarning}</Text>
                  </View>
                ) : null}
              </View>
              <Pressable style={styles.linkTarget} onPress={() => router.push("/login")} accessibilityRole="link">
                <Text style={styles.link}>{t("alreadyAccount")}</Text>
              </Pressable>
            </>
          )}
        </GentleEntrance>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  container: { flexGrow: 1, justifyContent: "center", padding: 20, paddingVertical: 32 },
  card: { width: "100%", maxWidth: layout.formMax, alignSelf: "center", backgroundColor: palette.paper, borderRadius: radii.xl, borderCurve: "continuous", padding: 24, borderWidth: 1.5, borderColor: palette.borderStrong, ...shadows.lifted },
  eyebrow: { marginTop: 12, fontSize: 12, fontWeight: "800", color: palette.accentDark, textTransform: "uppercase", letterSpacing: 1.4 },
  title: { marginTop: 7, fontFamily: typography.serif, fontSize: 32, lineHeight: 38, fontWeight: "700", color: palette.ink },
  subtitle: { marginTop: 7, fontSize: 15, lineHeight: 22, color: palette.textMuted },
  form: { marginTop: 22 },
  optionalHint: { marginTop: 3, marginBottom: 13, color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  passwordHint: { marginTop: -7, marginBottom: 15, color: palette.textMuted, fontSize: 12, lineHeight: 17 },
  verificationHint: { marginTop: 16, color: palette.textMuted, fontSize: 14, lineHeight: 21 },
  locationField: { marginBottom: 15 },
  warning: { marginTop: 14, padding: 14, gap: 5, borderWidth: 1.5, borderColor: palette.danger, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  warningTitle: { color: palette.danger, fontSize: 15, fontWeight: "800" },
  warningText: { color: palette.text, fontSize: 14, lineHeight: 20 },
  linkTarget: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  link: { color: palette.accentDark, fontWeight: "800", textDecorationLine: "underline" },
})
