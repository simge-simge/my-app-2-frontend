import { View, StyleSheet } from "react-native"
import { useState } from "react"
import { router } from "expo-router"
import { signIn } from "@/services/authentication"
import AppInput from "@/components/AppInput"
import AppButton from "@/components/AppButton"

export default function Login() {

  // For testing purposes, pre-fill the email and password fields
  // Remove the default values and uncomment the empty state initialization for production
  const [email, setEmail] = useState("simge@gmail.com")
  const [password, setPassword] = useState("simge123")

  // const [email, setEmail] = useState("")
  // const [password, setPassword] = useState("")

  const handleLogin = async () => {
    const { error } = await signIn(email, password)
    if (error) {
      console.log(error.message)
    }

    router.replace("/(tabs)/home")
    
  }

  return (
    <View style={styles.container}>
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

      <AppButton title="Login" onPress={handleLogin} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
})
