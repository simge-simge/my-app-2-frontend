import { ActivityIndicator, Pressable, Text, StyleSheet, ViewStyle } from "react-native"
import { palette, radii } from "@/constants/theme"

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
    minHeight: 50,
    backgroundColor: palette.accent,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 9,
    marginTop: 10,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  secondary: {
    backgroundColor: palette.paper,
    borderColor: palette.border,
  },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.58 },
  text: { color: palette.white, fontWeight: "700", fontSize: 15, letterSpacing: 0.1 },
  secondaryText: { color: palette.ink },
})
