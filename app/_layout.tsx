import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, typography } from "@/constants/theme";
import { LanguageProvider, useTranslation } from "@/localization/LanguageContext";
import { ThemeProvider, useAppTheme } from "@/theme/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider><ThemedRoot /></LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot() {
  const { isDark } = useAppTheme();
  return <><StatusBar style={isDark ? "light" : "dark"} /><RootStack /></>;
}

function RootStack() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const headerlessScreenOptions = {
    headerShown: false,
    contentStyle: { paddingTop: insets.top },
  } as const;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: palette.background as string },
        headerShadowVisible: false,
        headerTintColor: palette.text as string,
        headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif },
        headerBackTitleStyle: { fontFamily: typography.sans },
        contentStyle: { backgroundColor: palette.background as string },
      }}
    >
      <Stack.Screen name="index" options={headerlessScreenOptions} />
      <Stack.Screen name="(auth)/login" options={headerlessScreenOptions} />
      <Stack.Screen name="(auth)/signup" options={headerlessScreenOptions} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="books/new" options={{ title: t("addBook") }} />
      <Stack.Screen name="books/[bookId]" options={{ title: t("bookDetails") }} />
      <Stack.Screen name="books/edit/[bookId]" options={{ title: t("editBook") }} />
      <Stack.Screen name="matches/[matchId]" options={{ title: t("matchDetails") }} />
      <Stack.Screen name="members/[memberId]" options={{ title: t("memberLibrary") }} />
      <Stack.Screen name="communities/search" options={{ title: t("findCommunity"), presentation: "modal" }} />
    </Stack>
  );
}
