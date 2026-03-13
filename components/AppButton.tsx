import { Pressable, Text, StyleSheet } from "react-native"

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
    backgroundColor: "#4A6CF7",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  text: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
})