import { Stack } from "expo-router"

import PageBackButton from "@/components/PageBackButton"
import DetailPageHeader from "@/components/DetailPageHeader"
import RequireAuth from "@/components/RequireAuth"
import { palette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function BooksLayout() {
  const { t } = useTranslation()
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerTitleAlign: "left", headerStyle: { backgroundColor: palette.background as string }, headerShadowVisible: false, headerTintColor: palette.text as string, headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif }, contentStyle: { backgroundColor: palette.background as string } }}>
        <Stack.Screen name="new" options={{ title: t("addBook"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
        <Stack.Screen name="shelf-scan" options={{ title: t("scanShelf"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
        <Stack.Screen name="[bookId]" options={{ title: t("bookDetails"), header: () => <DetailPageHeader title={t("bookDetails")} fallback="/library" /> }} />
        <Stack.Screen name="edit/[bookId]" options={{ title: t("editBook"), headerBackVisible: false, headerLeft: () => <PageBackButton fallback="/library" /> }} />
      </Stack>
    </RequireAuth>
  )
}
