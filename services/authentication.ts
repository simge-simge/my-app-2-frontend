import { Platform } from "react-native"
import * as Linking from "expo-linking"
import * as WebBrowser from "expo-web-browser"

import { supabase } from "@/utils/supabase"
import { clearApiCache } from "./api"

WebBrowser.maybeCompleteAuthSession()

export type SignupMetadata = {
  display_name: string
  location_id?: string
  contacts: Record<string, string>
  onboarding_profile: true
}

export function getAuthRedirectUrl() {
  return Linking.createURL("/auth/callback")
}

export async function signUp(email: string, password: string, metadata?: SignupMetadata) {
  clearApiCache()
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(),
      data: metadata,
    },
  })
}

export async function resendSignupVerification(email: string) {
  return supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: getAuthRedirectUrl() },
  })
}

export async function createSessionFromUrl(url: string) {
  const parsed = new URL(url)
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""))
  const errorDescription = parsed.searchParams.get("error_description") ?? hash.get("error_description")
  if (errorDescription) throw new Error(decodeURIComponent(errorDescription.replace(/\+/g, " ")))

  const code = parsed.searchParams.get("code")
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data.session
  }

  const accessToken = hash.get("access_token") ?? parsed.searchParams.get("access_token")
  const refreshToken = hash.get("refresh_token") ?? parsed.searchParams.get("refresh_token")
  if (!accessToken || !refreshToken) return null

  const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
  if (error) throw error
  return data.session
}

export async function signInWithGoogle() {
  clearApiCache()
  const redirectTo = getAuthRedirectUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: Platform.OS !== "web" },
  })
  if (error) return { data: { session: null }, error }

  if (Platform.OS === "web" || !data.url) return { data: { session: null }, error: null }
  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
  if (browserResult.type !== "success") {
    return { data: { session: null }, error: null, cancelled: true as const }
  }

  const session = await createSessionFromUrl(browserResult.url)
  return { data: { session }, error: null }
}

export async function signIn(email: string, password: string) {
  clearApiCache()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  clearApiCache()
  return supabase.auth.signOut()
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}
