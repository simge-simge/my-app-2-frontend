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
  it("switches to Turkish and persists the choice", async () => {
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <ExampleCopy />
      </LanguageProvider>,
    )

    fireEvent(screen.getByRole("switch", { name: "Choose language" }), "valueChange", true)

    expect(screen.getByText("İyi kitaplar, iyi insanlarla buluşmanın yolunu bulur.")).toBeVisible()
    await waitFor(() => expect(AsyncStorage.setItem).toHaveBeenCalledWith("commonshelf.language", "tr"))
  })
})
