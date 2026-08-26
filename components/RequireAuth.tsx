import type { ReactNode } from "react"
import { Redirect } from "expo-router"

import { useAuthSession } from "@/services/authSession"

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuthSession()

  if (loading) return null
  if (!session) return <Redirect href="/login" />

  return children
}
