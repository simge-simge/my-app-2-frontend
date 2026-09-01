import { Stack } from "expo-router"
import { useWindowDimensions, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import RequireAuth from "@/components/RequireAuth"
import { layout, palette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function BooksLayout() {
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const detailBackOffset = 22 + Math.max(0, (width - layout.readingMax) / 2)
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerStyle: { backgroundColor: palette.background as string }, headerShadowVisible: false, headerTintColor: palette.text as string, headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif }, contentStyle: { backgroundColor: palette.background as string } }}>
        <Stack.Screen name="new" options={{ title: t("addBook"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
        <Stack.Screen name="shelf-scan" options={{ title: t("scanShelf"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
        <Stack.Screen name="[bookId]" options={{ headerTitle: "", headerBackVisible: false, headerLeft: () => <View style={{ marginLeft: detailBackOffset, marginTop: 4 }}><PageBackButton fallback="/library" /></View> }} />
        <Stack.Screen name="edit/[bookId]" options={{ title: t("editBook"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
      </Stack>
    </RequireAuth>
  )
}
