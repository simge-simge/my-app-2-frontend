import type { ReactNode } from "react"
import { StyleSheet, Text, useWindowDimensions, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import { palette, typography } from "@/constants/theme"

export default function PageHeader({ title, subtitle, trailing }: { title: string; subtitle: string; trailing?: ReactNode }) {
  const { width } = useWindowDimensions()
  const isNarrow = width < 480

  return (
    <View style={[styles.container, isNarrow && styles.narrowContainer]}>
      <View style={styles.backButton}><PageBackButton /></View>
      <View style={[styles.content, isNarrow && styles.narrowContent]}>
        <View style={[styles.copy, isNarrow && styles.narrowCopy]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 12 },
  narrowContainer: { flexDirection: "column", alignItems: "stretch", gap: 14 },
  backButton: { alignSelf: "flex-start" },
  content: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  narrowContent: { flex: 0, flexDirection: "column", alignItems: "flex-start", gap: 12 },
  copy: { flex: 1, minWidth: 0 },
  narrowCopy: { flex: 0, width: "100%" },
  trailing: { flexShrink: 0 },
  title: { fontFamily: typography.serif, fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.5, color: palette.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: palette.textMuted, marginTop: 4 },
})
