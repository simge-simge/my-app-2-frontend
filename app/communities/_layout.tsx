import { Slot } from "expo-router"

import RequireAuth from "@/components/RequireAuth"

export default function CommunitiesLayout() {
  return <RequireAuth><Slot /></RequireAuth>
}
