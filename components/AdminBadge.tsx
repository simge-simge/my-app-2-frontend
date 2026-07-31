import { StyleSheet, Text, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { palette } from "@/constants/theme"

export default function AdminBadge() {
  return (
    <View style={styles.badge} accessibilityLabel="Community admin">
      <Ionicons name="shield-checkmark" size={12} color={palette.accentDark} />
      <Text style={styles.text}>Admin</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: palette.accentSoft,
    transform: [{ translateY: 4 }],
  },
  text: {
    color: palette.accentDark,
    fontSize: 11,
    fontWeight: "700",
  },
})
