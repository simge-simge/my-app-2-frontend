const mockSignIn = jest.fn()
const mockSignUp = jest.fn()
const mockSignOut = jest.fn()
const mockClearCache = jest.fn()

jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { signUp: (...args: unknown[]) => mockSignUp(...args), signInWithPassword: (...args: unknown[]) => mockSignIn(...args), signOut: (...args: unknown[]) => mockSignOut(...args) } },
}))
jest.mock("../api", () => ({ clearApiCache: () => mockClearCache() }))

import { signIn, signOut, signUp } from "../authentication"

describe("authentication boundary", () => {
  it("keeps the session returned when account creation signs the user in", async () => {
    const response = { data: { session: { access_token: "token" } }, error: null }
    mockSignUp.mockResolvedValue(response)

    await expect(signUp("new@example.com", "secret")).resolves.toBe(response)
    expect(mockSignUp).toHaveBeenCalledWith({ email: "new@example.com", password: "secret" })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("signs in after account creation when Supabase does not return a session", async () => {
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null })
    const response = { data: { session: { access_token: "token" } }, error: null }
    mockSignIn.mockResolvedValue(response)

    await expect(signUp("new@example.com", "secret")).resolves.toBe(response)
    expect(mockSignIn).toHaveBeenCalledWith({ email: "new@example.com", password: "secret" })
  })

  it("detects Supabase's obfuscated response for an existing account", async () => {
    mockSignUp.mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null })

    await expect(signUp("existing@example.com", "secret")).resolves.toEqual(expect.objectContaining({
      error: { message: "This account already exists. Please log in.", code: "user_already_exists" },
    }))
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  it("converts a failed duplicate-account sign-in into an existing-account error", async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null })
    mockSignIn.mockResolvedValue({ data: { session: null }, error: { message: "Invalid login credentials", code: "invalid_credentials" } })

    await expect(signUp("existing@example.com", "wrong")).resolves.toEqual(expect.objectContaining({
      error: { message: "This account already exists. Please log in.", code: "user_already_exists" },
    }))
  })

  it("normalizes password-first signup errors to the existing-account warning", async () => {
    mockSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Password should be at least 6 characters", code: "weak_password" } })

    await expect(signUp("existing@example.com", "bad")).resolves.toEqual(expect.objectContaining({
      error: { message: "This account already exists. Please log in.", code: "user_already_exists" },
    }))
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
