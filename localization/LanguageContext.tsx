import AsyncStorage from "@react-native-async-storage/async-storage"
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { en, tr, type TranslationKey } from "@/localization/translations"

export type Language = "en" | "tr"
const STORAGE_KEY = "commonshelf.language"

type TranslationValues = Record<string, string | number>
type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  t: (key: TranslationKey, values?: TranslationValues) => string
}

const dictionaries = { en, tr }

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => undefined,
  toggleLanguage: () => undefined,
  t: (key, values) => interpolate(en[key], values),
})

function interpolate(template: string, values?: TranslationValues) {
  if (!values) return template
  return template.replace(/{{(\w+)}}/g, (_, key: string) => String(values[key] ?? `{{${key}}}`))
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => { if (stored === "en" || stored === "tr") setLanguageState(stored) })
      .catch(() => undefined)
  }, [])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((current) => {
      const next = current === "en" ? "tr" : "en"
      void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined)
      return next
    })
  }, [])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage,
    t: (key, values) => interpolate(dictionaries[language][key], values),
  }), [language, setLanguage, toggleLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useTranslation() {
  return useContext(LanguageContext)
}
