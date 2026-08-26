import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppState, Platform } from "react-native"
import { createClient } from "@supabase/supabase-js"

import { ENV } from "../config/env"

const webStorage = {
  getItem: (key: string) =>
    typeof window === "undefined" ? null : window.localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key)
    }
  },
}

export const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_KEY,
  {
    auth: {
      storage: Platform.OS === "web" ? webStorage : AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  }
)

// Browsers already pause Supabase's refresh loop when a tab is hidden. Native
// apps need to tie it to the foreground lifecycle so sessions stay current
// without spending battery or network resources while the app is backgrounded.
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}
