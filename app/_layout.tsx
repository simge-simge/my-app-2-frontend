import { Stack } from "expo-router";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/constants/theme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <RootStack />
    </SafeAreaProvider>
  );
}

function RootStack() {
  const insets = useSafeAreaInsets();
  const headerlessScreenOptions = {
    headerShown: false,
    contentStyle: { paddingTop: insets.top },
  } as const;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: palette.background },
        headerShadowVisible: false,
        headerTintColor: palette.text,
        headerTitleStyle: { color: palette.text, fontWeight: "700" },
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen name="index" options={headerlessScreenOptions} />
      <Stack.Screen name="(auth)/login" options={headerlessScreenOptions} />
      <Stack.Screen name="(auth)/signup" options={headerlessScreenOptions} />
      <Stack.Screen name="(tabs)/home" options={headerlessScreenOptions} />
      <Stack.Screen name="(tabs)/explore" options={{ title: "Explore" }} />
      <Stack.Screen name="(tabs)/search" options={{ title: "Search Books" }} />
      <Stack.Screen name="(tabs)/library" options={{ title: "My Library" }} />
      <Stack.Screen name="(tabs)/matches" options={{ title: "My Matches" }} />
      <Stack.Screen name="(tabs)/settings" options={{ title: "Settings" }} />
      <Stack.Screen name="books/new" options={{ title: "Add Book" }} />
      <Stack.Screen name="books/[bookId]" options={{ title: "Book Details" }} />
      <Stack.Screen name="matches/[matchId]" options={{ title: "Match Details" }} />
    </Stack>
  );
}
