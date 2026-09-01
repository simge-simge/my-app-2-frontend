import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { router } from "expo-router"

import { layout, palette, radii, shadows, typography } from "@/constants/theme"

export type LegalSection = {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

type LegalDocumentProps = {
  title: string
  summary: string
  sections: LegalSection[]
  relatedLabel: string
  relatedRoute: "/privacy" | "/terms"
}

const CONTACT_EMAIL = "commonshelf0@gmail.com"

export default function LegalDocument({ title, summary, sections, relatedLabel, relatedRoute }: LegalDocumentProps) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.paper}>
        <Text style={styles.brand}>CommonShelf</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.updated}>Effective and last updated: September 1, 2026</Text>
        <Text style={styles.summary}>{summary}</Text>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.heading}>{section.title}</Text>
            {section.paragraphs?.map((paragraph) => (
              <Text key={paragraph} style={styles.body}>{paragraph}</Text>
            ))}
            {section.bullets?.map((bullet) => (
              <View key={bullet} style={styles.bulletRow}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.body, styles.bulletText]}>{bullet}</Text>
              </View>
            ))}
          </View>
        ))}

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Questions or requests?</Text>
          <Text style={styles.body}>Contact the independent developer operating CommonShelf.</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
            style={({ pressed }) => [styles.emailTarget, pressed && styles.pressed]}
          >
            <Text style={styles.email}>{CONTACT_EMAIL}</Text>
          </Pressable>
        </View>

        <View style={styles.footerLinks}>
          <Pressable accessibilityRole="link" onPress={() => router.replace("/")} style={({ pressed }) => [styles.footerTarget, pressed && styles.pressed]}>
            <Text style={styles.footerLink}>CommonShelf home</Text>
          </Pressable>
          <Text style={styles.footerSeparator}>·</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push(relatedRoute)} style={({ pressed }) => [styles.footerTarget, pressed && styles.pressed]}>
            <Text style={styles.footerLink}>{relatedLabel}</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.background },
  container: { width: "100%", maxWidth: layout.readingMax, alignSelf: "center", padding: 20, paddingVertical: 32 },
  paper: { backgroundColor: palette.paper, borderWidth: 1.5, borderColor: palette.borderStrong, borderRadius: radii.xl, padding: 24, ...shadows.soft },
  brand: { color: palette.accentDark, fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: palette.ink, fontFamily: typography.serif, fontSize: 36, lineHeight: 43, fontWeight: "700", marginTop: 7 },
  updated: { color: palette.textMuted, fontSize: 12, marginTop: 9 },
  summary: { color: palette.text, fontSize: 16, lineHeight: 25, marginTop: 22 },
  section: { marginTop: 28 },
  heading: { color: palette.text, fontFamily: typography.serif, fontSize: 21, lineHeight: 27, fontWeight: "700", marginBottom: 9 },
  body: { color: palette.text, fontSize: 14, lineHeight: 22, marginBottom: 10 },
  bulletRow: { flexDirection: "row", alignItems: "flex-start", paddingRight: 6 },
  bullet: { color: palette.accentDark, fontSize: 16, lineHeight: 22, width: 20, fontWeight: "800" },
  bulletText: { flex: 1 },
  contactCard: { marginTop: 30, padding: 18, borderRadius: radii.md, borderWidth: 1.5, borderColor: palette.border, backgroundColor: palette.surfaceMuted },
  contactTitle: { color: palette.text, fontSize: 16, fontWeight: "800", marginBottom: 5 },
  emailTarget: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center" },
  email: { color: palette.accentDark, fontSize: 14, fontWeight: "800", textDecorationLine: "underline" },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", marginTop: 24 },
  footerTarget: { minHeight: 42, justifyContent: "center", paddingHorizontal: 7 },
  footerLink: { color: palette.accentDark, fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  footerSeparator: { color: palette.textMuted },
  pressed: { opacity: 0.65 },
})
