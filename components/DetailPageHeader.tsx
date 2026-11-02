import type { Href } from "expo-router"
import { StyleSheet, Text, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import { layout, palette, typography } from "@/constants/theme"

export default function DetailPageHeader({ title, fallback = "/home" }: { title: string; fallback?: Href }) {
  return (
    <View style={styles.header}>
      <View style={styles.content}>
        <PageBackButton fallback={fallback} />
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: { backgroundColor: palette.background },
  content: { width: "100%", maxWidth: layout.contentMax, alignSelf: "center", minHeight: 44, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  title: { flex: 1, color: palette.text, fontFamily: typography.serif, fontSize: 20, fontWeight: "700" },
})
