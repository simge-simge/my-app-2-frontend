import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Pressable, StyleSheet } from "react-native"

import { palette } from "@/constants/theme"

export default function PageBackButton() {
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace("/home")
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Go back"
      hitSlop={6}
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons name="arrow-back" size={22} color={palette.ink} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    backgroundColor: palette.paper,
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.78 },
})
