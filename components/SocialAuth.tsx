import { Pressable, StyleSheet, Text, View } from "react-native"

import { palette, radii, shadows } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type GoogleButtonProps = { onPress: () => void; loading?: boolean }

export function GoogleAuthButton({ onPress, loading }: GoogleButtonProps) {
  const { t } = useTranslation()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(loading), busy: Boolean(loading) }}
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [styles.googleButton, pressed && styles.pressed, loading && styles.disabled]}
    >
      <View style={styles.googleMark} accessibilityElementsHidden>
        <Text style={styles.googleLetter}>G</Text>
      </View>
      <Text style={styles.googleText}>{loading ? t("connectingGoogle") : t("continueWithGoogle")}</Text>
    </Pressable>
  )
}

export function AuthDivider() {
  const { t } = useTranslation()
  return (
    <View style={styles.divider} accessibilityRole="text">
      <View style={styles.line} />
      <Text style={styles.or}>{t("orContinueWithEmail")}</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  googleButton: { minHeight: 54, borderRadius: radii.md, borderCurve: "continuous", borderWidth: 1.5, borderColor: palette.borderStrong, backgroundColor: palette.paper, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, paddingHorizontal: 18, ...shadows.soft },
  googleMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  googleLetter: { color: "#4285F4", fontSize: 17, fontWeight: "900" },
  googleText: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  pressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.04 },
  disabled: { opacity: 0.65 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: palette.border },
  or: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
})
