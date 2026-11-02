import { Stack } from "expo-router"

import RequireAuth from "@/components/RequireAuth"
import { palette } from "@/constants/theme"

export default function ChatsLayout() {
  return (
    <RequireAuth>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background as string } }}>
        <Stack.Screen name="[conversationId]" />
      </Stack>
    </RequireAuth>
  )
}
