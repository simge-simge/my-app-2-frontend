import { Slot } from "expo-router"

import RequireAuth from "@/components/RequireAuth"

export default function MembersLayout() {
  return <RequireAuth><Slot /></RequireAuth>
}
