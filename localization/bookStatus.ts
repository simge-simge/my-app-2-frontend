import { useTranslation } from "@/localization/LanguageContext"

export function useBookStatusLabel() {
  const { t } = useTranslation()

  return (status?: string | null) => {
    switch (status?.toLowerCase()) {
      case "available":
        return t("available")
      case "matched":
        return t("matchedBookStatus")
      case "lent":
        return t("lentBookStatus")
      default:
        return status || t("unknown")
    }
  }
}
