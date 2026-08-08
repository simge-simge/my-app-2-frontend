import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { BookDoodles } from "@/components/BookDoodles"
import GentleEntrance from "@/components/GentleEntrance"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { signUp } from "@/services/authentication"
import { updateProfile } from "@/services/profile"

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

function isExistingAccountError(error: { message: string; code?: string }) {
  return error.code === "user_already_exists"
    || error.code === "email_exists"
    || error.code === "invalid_credentials"
    || error.code === "email_not_confirmed"
    || error.code === "weak_password"
    || /already (registered|exists)/i.test(error.message)
    || error.message.toLowerCase().includes("invalid login credentials")
    || error.message.toLowerCase().includes("email not confirmed")
}

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [instagram, setInstagram] = useState("")
  const [telegram, setTelegram] = useState("")
  const [signupWarning, setSignupWarning] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email.trim() || !password) { Alert.alert("Create account failed", "Please enter your email and password."); return }
    try {
      setLoading(true)
      setSignupWarning(null)
      const normalizedEmail = email.trim()
      const { error } = await signUp(normalizedEmail, password)
      if (error) {
        if (isExistingAccountError(error)) {
          setSignupWarning("This account already exists. Please log in.")
        } else {
          setSignupWarning(error.message || "Account creation failed. Please try again.")
        }
        return
      }

      const contacts = Object.fromEntries(
        Object.entries({ phone, instagram, telegram })
          .map(([key, value]) => [key, value.trim()])
          .filter(([, value]) => value !== ""),
      )
      try {
        await updateProfile({
          display_name: name.trim() || generateUsername(normalizedEmail),
          contacts,
        })
      } catch {
        Alert.alert("Profile setup incomplete", "Your account was created. You can update your optional profile details in Settings.")
      }
      router.replace("/(tabs)/home")
    } catch (error) {
      if (error instanceof Error && isExistingAccountError(error)) {
        setSignupWarning("This account already exists. Please log in.")
      } else {
        setSignupWarning(error instanceof Error ? error.message : "Account creation failed. Please try again.")
      }
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <GentleEntrance style={styles.card}>
          <BookDoodles compact />
          <Text style={styles.eyebrow}>CommonShelf · Join the circle</Text>
          <Text style={styles.title}>Make room for a new story.</Text>
          <Text style={styles.subtitle}>Build your shelf and meet readers in your community.</Text>
          <View style={styles.form}>
            <AppInput placeholder="Email" value={email} onChangeText={(value) => { setEmail(value); setSignupWarning(null) }} />
            <AppInput placeholder="Password" value={password} secure onChangeText={(value) => { setPassword(value); setSignupWarning(null) }} />
            <Text style={styles.optionalHint}>Profile details (optional)</Text>
            <AppInput placeholder="Name (optional)" value={name} onChangeText={setName} />
            <AppInput placeholder="Phone (optional)" value={phone} onChangeText={setPhone} />
            <AppInput placeholder="Instagram (optional)" value={instagram} onChangeText={setInstagram} />
            <AppInput placeholder="Telegram (optional)" value={telegram} onChangeText={setTelegram} />
            <AppButton title="Create account" onPress={handleSignup} loading={loading} />
            {signupWarning ? (
              <View style={styles.warning} accessibilityRole="alert">
                <Text style={styles.warningTitle}>Account already exists</Text>
                <Text style={styles.warningText}>{signupWarning}</Text>
              </View>
            ) : null}
          </View>
          <Pressable style={styles.linkTarget} onPress={() => router.push("/login")} accessibilityRole="link">
            <Text style={styles.link}>Already have an account? Log in</Text>
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
  optionalHint: { marginTop: 3, marginBottom: 13, color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  warning: { marginTop: 14, padding: 14, gap: 5, borderWidth: 1.5, borderColor: palette.danger, borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  warningTitle: { color: palette.danger, fontSize: 15, fontWeight: "800" },
  warningText: { color: palette.text, fontSize: 14, lineHeight: 20 },
  linkTarget: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  link: { color: palette.accentDark, fontWeight: "800", textDecorationLine: "underline" },
})
