import { StyleSheet, Switch, Text, View, type StyleProp, type ViewStyle } from "react-native"

import { palette, radii } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function LanguageSwitch({ style }: { style?: StyleProp<ViewStyle> }) {
  const { language, setLanguage, t } = useTranslation()
  const isTurkish = language === "tr"

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text, !isTurkish && styles.activeText]}>EN</Text>
      <Switch
        accessibilityLabel={t("chooseLanguage")}
        accessibilityHint={`${t("english")} / ${t("turkish")}`}
        value={isTurkish}
        onValueChange={(enabled) => setLanguage(enabled ? "tr" : "en")}
        trackColor={{ false: palette.blue, true: palette.accentSoft }}
        thumbColor={isTurkish ? palette.accent : palette.ink}
        ios_backgroundColor={palette.blue}
        style={styles.switch}
      />
      <Text style={[styles.text, isTurkish && styles.activeText]}>TR</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: 130, height: 46, flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
  switch: { flexShrink: 0 },
  text: { width: 20, color: palette.textMuted, fontSize: 11, fontWeight: "800", textAlign: "center" },
  activeText: { color: palette.accentDark },
})
