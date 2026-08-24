import { DynamicColorIOS, Platform, PlatformColor, type ColorValue } from "react-native"

export const lightPalette = {
  background: "#FFF9ED", paper: "#FFFCF5", surface: "#FFFCF5", surfaceMuted: "#F7EEDC", surfaceStrong: "#38332D",
  border: "#D8CCBA", borderStrong: "#62584D", text: "#38332D", textMuted: "#706458", textSoft: "#7A633E",
  accent: "#4F6F32", accentDark: "#365020", accentSoft: "#E7EDC8", orange: "#E78A33", orangeSoft: "#F8DFC0",
  yellow: "#F6D895", green: "#B9CE6B", blue: "#91CBD7", blueSoft: "#DDEFF2", rose: "#E9B8A5", roseSoft: "#F7E4DC",
  success: "#3F6B38", successSoft: "#E5EED9", danger: "#A54838", dangerSoft: "#F7DED6", white: "#FFFCF5", ink: "#38332D",
} as const

export const darkPalette: Record<keyof typeof lightPalette, string> = {
  background: "#171A16", paper: "#222720", surface: "#222720", surfaceMuted: "#2C3329", surfaceStrong: "#F3EBDD",
  border: "#465041", borderStrong: "#7E8B75", text: "#F3EBDD", textMuted: "#B9B2A6", textSoft: "#C6A86E",
  accent: "#8FAE69", accentDark: "#C4DC9A", accentSoft: "#34442A", orange: "#F0A45B", orangeSoft: "#4B3423",
  yellow: "#DDBB68", green: "#91B45E", blue: "#68AAB8", blueSoft: "#253B40", rose: "#D6927C", roseSoft: "#472F2B",
  success: "#78B66F", successSoft: "#29402A", danger: "#E18872", dangerSoft: "#4B2A25", white: "#F8F4EB", ink: "#F3EBDD",
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
export const radii = { sm: 10, md: 16, lg: 22, xl: 30, round: 999 } as const
export const typography = {
  serif: Platform.select({ web: "Georgia, 'Times New Roman', serif", default: "serif" }),
  sans: Platform.select({ web: "system-ui, -apple-system, sans-serif", default: "sans-serif" }),
} as const
export const shadows = {
  soft: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.09, shadowRadius: 14, elevation: 3 },
  lifted: { shadowColor: palette.ink, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.13, shadowRadius: 22, elevation: 6 },
} as const
export const layout = { contentMax: 1040, readingMax: 720, formMax: 460, touchTarget: 44 } as const
