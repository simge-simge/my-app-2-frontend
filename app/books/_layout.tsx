import { Slot } from "expo-router"

import RequireAuth from "@/components/RequireAuth"

export default function BooksLayout() {
  return <RequireAuth><Slot /></RequireAuth>
}
