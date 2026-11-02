function requirePublicEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required public environment variable: ${name}`)
  }

  return value
}

export const ENV = {
  DISABLE_EMAIL_VERIFICATION:
    process.env.EXPO_PUBLIC_DISABLE_EMAIL_VERIFICATION === "true",
  SUPABASE_URL: requirePublicEnv(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  SUPABASE_KEY: requirePublicEnv(
    "EXPO_PUBLIC_SUPABASE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_KEY,
  ),
  API_URL: requirePublicEnv(
    "EXPO_PUBLIC_API_URL",
    process.env.EXPO_PUBLIC_API_URL,
  ).replace(/\/+$/, ""),
}
