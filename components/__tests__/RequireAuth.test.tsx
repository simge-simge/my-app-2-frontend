import { Text } from "react-native"
import { render, screen } from "@testing-library/react-native"
import RequireAuth from "../RequireAuth"

const mockUseAuthSession = jest.fn()

jest.mock("@/services/authSession", () => ({
  useAuthSession: () => mockUseAuthSession(),
}))

describe("RequireAuth", () => {
  it("redirects logged-out visitors to login", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })

    render(<RequireAuth><Text>Private library</Text></RequireAuth>)

    expect(screen.getByText("Redirect:/login")).toBeTruthy()
    expect(screen.queryByText("Private library")).toBeNull()
  })

  it("renders private routes for authenticated visitors", () => {
    mockUseAuthSession.mockReturnValue({ session: { user: { id: "reader" } }, loading: false })

    render(<RequireAuth><Text>Private library</Text></RequireAuth>)

    expect(screen.getByText("Private library")).toBeTruthy()
    expect(screen.queryByText("Redirect:/login")).toBeNull()
  })
})
