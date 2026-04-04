import { Alert, Pressable, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { palette } from "@/constants/theme"
import { signUp } from "@/services/authentication"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields")
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password)
    setLoading(false)

    if (error) {
      Alert.alert("Signup failed", error.message)
      return
    }

    Alert.alert("Success", "Please login.")
    router.replace("/login")
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Join the circle</Text>
        <Text style={styles.title}>Create your account.</Text>
        <Text style={styles.subtitle}>Start building your shelf and matching with readers nearby.</Text>

        <AppInput placeholder="Email" value={email} onChangeText={setEmail} />
        <AppInput placeholder="Password" value={password} secure onChangeText={setPassword} />

        <AppButton title="Sign Up" onPress={handleSignup} loading={loading} />

        <Pressable onPress={() => router.push("/login")}>
          <Text style={styles.link}>Already have an account? Login</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: palette.background,
  },
  card: {
    backgroundColor: palette.surface,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: palette.border,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.textSoft,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: palette.text,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 22,
    fontSize: 15,
    lineHeight: 22,
    color: palette.textMuted,
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: palette.textSoft,
    fontWeight: "700",
  },
})
