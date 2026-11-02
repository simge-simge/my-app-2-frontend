import { useState } from "react"
import { Image, Platform, type ImageSourcePropType } from "react-native"
import { useTranslation } from "@/localization/LanguageContext"

export const avatarColors = ["lavender", "sage", "blue", "peach", "rose"] as const
const defaults: Record<string, ImageSourcePropType> = {
  lavender: require("@/assets/images/avatars/lavender.png"),
  sage: require("@/assets/images/avatars/sage.png"),
  blue: require("@/assets/images/avatars/blue.png"),
  peach: require("@/assets/images/avatars/peach.png"),
  rose: require("@/assets/images/avatars/rose.png"),
}
export default function UserAvatar({ userId, uri, size = 48 }: { userId: string; uri?: string | null; size?: number }) {
  const { t } = useTranslation()
  const [failedUri, setFailedUri] = useState<string | null>(null)
  const hash = Array.from(userId).reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0)
  const color = uri?.startsWith("default:") ? uri.slice(8) : avatarColors[hash % avatarColors.length]
  const isPhoto = uri && !uri.startsWith("default:") && failedUri !== uri
  return <Image accessible accessibilityLabel={t("profilePicture")} accessibilityRole={Platform.OS === "web" ? undefined : "image"} source={isPhoto ? { uri } : defaults[color] ?? defaults.lavender} onError={() => setFailedUri(uri ?? null)} style={{ width: size, height: size, borderRadius: size / 2 }} resizeMode="cover" />
}
