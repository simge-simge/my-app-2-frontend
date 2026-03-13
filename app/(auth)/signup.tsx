import { View, StyleSheet, Text, Pressable, Alert } from "react-native"
import { useState } from "react"
import { router } from "expo-router"

import AppInput from "@/components/AppInput"
import AppButton from "@/components/AppButton"
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
      <Text style={styles.title}>Create Account</Text>

      <AppInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      <AppInput
        placeholder="Password"
        value={password}
        secure
        onChangeText={setPassword}
      />

      <AppButton
        title="Sign Up"
        onPress={handleSignup}
        loading={loading}
      />

      <Pressable onPress={() => router.push("/login")}>
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 30,
    fontWeight: "600",
    marginBottom: 30,
  },
  link: {
    marginTop: 20,
    textAlign: "center",
    color: "#4A6CF7",
  },
})