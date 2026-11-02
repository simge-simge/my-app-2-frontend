import { fireEvent, render, screen } from "@testing-library/react-native"
import { router } from "expo-router"

import AppHomeLink from "@/components/AppHomeLink"

describe("AppHomeLink", () => {
  it("opens the home tab", () => {
    render(<AppHomeLink />)

    fireEvent.press(screen.getByRole("link", { name: "CommonShelf home" }))

    expect(router.push).toHaveBeenCalledWith("/home")
  })
})
