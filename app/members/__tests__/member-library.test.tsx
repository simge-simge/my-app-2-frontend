import { fireEvent, render, screen } from "@testing-library/react-native"
import { router, useLocalSearchParams } from "expo-router"

import MemberLibraryScreen from "../[memberId]"
import { ApiError } from "@/services/api"
import { getMemberLibrary } from "@/services/profile"
import { book } from "@/test/factories"

jest.mock("@/services/profile", () => ({ getMemberLibrary: jest.fn() }))
jest.mock("@/utils/supabase", () => ({ supabase: { auth: { getSession: jest.fn() } } }))

const member = { id: "member-1", display_name: "Ada Reader", avatar_url: null, community_id: "community", community_name: "Readers", admin: false, created_at: "2025-01-01T00:00:00Z" }

describe("member library", () => {
  beforeEach(() => jest.mocked(useLocalSearchParams).mockReturnValue({ memberId: "member-1" }))

  it("renders profile and public books and opens details", async () => {
    jest.mocked(getMemberLibrary).mockResolvedValue({ member, books: [book()] })
    render(<MemberLibraryScreen />)
    expect(await screen.findByText("Ada Reader's library")).toBeVisible()
    const item = screen.getByRole("button", { name: "The Left Hand of Darkness by Ursula K. Le Guin" })
    fireEvent.press(item)
    expect(router.push).toHaveBeenCalledWith({ pathname: "/books/[bookId]", params: { bookId: book().id } })
  })

  it("renders empty and unauthorized states", async () => {
    jest.mocked(getMemberLibrary).mockResolvedValueOnce({ member, books: [] })
    const view = render(<MemberLibraryScreen />)
    expect(await screen.findByText("The shelf is empty")).toBeVisible()
    view.unmount()
    jest.mocked(getMemberLibrary).mockRejectedValueOnce(new ApiError("Wrong community", 403))
    render(<MemberLibraryScreen />)
    expect(await screen.findByText("You can only view libraries belonging to members of your community.")).toBeVisible()
  })

  it("uses the shared search and display controls", async () => {
    jest.mocked(getMemberLibrary).mockResolvedValue({
      member,
      books: [
        book({ id: "earthsea", title: "A Wizard of Earthsea", author: "Ursula K. Le Guin" }),
        book({ id: "beloved", title: "Beloved", author: "Toni Morrison" }),
      ],
    })
    render(<MemberLibraryScreen />)

    fireEvent.changeText(await screen.findByLabelText("Search my library"), "Morrison")
    expect(screen.getByText("Beloved")).toBeVisible()
    expect(screen.queryByText("A Wizard of Earthsea")).toBeNull()

    fireEvent.press(screen.getByRole("button", { name: "List view" }))
    expect(screen.getByRole("button", { name: "List view" }).props.accessibilityState).toMatchObject({ selected: true })
  })
})
