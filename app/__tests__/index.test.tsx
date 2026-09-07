import { fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"

import Index from "../index"

const mockUseAuthSession = jest.fn()

jest.mock("@/services/authSession", () => ({ useAuthSession: () => mockUseAuthSession() }))
jest.mock("expo-router/head", () => ({ __esModule: true, default: () => null }))
jest.mock("@/components/LandingBookRail", () => ({ __esModule: true, default: () => null }))

describe("public home page", () => {
  it("shows the app purpose, product preview, data use, and legal links without a session", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })

    render(<Index />)

    expect(screen.getByText("Good books find their way to good company.")).toBeTruthy()
    expect(screen.getByText("See what is waiting on the community shelf.")).toBeTruthy()
    expect(screen.getByText("From your shelf to their next read.")).toBeTruthy()
    expect(screen.getByText("Google sign-in is optional and limited to authentication.")).toBeTruthy()
    expect(screen.getByText("Privacy Policy")).toBeTruthy()
    expect(screen.getByText("Terms of Service")).toBeTruthy()
  })

  it("sends visitors to account creation from the primary action", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })
    render(<Index />)

    fireEvent.press(screen.getAllByRole("button", { name: "Create an account" })[0])

    expect(router.push).toHaveBeenCalledWith("/signup")
  })

  it("keeps the public entry out of the way for authenticated readers", () => {
    mockUseAuthSession.mockReturnValue({ session: { user: { id: "reader" } }, loading: false })

    render(<Index />)

    expect(screen.getByText("Redirect:/home")).toBeTruthy()
  })
})
