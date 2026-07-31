import { supabase } from "@/utils/supabase";
import { clearApiCache } from "./api";

export async function signUp(email: string, password: string) {
  clearApiCache()
  return supabase.auth.signUp({
    email,
    password,
  })
}

export async function signIn(email: string, password: string) {
  clearApiCache()
  return supabase.auth.signInWithPassword({
    email,
    password,
  })
}

export async function signOut() {
  clearApiCache()
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
