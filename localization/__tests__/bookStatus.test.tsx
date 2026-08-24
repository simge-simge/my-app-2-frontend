import { fireEvent, render, screen } from "@testing-library/react-native"
import { Text, View } from "react-native"

import LanguageSwitch from "@/components/LanguageSwitch"
import { LanguageProvider } from "@/localization/LanguageContext"
import { useBookStatusLabel } from "@/localization/bookStatus"

function StatusExamples() {
  const statusLabel = useBookStatusLabel()
  return (
    <View>
      <Text>{statusLabel("available")}</Text>
      <Text>{statusLabel("matched")}</Text>
      <Text>{statusLabel("lent")}</Text>
    </View>
  )
}

describe("book status localization", () => {
  it("uses the selected language for every supported book status", () => {
    render(
      <LanguageProvider>
        <LanguageSwitch />
        <StatusExamples />
      </LanguageProvider>,
    )

    expect(screen.getByText("Available")).toBeVisible()
    expect(screen.getByText("Matched")).toBeVisible()
    expect(screen.getByText("Lent")).toBeVisible()

    fireEvent(screen.getByRole("switch", { name: "Choose language" }), "valueChange", true)

    expect(screen.getByText("Müsait")).toBeVisible()
    expect(screen.getByText("Eşleşti")).toBeVisible()
    expect(screen.getByText("Ödünç verildi")).toBeVisible()
  })
})
