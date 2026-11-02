import { StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import AppHomeLink from "@/components/AppHomeLink"
import AppHeaderActions from "@/components/AppHeaderActions"
import PageBackButton from "@/components/PageBackButton"
import { layout, palette, typography } from "@/constants/theme"

export default function AppTabHeader({ title, showActions = false, refreshKey }: { title?: string; showActions?: boolean; refreshKey?: string } = {}) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={[styles.content, styles.brandRow]}>
        <AppHomeLink />
        {showActions ? <AppHeaderActions refreshKey={refreshKey} /> : null}
      </View>
      {title ? (
        <View style={[styles.content, styles.pageTitleRow]}>
          <PageBackButton fallback="/" />
          <Text style={styles.pageTitle}>{title}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    width: "100%",
    backgroundColor: palette.background,
    borderBottomWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
    overflow: "hidden",
  },
  content: {
    width: "100%",
    maxWidth: layout.contentMax,
    height: 52,
    alignSelf: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  pageTitleRow: { height: "auto", minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12 },
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { flexShrink: 1, color: palette.text, fontFamily: typography.serif, fontSize: 24, fontWeight: "700" },
})
