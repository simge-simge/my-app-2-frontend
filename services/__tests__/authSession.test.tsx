import type { ReactNode } from "react"
import { act, renderHook, waitFor } from "@testing-library/react-native"

const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock("@/utils/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
    },
  },
}))

import { AuthSessionProvider, useAuthSession } from "../authSession"

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthSessionProvider>{children}</AuthSessionProvider>
)

describe("AuthSessionProvider", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } })
  })

  it("restores the current session before unlocking routes", async () => {
    const session = { access_token: "token", user: { id: "reader" } }
    mockGetSession.mockResolvedValue({ data: { session }, error: null })

    const { result } = renderHook(() => useAuthSession(), { wrapper })

    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current).toEqual({ session, loading: false }))
  })

  it("reacts to sign-in and sign-out events", async () => {
    let authListener: (_event: string, session: unknown) => void = () => undefined
    mockOnAuthStateChange.mockImplementation((listener) => {
      authListener = listener
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })

    const { result } = renderHook(() => useAuthSession(), { wrapper })
    await waitFor(() => expect(result.current.loading).toBe(false))

    const session = { access_token: "token", user: { id: "reader" } }
    act(() => authListener("SIGNED_IN", session))
    await waitFor(() => expect(result.current.session).toBe(session))

    act(() => authListener("SIGNED_OUT", null))
    await waitFor(() => expect(result.current.session).toBeNull())
  })

  it("unsubscribes when the provider unmounts", () => {
    const { unmount } = renderHook(() => useAuthSession(), { wrapper })
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalledTimes(1)
  })
})
