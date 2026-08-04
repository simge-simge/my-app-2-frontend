import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { BookDoodles } from "@/components/BookDoodles"
import GentleEntrance from "@/components/GentleEntrance"
import { layout, palette, radii, shadows, typography } from "@/constants/theme"
import { signUp } from "@/services/authentication"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password) { Alert.alert("Error", "Please fill all fields"); return }
    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)
    if (error) { Alert.alert("Signup failed", error.message); return }
    Alert.alert("Success", "Please login.")
    router.replace("/login")
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
            <AppInput placeholder="Email" value={email} onChangeText={setEmail} />
            <AppInput placeholder="Password" value={password} secure onChangeText={setPassword} />
            <AppButton title="Create account" onPress={handleSignup} loading={loading} />
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
  linkTarget: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 8 },
  link: { color: palette.accentDark, fontWeight: "800", textDecorationLine: "underline" },
})
