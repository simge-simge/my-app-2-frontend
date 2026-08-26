import { Text } from "react-native"
import { render, screen } from "@testing-library/react-native"
import GuestOnly from "../GuestOnly"

const mockUseAuthSession = jest.fn()

jest.mock("@/services/authSession", () => ({
  useAuthSession: () => mockUseAuthSession(),
}))

describe("GuestOnly", () => {
  it("redirects an authenticated visitor to home", () => {
    mockUseAuthSession.mockReturnValue({ session: { user: { id: "reader" } }, loading: false })

    render(<GuestOnly><Text>Login form</Text></GuestOnly>)

    expect(screen.getByText("Redirect:/home")).toBeTruthy()
    expect(screen.queryByText("Login form")).toBeNull()
  })

  it("renders guest routes when there is no session", () => {
    mockUseAuthSession.mockReturnValue({ session: null, loading: false })

    render(<GuestOnly><Text>Login form</Text></GuestOnly>)

    expect(screen.getByText("Login form")).toBeTruthy()
    expect(screen.queryByText("Redirect:/home")).toBeNull()
  })
})
