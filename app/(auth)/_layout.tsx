import { Slot } from "expo-router"

import GuestOnly from "@/components/GuestOnly"

export default function AuthLayout() {
  return <GuestOnly><Slot /></GuestOnly>
}
