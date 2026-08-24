import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"

import { palette, radii } from "@/constants/theme"
import { searchLocations, type Location } from "@/services/locations"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  label?: string
  placeholder?: string
  selected: Location | null
  onSelect: (location: Location | null) => void
  onValidityChange?: (valid: boolean) => void
  disabled?: boolean
}

export default function LocationPicker({
  label,
  placeholder,
  selected,
  onSelect,
  onValidityChange,
  disabled = false,
}: Props) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t("typeLocation")
  const [query, setQuery] = useState(selected?.display_name ?? "")
  const [results, setResults] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const preserveTypedQuery = useRef(false)
  const selectedId = selected?.id
  const selectedDisplayName = selected?.display_name

  useEffect(() => {
    if (selectedId && selectedDisplayName) {
      preserveTypedQuery.current = false
      setQuery(selectedDisplayName)
    } else if (preserveTypedQuery.current) {
      preserveTypedQuery.current = false
    } else {
      setQuery("")
    }
  }, [selectedId, selectedDisplayName])

  const valid = query.trim() === "" || query === selectedDisplayName

  useEffect(() => {
    onValidityChange?.(valid)
  }, [onValidityChange, valid])

  useEffect(() => {
    const term = query.trim()
    if (disabled || term.length < 2 || query === selectedDisplayName) {
      setResults([])
      setLoading(false)
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      try {
        setLoading(true)
        const matches = await searchLocations(term)
        if (active) setResults(matches)
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [disabled, query, selectedDisplayName])

  const handleChange = (text: string) => {
    setQuery(text)
    setResults([])
    if (selected && text !== selected.display_name) {
      preserveTypedQuery.current = true
      onSelect(null)
    }
  }

  const handleSelect = (location: Location) => {
    onSelect(location)
    setQuery(location.display_name)
    setResults([])
  }

  const handleClear = () => {
    preserveTypedQuery.current = true
    onSelect(null)
    setQuery("")
    setResults([])
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, !valid && styles.inputInvalid, disabled && styles.disabled]}>
        <Ionicons name="location-outline" size={19} color={palette.textMuted} />
        <TextInput
          accessibilityLabel={label || t("location")}
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder={resolvedPlaceholder}
          placeholderTextColor={palette.textMuted}
          editable={!disabled}
          autoCapitalize="words"
        />
        {loading ? <ActivityIndicator size="small" color={palette.accent} /> : null}
        {!loading && query && !disabled ? (
          <Pressable onPress={handleClear} accessibilityLabel={t("clearLocation")}>
            <Ionicons name="close-circle" size={20} color={palette.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!valid ? <Text style={styles.hint}>{t("selectSuggestion")}</Text> : null}

      {results.length ? (
        <View style={styles.results}>
          {results.map((location) => (
            <Pressable
              key={location.id}
              style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
              onPress={() => handleSelect(location)}
              accessibilityRole="button"
              accessibilityLabel={t("selectNamed", { name: location.display_name })}
            >
              <View style={styles.resultText}>
                <Text style={styles.resultName}>{location.name}</Text>
                <Text style={styles.resultDisplay}>{location.display_name}</Text>
              </View>
              <Text style={styles.resultType}>{location.type}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  label: { color: palette.textMuted, fontSize: 13, fontWeight: "700", marginBottom: 7, marginLeft: 2 },
  inputRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 9, borderWidth: 1.5, borderColor: palette.border, borderRadius: radii.md, paddingHorizontal: 14, backgroundColor: palette.paper },
  inputInvalid: { borderColor: palette.danger },
  disabled: { backgroundColor: palette.surfaceMuted, opacity: 0.75 },
  input: { flex: 1, color: palette.text, fontSize: 15, paddingVertical: 12 },
  hint: { color: palette.danger, fontSize: 12, marginTop: 5 },
  results: { marginTop: 6, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.md, overflow: "hidden", backgroundColor: palette.surface },
  result: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 13, paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: palette.border },
  resultPressed: { backgroundColor: palette.accentSoft },
  resultText: { flex: 1 },
  resultName: { color: palette.text, fontSize: 15, fontWeight: "700" },
  resultDisplay: { color: palette.textMuted, fontSize: 12, marginTop: 2 },
  resultType: { color: palette.accentDark, fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
})
