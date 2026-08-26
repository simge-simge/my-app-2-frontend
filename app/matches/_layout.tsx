import { Slot } from "expo-router"

import RequireAuth from "@/components/RequireAuth"

export default function MatchesLayout() {
  return <RequireAuth><Slot /></RequireAuth>
}
