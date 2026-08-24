import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Switch, View } from "react-native"

import { palette, radii } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"
import { useAppTheme } from "@/theme/ThemeContext"

export default function ThemeSwitch() {
  const { isDark, setTheme } = useAppTheme()
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Ionicons name="sunny-outline" size={17} color={!isDark ? palette.orange : palette.textMuted} />
      <Switch
        accessibilityLabel={t("darkMode")}
        accessibilityHint={`${t("lightTheme")} / ${t("darkTheme")}`}
        value={isDark}
        onValueChange={(enabled) => setTheme(enabled ? "dark" : "light")}
        trackColor={{ false: palette.blue, true: palette.accentSoft }}
        thumbColor={isDark ? palette.accentDark : palette.yellow}
        ios_backgroundColor={palette.blue}
      />
      <Ionicons name="moon-outline" size={17} color={isDark ? palette.accentDark : palette.textMuted} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: 130, height: 46, flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, backgroundColor: palette.paper },
})
