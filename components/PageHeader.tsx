import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import { palette, typography } from "@/constants/theme"

export default function PageHeader({ title, subtitle, trailing }: { title: string; subtitle: string; trailing?: ReactNode }) {
  return (
    <View style={styles.container}>
      <PageBackButton />
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {trailing}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12 },
  content: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: typography.serif, fontSize: 30, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: 5 },
})
