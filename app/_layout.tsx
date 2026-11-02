import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import AppTabHeader from "@/components/AppTabHeader";
import { palette, typography } from "@/constants/theme";
import { LanguageProvider } from "@/localization/LanguageContext";
import { AuthSessionProvider, useAuthSession } from "@/services/authSession";
import { ThemeProvider, useAppTheme } from "@/theme/ThemeContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthSessionProvider><ThemedRoot /></AuthSessionProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedRoot() {
  const { isDark } = useAppTheme();
  const { loading } = useAuthSession();
  const pathname = usePathname();
  const statusBarStyle = pathname === "/" ? "dark" : isDark ? "light" : "dark";

  // Keep the public homepage available to static rendering and OAuth reviewers.
  // Private routes still wait for session restoration before their guards run.
  if (loading && pathname !== "/") {
    return (
      <View style={styles.screen}>
        <StatusBar style={statusBarStyle} />
        <AppTabHeader />
        <View style={styles.loading}><ActivityIndicator size="large" color={palette.accent} /></View>
      </View>
    );
  }

  return <><StatusBar style={statusBarStyle} /><RootStack /></>;
}

function RootStack() {
  const pathname = usePathname();
  const showHeaderActions = ["/home", "/search", "/library", "/explore", "/messages", "/matches"].includes(pathname);
  const insets = useSafeAreaInsets();
  const headerlessScreenOptions = {
    headerShown: false,
    contentStyle: { paddingTop: insets.top },
  } as const;

  return (
    <Stack
      screenOptions={{
        headerBackButtonDisplayMode: "minimal",
        header: () => <AppTabHeader showActions={showHeaderActions} refreshKey={pathname} />,
        headerTitleAlign: "left",
        headerStyle: { backgroundColor: palette.background as string },
        headerShadowVisible: false,
        headerTintColor: palette.text as string,
        headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif },
        headerBackTitleStyle: { fontFamily: typography.sans },
        contentStyle: { backgroundColor: palette.background as string },
      }}
    >
      <Stack.Screen name="index" options={headerlessScreenOptions} />
      <Stack.Screen name="app" />
      <Stack.Screen name="privacy" options={{ title: "Privacy Policy", header: () => <AppTabHeader title="Privacy Policy" /> }} />
      <Stack.Screen name="terms" options={{ title: "Terms of Service", header: () => <AppTabHeader title="Terms of Service" /> }} />
      <Stack.Screen name="auth/callback" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="books" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="chats" />
      <Stack.Screen name="members" />
      <Stack.Screen name="communities" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
});
