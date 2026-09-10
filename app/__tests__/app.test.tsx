import { render, screen } from "@testing-library/react-native"

import AppEntry from "../app"

const mockUseAuthSession = jest.fn()

jest.mock("@/services/authSession", () => ({ useAuthSession: () => mockUseAuthSession() }))

describe("app entry", () => {
  it("sends a visitor to account creation", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })
    render(<AppEntry />)
    expect(screen.getByText("Redirect:/signup")).toBeTruthy()
  })

  it("sends an authenticated reader into the app", () => {
    mockUseAuthSession.mockReturnValue({ session: { user: { id: "reader" } }, loading: false })
    render(<AppEntry />)
    expect(screen.getByText("Redirect:/home")).toBeTruthy()
  })
})
