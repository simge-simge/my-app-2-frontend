import { Tabs } from "expo-router"

import PersistentTabBar from "@/components/PersistentTabBar"
import { palette, typography } from "@/constants/theme"

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <PersistentTabBar {...props} />}
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text, fontWeight: "700", fontFamily: typography.serif },
        sceneStyle: { backgroundColor: palette.background },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", headerShown: false }} />
      <Tabs.Screen name="search" options={{ title: "Search", headerShown: false }} />
      <Tabs.Screen name="library" options={{ title: "My Library", headerShown: false }} />
      <Tabs.Screen name="matches" options={{ title: "My Matches", headerShown: false }} />
      <Tabs.Screen name="inbox" options={{ title: "Inbox", href: null }} />
      <Tabs.Screen name="settings" options={{ title: "Settings", href: null }} />
    </Tabs>
  )
}
