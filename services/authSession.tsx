import type { Session } from "@supabase/supabase-js"
import { createContext, type ReactNode, useContext, useEffect, useState } from "react"

import { supabase } from "@/utils/supabase"

type AuthSessionState = {
  session: Session | null
  loading: boolean
}

const AuthSessionContext = createContext<AuthSessionState | null>(null)

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSessionState>({ session: null, loading: true })

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true
      if (active) setState({ session, loading: false })
    })

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active || receivedAuthEvent) return
      if (error) console.error("Failed to restore auth session", error)
      setState({ session: error ? null : data.session, loading: false })
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return <AuthSessionContext.Provider value={state}>{children}</AuthSessionContext.Provider>
}

export function useAuthSession() {
  const state = useContext(AuthSessionContext)
  if (!state) throw new Error("useAuthSession must be used within AuthSessionProvider")
  return state
}
