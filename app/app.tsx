import { Redirect } from "expo-router"

import { useAuthSession } from "@/services/authSession"

/** A stable entry point for the product, independent of its internal tab routes. */
export default function AppEntry() {
  const { session, loading } = useAuthSession()

  if (loading) return null

  return <Redirect href={session ? "/home" : "/signup"} />
}
