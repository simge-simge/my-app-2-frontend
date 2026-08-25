import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { BookDoodles } from "@/components/BookDoodles"
import GentleEntrance from "@/components/GentleEntrance"
import { AuthDivider, GoogleAuthButton } from "@/components/SocialAuth"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { resendSignupVerification, signIn, signInWithGoogle } from "@/services/authentication"
import { useTranslation } from "@/localization/LanguageContext"

export default function Login() {
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loginWarning, setLoginWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)

  const handleResend = async () => {
    try {
      setResending(true)
      const { error } = await resendSignupVerification(email.trim())
      if (error) Alert.alert(t("emailNotSent"), error.message)
      else Alert.alert(t("emailSent"), t("verificationResent"))
    } finally { setResending(false) }
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setLoginWarning(null)
      const result = await signInWithGoogle()
      if (result.error) Alert.alert(t("googleLoginFailed"), result.error.message)
      else if (result.data.session) router.replace("/(tabs)/home")
    } catch (error) {
      Alert.alert(t("googleLoginFailed"), error instanceof Error ? error.message : t("tryAgain"))
    } finally { setGoogleLoading(false) }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) { Alert.alert(t("loginFailed"), t("enterEmailPassword")); return }
    try {
      setLoading(true)
      setLoginWarning(null)
      setNeedsVerification(false)
      const { error } = await signIn(email.trim(), password)
      if (error) {
        if (error.code === "email_not_confirmed" || error.message.toLowerCase().includes("email not confirmed")) {
          setNeedsVerification(true)
          setLoginWarning(t("verifyBeforeLogin"))
        } else if (error.code === "invalid_credentials" || error.message.toLowerCase().includes("invalid login credentials")) {
          setLoginWarning(t("invalidAccount"))
        } else {
          Alert.alert(t("loginFailed"), error.message)
        }
        return
      }
      router.replace("/(tabs)/home")
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <GentleEntrance style={styles.card}>
          <BookDoodles compact />
          <Text style={styles.eyebrow}>{t("welcomeBack")}</Text>
          <Text style={styles.title}>{t("returnShelf")}</Text>
          <Text style={styles.subtitle}>{t("loginSubtitle")}</Text>
          <View style={styles.form}>
            <GoogleAuthButton onPress={handleGoogleLogin} loading={googleLoading} />
            <AuthDivider />
            <AppInput placeholder={t("email")} value={email} onChangeText={(value) => { setEmail(value); setLoginWarning(null); setNeedsVerification(false) }} />
            <AppInput placeholder={t("password")} value={password} secure onChangeText={(value) => { setPassword(value); setLoginWarning(null); setNeedsVerification(false) }} />
            <AppButton title={t("login")} onPress={handleLogin} loading={loading} />
            {loginWarning ? (
              <View style={styles.warning} accessibilityRole="alert">
                <Text style={styles.warningTitle}>{needsVerification ? t("checkYourEmail") : t("accountNotFound")}</Text>
                <Text style={styles.warningText}>{loginWarning}</Text>
                {needsVerification ? <AppButton title={t("resendVerification")} variant="secondary" onPress={handleResend} loading={resending} /> : null}
              </View>
            ) : null}
          </View>
          <Pressable style={styles.linkTarget} onPress={() => router.push("/signup")} accessibilityRole="link">
            <Text style={styles.link}>{t("notRegistered")}</Text>
          </Pressable>
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
  warning: { marginTop: 14, padding: 14, gap: 5, borderWidth: 1.5, borderColor: palette.danger, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  warningTitle: { color: palette.danger, fontSize: 15, fontWeight: "800" },
  warningText: { color: palette.text, fontSize: 14, lineHeight: 20 },
  linkTarget: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  link: { color: palette.accentDark, fontWeight: "800", textDecorationLine: "underline" },
})
