import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from "react-native"

export const lightPalette = {
  background: "#FAF6F0", paper: "#FFFCF8", surface: "#FFFCF8", surfaceMuted: "#F3ECE3", surfaceStrong: "#342B25",
  border: "#E8DED2", borderStrong: "#D8C9BA", text: "#302923", textMuted: "#766A60", textSoft: "#8A614A",
  accent: "#A5573A", accentDark: "#7F402C", accentSoft: "#F5E5DC", orange: "#C97845", orangeSoft: "#F8E8DA",
  yellow: "#F3E4BE", green: "#CBD3B8", blue: "#CDD7D2", blueSoft: "#EFF2ED", rose: "#DEBAAA", roseSoft: "#F7E8E1",
  success: "#617647", successSoft: "#EBF0E2", danger: "#B34A42", dangerSoft: "#FAE8E5", white: "#FFFFFF", ink: "#302923",
} as const

export const darkPalette: Record<keyof typeof lightPalette, string> = {
  background: "#191512", paper: "#231E1A", surface: "#231E1A", surfaceMuted: "#2D2621", surfaceStrong: "#F8F0E8",
  border: "#40362F", borderStrong: "#55473D", text: "#F7F0E9", textMuted: "#B9AAA0", textSoft: "#D3A68D",
  accent: "#D3835E", accentDark: "#F0AB86", accentSoft: "#452E24", orange: "#E39A67", orangeSoft: "#493124",
  yellow: "#5A4B2D", green: "#596247", blue: "#495B57", blueSoft: "#283330", rose: "#79544A", roseSoft: "#3B2924",
  success: "#A4BA75", successSoft: "#303923", danger: "#F08B82", dangerSoft: "#492A27", white: "#FFFFFF", ink: "#F7F0E9",
}

export type Palette = Record<keyof typeof lightPalette, ColorValue>

function adaptiveColor(key: keyof typeof lightPalette): ColorValue {
  const light = lightPalette[key]
  const dark = darkPalette[key]
  if (Platform.OS === "ios") return DynamicColorIOS({ light, dark })
  if (Platform.OS === "android") {
    const resourceKey = key.replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`)
    return PlatformColor(`@color/cs_${resourceKey}`)
  }
  if (Platform.OS === "web") return `var(--cs-${key}, ${light})`
  return light
}

export const palette = Object.fromEntries(
  (Object.keys(lightPalette) as (keyof typeof lightPalette)[]).map((key) => [key, adaptiveColor(key)]),
) as Palette

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const
export const radii = { sm: 8, md: 12, lg: 16, xl: 22, round: 999 } as const
export const typography = {
  serif: Platform.select({ web: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", default: "sans-serif" }),
  sans: Platform.select({ web: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", default: "sans-serif" }),
} as const
export const shadows = {
  soft: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0, shadowRadius: 3, elevation: 0 },
  lifted: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
} as const
export const layout = { contentMax: 1040, readingMax: 720, formMax: 460, touchTarget: 44 } as const
