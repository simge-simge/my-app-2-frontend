import { Ionicons } from "@expo/vector-icons"
import { router, type Href } from "expo-router"
import { Pressable, StyleSheet, Text } from "react-native"

import { palette, radii, typography } from "@/constants/theme"
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
      <Text style={styles.label}>{displayLabel}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: 10,
    flexShrink: 0,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.paper,
  },
  label: { color: palette.ink, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  pressed: { backgroundColor: palette.surfaceMuted, opacity: 0.82 },
})
