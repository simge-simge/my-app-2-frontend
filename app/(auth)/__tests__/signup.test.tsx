import { Alert } from "react-native"
import type { ReactNode } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { router } from "expo-router"

import Signup, { generateUsername } from "../signup"
import { resendSignupVerification, signInWithGoogle, signUp } from "@/services/authentication"
import { updateProfile } from "@/services/profile"
import { searchLocations } from "@/services/locations"

jest.mock("@/services/authentication", () => ({ signUp: jest.fn(), signInWithGoogle: jest.fn(), resendSignupVerification: jest.fn() }))
jest.mock("@/services/profile", () => ({ updateProfile: jest.fn() }))
jest.mock("@/services/locations", () => ({ searchLocations: jest.fn() }))
jest.mock("@/components/BookDoodles", () => ({ BookDoodles: () => null }))
jest.mock("@/components/GentleEntrance", () => ({ children }: { children: ReactNode }) => children)

const mockedSignUp = jest.mocked(signUp)
const mockedGoogle = jest.mocked(signInWithGoogle)
const mockedResend = jest.mocked(resendSignupVerification)
const mockedUpdateProfile = jest.mocked(updateProfile)
const mockedSearchLocations = jest.mocked(searchLocations)
const istanbul = { id: "location-istanbul", name: "İstanbul", display_name: "İstanbul, Türkiye", type: "city" as const, parent_id: "location-tr", country_code: "TR" }

describe("signup", () => {
  beforeEach(() => {
    jest.spyOn(Alert, "alert").mockImplementation(() => {})
    mockedUpdateProfile.mockResolvedValue({} as never)
    mockedSearchLocations.mockResolvedValue([istanbul])
  })

  it("generates a username from the email prefix", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    expect(generateUsername("New.Reader+books@example.com")).toMatch(/^new_reader_books_[a-z0-9]{4}$/)
  })

  it("requires email and password and enforces the visible minimum", async () => {
    render(<Signup />)
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    expect(Alert.alert).toHaveBeenCalledWith("Create account failed", "Please enter your email and password.")

    fireEvent.changeText(screen.getByLabelText("Email"), "new@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "short")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    expect(await screen.findAllByText("Use at least 8 characters.")).toHaveLength(2)
    expect(mockedSignUp).not.toHaveBeenCalled()
  })

  it("shows email verification instead of entering the app without a session", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "  new-reader@example.com ")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    expect(await screen.findByText("Check your email.")).toBeOnTheScreen()
    expect(screen.getByText("We sent a verification link to new-reader@example.com.")).toBeOnTheScreen()
    expect(mockedSignUp).toHaveBeenCalledWith("new-reader@example.com", "secret123", expect.objectContaining({
      display_name: expect.stringMatching(/^new_reader_[a-z0-9]{4}$/), contacts: {}, onboarding_profile: true,
    }))
    expect(mockedUpdateProfile).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalledWith("/(tabs)/home")
  })

  it("resends verification from the confirmation state", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: { id: "user-1" }, session: null }, error: null } as never)
    mockedResend.mockResolvedValue({ data: {}, error: null } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "new@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))
    fireEvent.press(await screen.findByRole("button", { name: "Resend verification email" }))
    await waitFor(() => expect(mockedResend).toHaveBeenCalledWith("new@example.com"))
  })

  it("keeps immediate-session projects working and saves optional profile fields", async () => {
    mockedSignUp.mockResolvedValue({ data: { user: { id: "user-1" }, session: { access_token: "token" } }, error: null } as never)
    render(<Signup />)
    fireEvent.changeText(screen.getByLabelText("Email"), "ada@example.com")
    fireEvent.changeText(screen.getByLabelText("Password"), "secret123")
    fireEvent.changeText(screen.getByLabelText("Name (optional)"), "  Ada Reader  ")
    fireEvent.changeText(screen.getByLabelText("Location (optional)"), "Istan")
    fireEvent.press(await screen.findByRole("button", { name: "Select İstanbul, Türkiye" }))
    fireEvent.changeText(screen.getByLabelText("Phone (optional)"), "  +1 555 0100  ")
    fireEvent.press(screen.getByRole("button", { name: "Create account" }))

    await waitFor(() => expect(mockedUpdateProfile).toHaveBeenCalledWith({
      display_name: "Ada Reader", location_id: "location-istanbul", contacts: { phone: "+1 555 0100" },
    }))
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home")
  })

  it("uses the same Google continuation flow as login", async () => {
    mockedGoogle.mockResolvedValue({ data: { session: { access_token: "token" } }, error: null } as never)
    render(<Signup />)
    fireEvent.press(screen.getByRole("button", { name: "Continue with Google" }))
    await waitFor(() => expect(mockedGoogle).toHaveBeenCalledTimes(1))
    expect(router.replace).toHaveBeenCalledWith("/(tabs)/home")
  })
})
