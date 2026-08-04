import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, View } from "react-native"
import { palette } from "@/constants/theme"

export function BookDoodles({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.scene, compact && styles.compact]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.sun}><Ionicons name="sparkles" size={compact ? 14 : 18} color={palette.ink} /></View>
      <View style={styles.bookBack} />
      <View style={styles.bookMid} />
      <View style={styles.bookFront}>
        <View style={styles.pageOne} />
        <View style={styles.pageTwo} />
        <View style={styles.bookmark} />
      </View>
      <View style={styles.motionOne} />
      <View style={styles.motionTwo} />
    </View>
  )
}

const styles = StyleSheet.create({
  scene: { width: 150, height: 96, alignSelf: "center", position: "relative", transform: [{ rotate: "-2deg" }] },
  compact: { transform: [{ scale: 0.8 }, { rotate: "-2deg" }], marginVertical: -8 },
  sun: { position: "absolute", right: 4, top: 0, width: 34, height: 34, borderRadius: 17, backgroundColor: palette.yellow, borderWidth: 1.5, borderColor: palette.borderStrong, alignItems: "center", justifyContent: "center" },
  bookBack: { position: "absolute", left: 18, bottom: 5, width: 116, height: 27, borderRadius: 7, backgroundColor: palette.rose, borderWidth: 1.5, borderColor: palette.borderStrong, transform: [{ rotate: "3deg" }] },
  bookMid: { position: "absolute", left: 10, bottom: 27, width: 122, height: 27, borderRadius: 7, backgroundColor: palette.blue, borderWidth: 1.5, borderColor: palette.borderStrong, transform: [{ rotate: "-2deg" }] },
  bookFront: { position: "absolute", left: 23, bottom: 48, width: 103, height: 34, borderRadius: 8, backgroundColor: palette.orange, borderWidth: 1.5, borderColor: palette.borderStrong, overflow: "hidden" },
  pageOne: { position: "absolute", right: 6, top: 5, width: 56, height: 3, borderRadius: 2, backgroundColor: palette.paper },
  pageTwo: { position: "absolute", right: 10, top: 12, width: 48, height: 3, borderRadius: 2, backgroundColor: palette.paper },
  bookmark: { position: "absolute", left: 18, bottom: -2, width: 10, height: 20, backgroundColor: palette.yellow, transform: [{ rotate: "5deg" }] },
  motionOne: { position: "absolute", left: 0, top: 10, width: 22, height: 2, borderRadius: 2, backgroundColor: palette.borderStrong, transform: [{ rotate: "-12deg" }] },
  motionTwo: { position: "absolute", left: 4, top: 19, width: 14, height: 2, borderRadius: 2, backgroundColor: palette.borderStrong, transform: [{ rotate: "4deg" }] },
})
