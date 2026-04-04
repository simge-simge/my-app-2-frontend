import { TextInput, StyleSheet } from "react-native"
import { palette } from "@/constants/theme"

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
    borderColor: palette.border,
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    backgroundColor: palette.surface,
    color: palette.text,
  },
})
