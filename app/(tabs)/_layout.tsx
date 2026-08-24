import { Tabs } from "expo-router"

import PersistentTabBar from "@/components/PersistentTabBar"
import { palette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function TabLayout() {
  const { t } = useTranslation()
  return (
    <Tabs
      tabBar={(props) => <PersistentTabBar {...props} />}
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: palette.background as string },
        headerShadowVisible: false,
        headerTintColor: palette.text as string,
        headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif },
        sceneStyle: { backgroundColor: palette.background as string },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("home"), headerShown: false }} />
      <Tabs.Screen name="explore" options={{ title: t("explore"), headerShown: false }} />
      <Tabs.Screen name="search" options={{ title: t("search"), headerShown: false }} />
      <Tabs.Screen name="library" options={{ title: t("myLibrary"), headerShown: false }} />
      <Tabs.Screen name="matches" options={{ title: t("myMatches"), headerShown: false }} />
      <Tabs.Screen name="inbox" options={{ title: t("inbox"), headerShown: false, href: null }} />
      <Tabs.Screen name="settings" options={{ title: t("settings"), headerShown: false, href: null }} />
    </Tabs>
  )
}
