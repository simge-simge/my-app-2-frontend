import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle } from "react-native"
import { palette, radii, shadows } from "@/constants/theme"

type Props = {
  title: string
  onPress: () => void
  loading?: boolean
  variant?: "primary" | "secondary"
  style?: ViewStyle
}

export default function AppButton({ title, onPress, loading, variant = "primary", style }: Props) {
  const secondary = variant === "secondary"

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(loading), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && styles.pressed,
        loading && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={secondary ? palette.accentDark : palette.paper} /> : null}
      <Text style={[styles.text, secondary && styles.secondaryText]}>
        {loading ? "Loading..." : title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    backgroundColor: palette.accent,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: palette.accentDark,
    ...shadows.soft,
  },
  secondary: {
    backgroundColor: palette.paper,
    borderColor: palette.borderStrong,
    shadowOpacity: 0.04,
  },
  pressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.04 },
  disabled: { opacity: 0.7 },
  text: { color: palette.paper, fontWeight: "800", fontSize: 16, letterSpacing: 0.1 },
  secondaryText: { color: palette.ink },
})
