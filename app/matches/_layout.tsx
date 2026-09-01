import { Stack } from "expo-router"
import { useWindowDimensions, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import RequireAuth from "@/components/RequireAuth"
import { layout, palette, typography } from "@/constants/theme"

export default function MatchesLayout() {
  const { width } = useWindowDimensions()
  const detailBackOffset = 18 + Math.max(0, (width - layout.readingMax) / 2)
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerStyle: { backgroundColor: palette.background as string }, headerShadowVisible: false, headerTintColor: palette.text as string, headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif }, contentStyle: { backgroundColor: palette.background as string } }}>
        <Stack.Screen name="[matchId]" options={{ headerTitle: "", headerBackVisible: false, headerLeft: () => <View style={{ marginLeft: detailBackOffset, marginTop: 4 }}><PageBackButton fallback="/matches" /></View> }} />
      </Stack>
    </RequireAuth>
  )
}
