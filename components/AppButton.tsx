import { Pressable, Text, StyleSheet } from "react-native"
import { palette } from "@/constants/theme"

type Props = {
  title: string
  onPress: () => void
  loading?: boolean
}

export default function AppButton({ title, onPress, loading }: Props) {
  return (
    <Pressable style={styles.button} onPress={onPress} disabled={loading}>
      <Text style={styles.text}>
        {loading ? "Loading..." : title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: palette.accent,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 10,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  text: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 16,
  },
})
