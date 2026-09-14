import { fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"

import Index from "../index"

const mockUseAuthSession = jest.fn()

jest.mock("@/services/authSession", () => ({ useAuthSession: () => mockUseAuthSession() }))
jest.mock("expo-router/head", () => ({ __esModule: true, default: () => null }))
jest.mock("@/components/LandingBookRail", () => ({ __esModule: true, default: () => null }))

describe("public home page", () => {
  it("shows the app purpose, product preview, contact details, and legal links without a session", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })

    render(<Index />)

    expect(screen.getByText("Good books find their way to good company.")).toBeTruthy()
    expect(screen.getByText("From a dusty book on someone's shelf to your next read.")).toBeTruthy()
    expect(screen.getByText("Great books should not disappear onto a finished-reading pile.")).toBeTruthy()
    expect(screen.getByText(/CommonShelf gives your books a second life/)).toBeTruthy()
    expect(screen.getByText("Found a bug or have an idea?")).toBeTruthy()
    expect(screen.getByText("commonshelf0@gmail.com")).toBeTruthy()
    expect(screen.getByText("From your shelf to their next read.")).toBeTruthy()
    expect(screen.getByText("Privacy Policy")).toBeTruthy()
    expect(screen.getByText("Terms of Service")).toBeTruthy()
  })

  it("sends visitors to account creation from the primary action", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })
    render(<Index />)

    fireEvent.press(screen.getAllByRole("button", { name: "Open your CommonShelf" })[0])

    expect(router.push).toHaveBeenCalledWith("/app")
  })

  it("keeps the landing page available to authenticated readers", () => {
    mockUseAuthSession.mockReturnValue({ session: { user: { id: "reader" } }, loading: false })

    render(<Index />)

    expect(screen.getByText("Good books find their way to good company.")).toBeTruthy()
  })

  it("shows a swipeable how-it-works carousel with position controls on mobile", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })
    render(<Index />)

    const positionDots = screen.getAllByRole("tab")
    expect(positionDots).toHaveLength(3)
    expect(positionDots[0].props.accessibilityState).toEqual({ selected: true })

    fireEvent.press(positionDots[2])

    expect(positionDots[2].props.accessibilityState).toEqual({ selected: true })
  })
})
