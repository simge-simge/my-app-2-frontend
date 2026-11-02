import { Tabs } from "expo-router"

import PersistentTabBar from "@/components/PersistentTabBar"
import RequireAuth from "@/components/RequireAuth"
import { palette } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function TabLayout() {
  const { t } = useTranslation()
  return <RequireAuth>
    <Tabs
      tabBar={(props) => <PersistentTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        header: () => null,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: palette.background as string, overflow: "hidden" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t("home"), headerShown: false }} />
      <Tabs.Screen name="library" options={{ title: t("myLibrary") }} />
      <Tabs.Screen name="search" options={{ title: t("search") }} />
      <Tabs.Screen name="explore" options={{ title: t("explore") }} />
      <Tabs.Screen name="matches" options={{ title: t("myMatches") }} />
      <Tabs.Screen name="messages" options={{ title: t("messages") }} />
      <Tabs.Screen name="inbox" options={{ title: t("inbox"), headerShown: false, href: null }} />
      <Tabs.Screen name="settings" options={{ title: t("settings"), headerShown: false, href: null }} />
    </Tabs>
  </RequireAuth>
}
