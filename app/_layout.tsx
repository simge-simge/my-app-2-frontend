import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
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

  if (loading) {
    return (
      <View style={styles.loading}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  return <><StatusBar style={isDark ? "light" : "dark"} /><RootStack /></>;
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
        headerStyle: { backgroundColor: palette.background as string },
        headerShadowVisible: false,
        headerTintColor: palette.text as string,
        headerTitleStyle: { color: palette.text as string, fontWeight: "700", fontFamily: typography.serif },
        headerBackTitleStyle: { fontFamily: typography.sans },
        contentStyle: { backgroundColor: palette.background as string },
      }}
    >
      <Stack.Screen name="index" options={headerlessScreenOptions} />
      <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
      <Stack.Screen name="terms" options={{ title: "Terms of Service" }} />
      <Stack.Screen name="auth/callback" options={headerlessScreenOptions} />
      <Stack.Screen name="(auth)" options={headerlessScreenOptions} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="books" options={{ headerShown: false }} />
      <Stack.Screen name="matches" options={{ headerShown: false }} />
      <Stack.Screen name="members" options={{ headerShown: false }} />
      <Stack.Screen name="communities" options={{ headerShown: false }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.background,
  },
});
