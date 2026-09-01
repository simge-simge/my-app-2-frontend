import { Pressable, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"

import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type LegalLinksProps = {
  showAgreement?: boolean
}

export default function LegalLinks({ showAgreement = false }: LegalLinksProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      {showAgreement ? <Text style={styles.agreement}>{t("legalAgreement")}</Text> : null}
      <View style={styles.links}>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("privacyPolicy")}
          onPress={() => router.push("/privacy")}
          style={({ pressed }) => [styles.linkTarget, pressed && styles.pressed]}
        >
          <Text style={styles.link}>{t("privacyPolicy")}</Text>
        </Pressable>
        <Text style={styles.separator} accessibilityElementsHidden>·</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("termsOfService")}
          onPress={() => router.push("/terms")}
          style={({ pressed }) => [styles.linkTarget, pressed && styles.pressed]}
        >
          <Text style={styles.link}>{t("termsOfService")}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 10 },
  agreement: { color: palette.textMuted, fontSize: 12, lineHeight: 18, textAlign: "center", maxWidth: 390 },
  links: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 4 },
  linkTarget: { minHeight: 40, justifyContent: "center", paddingHorizontal: 5 },
  link: { color: palette.accentDark, fontSize: 12, fontWeight: "700", textDecorationLine: "underline" },
  separator: { color: palette.textMuted, fontSize: 12 },
  pressed: { opacity: 0.65 },
})
