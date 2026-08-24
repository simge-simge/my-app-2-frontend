import AsyncStorage from "@react-native-async-storage/async-storage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Text } from "react-native"

import ThemeSwitch from "@/components/ThemeSwitch"
import { ThemeProvider, useAppTheme } from "@/theme/ThemeContext"

function CurrentTheme() {
  const { theme } = useAppTheme()
  return <Text>{theme}</Text>
}

describe("ThemeSwitch", () => {
  it("enables dark mode and persists it", async () => {
    render(
      <ThemeProvider>
        <ThemeSwitch />
        <CurrentTheme />
      </ThemeProvider>,
    )

    fireEvent(screen.getByRole("switch", { name: "Dark mode" }), "valueChange", true)

    expect(screen.getByText("dark")).toBeVisible()
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith("commonshelf.theme", "dark"))
  })
})
