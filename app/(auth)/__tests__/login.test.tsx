import { Alert } from "react-native"
import type { ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Login from "../login"
import { signIn } from "@/services/authentication"

jest.mock("@/services/authentication", () => ({ signIn: jest.fn() }))
jest.mock("@/components/BookDoodles", () => ({ BookDoodles: () => null }))
jest.mock("@/components/GentleEntrance", () => ({ children }: { children: ReactNode }) => children)

const mockedSignIn = jest.mocked(signIn)

describe("login", () => {
  beforeEach(() => jest.spyOn(Alert, "alert").mockImplementation(() => {}))

  it("validates required credentials", () => {
    render(<Login />)
    fireEvent.press(screen.getByRole("button", { name: "Log in" }))
    expect(Alert.alert).toHaveBeenCalledWith("Login failed", "Please enter your email and password.")
    expect(mockedSignIn).not.toHaveBeenCalled()
  })

  it("links unregistered users to account creation", () => {
    render(<Login />)
    fireEvent.press(screen.getByRole("link", { name: "You are not registered? Create an account" }))
    expect(router.push).toHaveBeenCalledWith("/signup")
  })

  it("signs in with trimmed email and opens the protected app", async () => {
    mockedSignIn.mockResolvedValue({ data: { user: null, session: null }, error: null } as never)
    render(<Login />)
    fireEvent.changeText(screen.getByLabelText("Email"), "  reader@example.com ")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Log in" }))
    await waitFor(() => expect(mockedSignIn).toHaveBeenCalledWith("reader@example.com", "secret123"))
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home")
  })

  it("shows a visible warning when the account may not exist", async () => {
    mockedSignIn.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Invalid login credentials" } } as never)
    render(<Login />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "wrong")
    fireEvent.press(screen.getByRole("button", { name: "Log in" }))
    expect(await screen.findByText(/This account doesn't exist, or the password is incorrect/)).toBeOnTheScreen()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("disables the submit action while authentication is pending", async () => {
    mockedSignIn.mockReturnValue(new Promise(() => {}) as never)
    render(<Login />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Log in" }))
    expect(await screen.findByRole("button", { name: "Loading..." })).toBeDisabled()
  })
})
