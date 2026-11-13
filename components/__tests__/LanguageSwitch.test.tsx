import AsyncStorage from "@react-native-async-storage/async-storage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native"
import { Text } from "react-native"

import LanguageSwitch from "@/components/LanguageSwitch"
import { LanguageProvider, useTranslation } from "@/localization/LanguageContext"

function ExampleCopy() {
  const { t } = useTranslation()
  return <Text>{t("heroTitle")}</Text>
}

describe("LanguageSwitch", () => {
  it("defaults to Turkish, then switches to English and persists the choice", async () => {
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <ExampleCopy />
      </LanguageProvider>,
    )

    expect(screen.getByText("Sıradaki kitabını arkadaşının kitaplığında keşfet.")).toBeVisible()

    fireEvent.press(screen.getByRole("switch", { name: "Dil seçin" }))

    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith("commonshelf.language", "en"))
  })
})
