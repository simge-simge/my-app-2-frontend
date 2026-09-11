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
      <Text style={[styles.text, isTurkish && styles.activeText]}>TR</Text>
      <Text style={styles.separator}>/</Text>
      <Text style={[styles.text, !isTurkish && styles.activeText]}>EN</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { minWidth: 68, minHeight: 44, flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 2 },
  text: { color: palette.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 0.7, textAlign: "center" },
  activeText: { color: palette.accentDark, fontWeight: "800" },
  separator: { color: palette.textMuted, fontSize: 11, opacity: 0.55 },
  pressed: { opacity: 0.55 },
})
