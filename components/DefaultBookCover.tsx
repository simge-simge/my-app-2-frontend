import { useState } from "react"
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native"

import { lightPalette, typography } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  title: string
  author?: string | null
  style?: StyleProp<ViewStyle>
}

// Work in cover coordinates, then scale the whole composition together. This
// keeps the artwork and typography aligned in thumbnails and large previews.
const COVER_WIDTH = 240
const COVER_HEIGHT = 360
const TEXT_WIDTH = 176

function fittedFontSize(text: string, maximum: number, height: number, maxLines: number) {
  for (let size = maximum; size >= 8; size--) {
    let lines = 1
    let used = 0
    for (const word of text.split(/\s+/)) {
      // Conservative serif metrics also leave room for bold and accented glyphs.
      const width = Array.from(word).reduce((sum, character) =>
        sum + size * (/[^\u0000-\u024f]/u.test(character) ? 1 : /[MW@%]/.test(character) ? 0.95 : /[ilI.,'!]/.test(character) ? 0.32 : 0.62), 0)
      if (used && used + size * 0.32 + width > TEXT_WIDTH) {
        lines++
        used = 0
      }
      lines += Math.max(0, Math.ceil(width / TEXT_WIDTH) - 1)
      used = (used ? used + size * 0.32 : 0) + width
    }
    if (lines <= maxLines && lines * size * 1.22 <= height) return size
  }
  return 8
}

export default function DefaultBookCover({ title, author, style }: Props) {
  const { t } = useTranslation()
  const [size, setSize] = useState({ width: 0, height: 0 })
  const displayTitle = title.replace(/\s+/g, " ").trim()
  const displayAuthor = author?.replace(/\s+/g, " ").trim() || t("unknownAuthor")
  const scale = Math.min(size.width / COVER_WIDTH, size.height / COVER_HEIGHT)
  const titleSize = fittedFontSize(displayTitle, 30, 150, 5)
  const authorSize = fittedFontSize(displayAuthor, 17, 48, 3)

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t("bookBy", { title, author: displayAuthor })}
      style={[styles.container, style]}
      onLayout={({ nativeEvent: { layout } }) => {
        setSize((previous) => previous.width === layout.width && previous.height === layout.height
          ? previous : { width: layout.width, height: layout.height })
      }}
    >
      <View pointerEvents="none" style={[styles.artwork, {
        left: (size.width - COVER_WIDTH) / 2,
        top: (size.height - COVER_HEIGHT) / 2,
        transform: [{ scale }],
      }]}>
        <Image source={require("@/assets/images/default-book-cover.png")} style={styles.background} resizeMode="stretch" accessible={false} />
        <View style={styles.titleArea}>
          <Text accessible={false} allowFontScaling={false} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={5} style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.22 }]}>{displayTitle}</Text>
        </View>
        <View style={styles.rule} />
        <View style={styles.authorArea}>
          <Text accessible={false} allowFontScaling={false} adjustsFontSizeToFit minimumFontScale={0.5} numberOfLines={3} style={[styles.author, { fontSize: authorSize, lineHeight: authorSize * 1.22 }]}>{displayAuthor}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { overflow: "hidden", backgroundColor: lightPalette.surfaceMuted },
  artwork: { position: "absolute", width: COVER_WIDTH, height: COVER_HEIGHT, overflow: "hidden", backgroundColor: lightPalette.paper },
  background: { position: "absolute", width: COVER_WIDTH, height: COVER_HEIGHT },
  titleArea: { position: "absolute", top: 48, left: 32, width: TEXT_WIDTH, height: 150, justifyContent: "center" },
  title: { fontFamily: typography.serif, fontWeight: "700", textAlign: "center", color: lightPalette.ink },
  rule: { position: "absolute", top: 211, left: 104, width: 32, height: 1, backgroundColor: lightPalette.accent },
  authorArea: { position: "absolute", top: 224, left: 32, width: TEXT_WIDTH, height: 48, justifyContent: "center" },
  author: { fontFamily: typography.serif, textAlign: "center", color: lightPalette.accentDark },
})
