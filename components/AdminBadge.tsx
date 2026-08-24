import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function AdminBadge() {
  const { t } = useTranslation()
  return (
    <View style={styles.badge} accessibilityLabel={t("communityAdmin")}>
      <Ionicons name="book" size={12} color={palette.ink} />
      <Text style={styles.text}>{t("admin")}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: palette.yellow,
    borderWidth: 1,
    borderColor: palette.borderStrong,
    transform: [{ rotate: "-2deg" }],
  },
  text: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: "700",
  },
})
