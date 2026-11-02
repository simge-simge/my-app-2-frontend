import { router } from "expo-router"
import { Image, Pressable, StyleSheet, Text } from "react-native"

import { palette } from "@/constants/theme"

const appIcon = require("../assets/images/icon.png")

export default function AppHomeLink() {
  return (
    <Pressable
      accessibilityLabel="CommonShelf home"
      accessibilityRole="link"
      onPress={() => router.push("/home")}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Image source={appIcon} style={styles.icon} resizeMode="contain" />
      <Text style={styles.title}>CommonShelf</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  link: {
    minHeight: 36,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 8,
  },
  icon: { width: 22, height: 22, borderRadius: 4 },
  title: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  pressed: { opacity: 0.65 },
})
