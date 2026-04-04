import { Alert, StyleSheet, Text, View } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppButton from "@/components/AppButton"
import AppInput from "@/components/AppInput"
import { palette } from "@/constants/theme"
import { signIn } from "@/services/authentication"

export default function Login() {
  const [email, setEmail] = useState("simge@gmail.com")
  const [password, setPassword] = useState("simge123")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await signIn(email, password)

      if (error) {
        Alert.alert("Login failed", error.message)
        return
      }

      router.replace("/(tabs)/home")
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Welcome back</Text>
        <Text style={styles.title}>Sign in to your shelf.</Text>
        <Text style={styles.subtitle}>Pick up where you left off and keep your reading circle moving.</Text>

        <AppInput placeholder="Email" value={email} onChangeText={setEmail} />
        <AppInput placeholder="Password" value={password} secure onChangeText={setPassword} />

        <AppButton title="Login" onPress={handleLogin} loading={loading} />
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
})
