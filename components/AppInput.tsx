import { TextInput, StyleSheet } from "react-native"

type Props = {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secure?: boolean
}

export default function AppInput({
  placeholder,
  value,
  onChangeText,
  secure,
}: Props) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      secureTextEntry={secure}
      onChangeText={onChangeText}
      autoCapitalize="none"
    />
  )
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
})