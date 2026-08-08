import { Alert } from "react-native"
import type { ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Signup, { generateUsername } from "../signup"
import { signUp } from "@/services/authentication"
import { updateProfile } from "@/services/profile"

jest.mock("@/services/authentication", () => ({ signUp: jest.fn() }))
jest.mock("@/services/profile", () => ({ updateProfile: jest.fn() }))
jest.mock("@/components/BookDoodles", () => ({ BookDoodles: () => null }))
jest.mock("@/components/GentleEntrance", () => ({ children }: { children: ReactNode }) => children)

const mockedSignUp = jest.mocked(signUp)
const mockedUpdateProfile = jest.mocked(updateProfile)

describe("signup", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {})
    mockedUpdateProfile.mockResolvedValue({} as never)
  })

  it("generates a username from the email prefix", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    expect(generateUsername("New.Reader+books@example.com")).toMatch(/^new_reader_books_[a-z0-9]{4}$/)
  })

  it("requires only email and password", () => {
    render(<Signup />)
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    expect(Alert.alert).toHaveBeenCalledWith("Create account failed", "Please enter your email and password.")
    expect(mockedSignUp).not.toHaveBeenCalled()
  })

  it("creates the account and opens the authenticated app", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "  new-reader@example.com ")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    await waitFor(() => expect(mockedSignUp).toHaveBeenCalledWith("new-reader@example.com", "secret123"))
    expect(mockedUpdateProfile).toHaveBeenCalledWith({
      display_name: expect.stringMatching(/^new_reader_[a-z0-9]{4}$/),
      contacts: {},
    })
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home")
  })

  it("saves optional profile fields when supplied", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: null } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "ada@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.changeText(screen.getByLabelText("Name (optional)"), "  Ada Reader  ")
    fireEvent.changeText(screen.getByLabelText("Phone (optional)"), "  +1 555 0100  ")
    fireEvent.changeText(screen.getByLabelText("Instagram (optional)"), "  @ada  ")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledWith({
      display_name: "Ada Reader",
      contacts: { phone: "+1 555 0100", instagram: "@ada" },
    }))
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home")
  })

  it("shows a visible warning when the account already exists", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "User already registered", code: "user_already_exists" } } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    expect(await screen.findByText("This account already exists. Please log in.")).toBeOnTheScreen()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("shows the same warning when an existing account password is incorrect", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Invalid login credentials", code: "invalid_credentials" } } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "wrong-password")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("This account already exists. Please log in.")).toBeOnTheScreen()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it("does not fail silently when authentication rejects", async () => {
    mockedSignUp.mockRejectedValue(Object.assign(new Error("Invalid login credentials"), { code: "invalid_credentials" }))
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "wrong-password")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("This account already exists. Please log in.")).toBeOnTheScreen()
  })

  it("treats an unconfirmed existing email as an existing account", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Email not confirmed", code: "email_not_confirmed" } } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "reader@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "wrong-password")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("This account already exists. Please log in.")).toBeOnTheScreen()
  })

  it("shows only the existing-account warning when Supabase checks password strength first", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: null, session: null }, error: { message: "Password should be at least 6 characters", code: "weak_password" } } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "new@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "short")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("This account already exists. Please log in.")).toBeOnTheScreen()
    expect(screen.queryByText("Password should be at least 6 characters")).not.toBeOnTheScreen()
  })
})
