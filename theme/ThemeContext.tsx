import AsyncStorage from "@react-native-async-storage/async-storage"
import * as SystemUI from "expo-system-ui"
import { Appearance, Platform } from "react-native"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { darkPalette, lightPalette } from "@/constants/theme"

export type ThemeMode = "light" | "dark"
const STORAGE_KEY = "commonshelf.theme"

type ThemeContextValue = {
  theme: ThemeMode
  isDark: boolean
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  isDark: false,
  setTheme: () => undefined,
  toggleTheme: () => undefined,
})

function applyTheme(theme: ThemeMode) {
  if (Platform.OS !== "web") Appearance.setColorScheme(theme)
  const colors = theme === "dark" ? darkPalette : lightPalette
  void SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined)

  if (Platform.OS === "web" && typeof document !== "undefined") {
    document.documentElement.style.colorScheme = theme
    for (const [key, value] of Object.entries(colors)) {
      document.documentElement.style.setProperty(`--cs-${key}`, value)
    }
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light")

  useEffect(() => {
    applyTheme("light")
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === "light" || stored === "dark") {
          setThemeState(stored)
          applyTheme(stored)
        }
      })
      .catch(() => undefined)
  }, [])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
    applyTheme(next)
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "light" ? "dark" : "light"
      applyTheme(next)
      void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
      return next
    })
  }, [])

  const value = useMemo(() => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }), [setTheme, theme, toggleTheme])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useAppTheme() {
  return useContext(ThemeContext)
}
