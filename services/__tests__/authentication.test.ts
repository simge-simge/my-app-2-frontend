const mockSignIn = jest.fn()
const mockSignOut = jest.fn()
const mockClearCache = jest.fn()

jest.mock("@/utils/supabase", () => ({
  supabase: { auth: { signInWithPassword: (...args: unknown[]) => mockSignIn(...args), signOut: (...args: unknown[]) => mockSignOut(...args) } },
}))
jest.mock("../api", () => ({ clearApiCache: () => mockClearCache() }))

import { signIn, signOut } from "../authentication"

describe("authentication boundary", () => {
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
