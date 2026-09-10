import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native"

import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function LanguageSwitch({ style }: { style?: StyleProp<ViewStyle> }) {
  const { language, setLanguage, t } = useTranslation()
  const isTurkish = language === "tr"

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={t("chooseLanguage")}
      accessibilityHint={`${t("english")} / ${t("turkish")}`}
      accessibilityState={{ checked: isTurkish }}
      onPress={() => setLanguage(isTurkish ? "en" : "tr")}
      style={({ pressed }) => [styles.container, style, pressed && styles.pressed]}
    >
      <Text style={[styles.text, !isTurkish && styles.activeText]}>EN</Text>
      <Text style={styles.separator}>|</Text>
      <Text style={[styles.text, isTurkish && styles.activeText]}>TR</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { minWidth: 82, minHeight: 44, flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 5 },
  text: { color: palette.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textAlign: "center" },
  activeText: { color: palette.accentDark, fontWeight: "900", textDecorationLine: "underline" },
  separator: { color: palette.borderStrong, fontSize: 12, opacity: 0.65 },
  pressed: { opacity: 0.55 },
})
