import type { ReactNode } from "react"
import { StyleSheet, Text, useWindowDimensions, View } from "react-native"

import PageBackButton from "@/components/PageBackButton"
import { palette, typography } from "@/constants/theme"

export default function PageHeader({ title, subtitle, trailing, showBack = true }: { title: string; subtitle: string; trailing?: ReactNode; showBack?: boolean }) {
  const { width } = useWindowDimensions()
  const isNarrow = width < 480

  return (
    <View style={[styles.container, isNarrow && styles.narrowContainer]}>
      <View style={[styles.content, isNarrow && styles.narrowContent]}>
        <View style={[styles.copy, isNarrow && styles.narrowCopy]}>
          <View style={styles.titleRow}>
            {showBack ? <PageBackButton /> : null}
            <Text style={styles.title}>{title}</Text>
          </View>
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  content: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  narrowContent: { flex: 0, flexDirection: "column", alignItems: "flex-start", gap: 12 },
  copy: { flex: 1, minWidth: 0 },
  narrowCopy: { flex: 0, width: "100%" },
  trailing: { flexShrink: 0 },
  title: { flexShrink: 1, fontFamily: typography.serif, fontSize: 30, fontWeight: "700", color: palette.text },
  subtitle: { fontSize: 14, color: palette.textMuted, marginTop: 5 },
})
