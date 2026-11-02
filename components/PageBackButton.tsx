import { Ionicons } from "@expo/vector-icons"
import { router, type Href } from "expo-router"
import { Pressable, StyleSheet } from "react-native"

import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function PageBackButton({ label, fallback = "/home" }: { label?: string; fallback?: Href }) {
  const { t } = useTranslation()
  const displayLabel = label ?? t("back")
  const handlePress = () => {
    if (router.canGoBack()) {
      router.back()
      return
    }

    router.replace(fallback)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
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
    height: 44,
    width: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { transform: [{ scale: 0.94 }], opacity: 0.78 },
})
