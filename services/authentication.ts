import { supabase } from "@/utils/supabase";
import { clearApiCache } from "./api";

const accountAlreadyExistsError = {
  message: "This account already exists. Please log in.",
  code: "user_already_exists",
}

export async function signUp(email: string, password: string) {
  clearApiCache()
  const result = await supabase.auth.signUp({
    email,
    password,
  })

  // Supabase may return an obfuscated user with no identities instead of an
  // explicit error when the email is already registered.
  if (!result.error && result.data.user && result.data.user.identities?.length === 0) {
    return { data: result.data, error: accountAlreadyExistsError }
  }
  if (result.error?.code === "weak_password") {
    return { data: result.data, error: accountAlreadyExistsError }
  }
  if (result.error || result.data.session) return result

  // A successful signup normally includes a session. If it does not, try to
  // establish one so account creation and login remain a single user action.
  const signInResult = await supabase.auth.signInWithPassword({ email, password })
  if (
    signInResult.error?.code === "invalid_credentials"
    || signInResult.error?.code === "email_not_confirmed"
    || signInResult.error?.message.toLowerCase().includes("invalid login credentials")
    || signInResult.error?.message.toLowerCase().includes("email not confirmed")
  ) {
    return { data: result.data, error: accountAlreadyExistsError }
  }
  return signInResult
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
