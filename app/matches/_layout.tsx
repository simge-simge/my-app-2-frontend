import { Stack } from "expo-router"

import DetailPageHeader from "@/components/DetailPageHeader"
import RequireAuth from "@/components/RequireAuth"
import { palette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function MatchesLayout() {
  const { t } = useTranslation()
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerTitleAlign: "left", headerStyle: { backgroundColor: palette.background as string }, headerShadowVisible: false, headerTintColor: palette.text as string, headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif }, contentStyle: { backgroundColor: palette.background as string } }}>
        <Stack.Screen name="[matchId]" options={{ title: t("matchDetails"), header: () => <DetailPageHeader title={t("matchDetails")} fallback="/matches" /> }} />
      </Stack>
    </RequireAuth>
  )
}
