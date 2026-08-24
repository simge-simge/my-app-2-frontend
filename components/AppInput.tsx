import { useState } from "react"
import { Text, TextInput, StyleSheet, View } from "react-native"
import { palette, radii } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  placeholder: string
  value: string
  onChangeText: (text: string) => void
  secure?: boolean
}

export default function AppInput({ placeholder, value, onChangeText, secure }: Props) {
  const { t } = useTranslation()
  const [focused, setFocused] = useState(false)
  const inputMode = placeholder === t("email") ? "email" : "text"

  return (
    <View style={styles.field}>
      <Text style={[styles.label, focused && styles.labelFocused]}>{placeholder}</Text>
      <TextInput
        accessibilityLabel={placeholder}
        style={[styles.input, focused && styles.inputFocused]}
        placeholder={t("enterValue", { value: placeholder.toLocaleLowerCase() })}
        placeholderTextColor={palette.textMuted}
        value={value}
        secureTextEntry={secure}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode={inputMode}
        autoComplete={secure ? "current-password" : inputMode === "email" ? "email" : "off"}
        autoCapitalize="none"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  field: { marginBottom: 15 },
  label: { color: palette.textMuted, fontSize: 13, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  labelFocused: { color: palette.accentDark },
  input: {
    minHeight: 54,
    borderWidth: 1.5,
    borderColor: palette.border,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderCurve: "continuous",
    backgroundColor: palette.paper,
    color: palette.text,
    fontSize: 16,
  },
  inputFocused: { borderColor: palette.accent, backgroundColor: "#FFFFFA" },
})
