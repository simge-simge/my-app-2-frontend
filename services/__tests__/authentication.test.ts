const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockResend = jest.fn()
const mockSetSession = jest.fn()
const mockExchangeCode = jest.fn()
const mockClearCache = jest.fn()
const mockApiFetch = jest.fn()

jest.mock("@/utils/supabase", () => ({
  supabase: { auth: {
    signUp: (...args: unknown[]) => mockSignUp(...args),
    signInWithPassword: (...args: unknown[]) => mockSignIn(...args),
    signOut: (...args: unknown[]) => mockSignOut(...args),
    resend: (...args: unknown[]) => mockResend(...args),
    setSession: (...args: unknown[]) => mockSetSession(...args),
    exchangeCodeForSession: (...args: unknown[]) => mockExchangeCode(...args),
  } },
}))
jest.mock("../api", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
  clearApiCache: () => mockClearCache(),
}))

import { createSessionFromUrl, resendSignupVerification, signIn, signOut, signUp } from "../authentication"
const { ENV } = jest.requireActual("@/config/env") as typeof import("@/config/env")

describe("authentication boundary", () => {
  beforeEach(() => {
    ENV.DISABLE_EMAIL_VERIFICATION = false
  })

  it("requests email verification and preserves onboarding metadata", async () => {
    const response = { data: { user: { id: "user-1" }, session: null }, error: null }
    mockSignUp.mockResolvedValue(response)
    const metadata = { display_name: "New Reader", contacts: {}, onboarding_profile: true as const }

    await expect(signUp("new@example.com", "password", metadata)).resolves.toBe(response)
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@example.com",
      password: "password",
      options: { emailRedirectTo: "commonshelf://auth/callback", data: metadata },
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("resends signup verification to the same callback", async () => {
    mockResend.mockResolvedValue({ data: {}, error: null })
    await resendSignupVerification("new@example.com")
    expect(mockResend).toHaveBeenCalledWith({
      type: "signup",
      email: "new@example.com",
      options: { emailRedirectTo: "commonshelf://auth/callback" },
    })
  })

  it("creates and signs in a confirmed account through the local-only endpoint", async () => {
    ENV.DISABLE_EMAIL_VERIFICATION = true
    mockApiFetch.mockResolvedValue({ created: true })
    const response = { data: { session: { access_token: "access" } }, error: null }
    mockSignIn.mockResolvedValue(response)
    const metadata = { display_name: "Dev Reader", contacts: {}, onboarding_profile: true as const }

    await expect(signUp("dev@example.com", "secret123", metadata)).resolves.toBe(response)
    expect(mockApiFetch).toHaveBeenCalledWith("/auth/dev-signup", {
      method: "POST",
      body: JSON.stringify({ email: "dev@example.com", password: "secret123", metadata }),
    })
    expect(mockSignIn).toHaveBeenCalledWith({ email: "dev@example.com", password: "secret123" })
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it("creates a session from implicit-flow callback tokens", async () => {
    const session = { access_token: "access" }
    mockSetSession.mockResolvedValue({ data: { session }, error: null })
    await expect(createSessionFromUrl("commonshelf://auth/callback#access_token=access&refresh_token=refresh")).resolves.toBe(session)
    expect(mockSetSession).toHaveBeenCalledWith({ access_token: "access", refresh_token: "refresh" })
  })

  it("exchanges a PKCE callback code when present", async () => {
    const session = { access_token: "access" }
    mockExchangeCode.mockResolvedValue({ data: { session }, error: null })
    await expect(createSessionFromUrl("commonshelf://auth/callback?code=auth-code")).resolves.toBe(session)
    expect(mockExchangeCode).toHaveBeenCalledWith("auth-code")
  })

  it("passes credentials to Supabase and clears user-scoped API state", async () => {
    mockSignIn.mockResolvedValue({ error: null })
    await signIn("reader@example.com", "secret")
    expect(mockClearCache).toHaveBeenCalledTimes(1)
    expect(mockSignIn).toHaveBeenCalledWith({ email: "reader@example.com", password: "secret" })
  })

  it("logs out through Supabase and clears cached private data", async () => {
    mockSignOut.mockResolvedValue({ error: null })
    await signOut()
    expect(mockClearCache).toHaveBeenCalledTimes(1)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })
})
