import { Ionicons } from "@expo/vector-icons"
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import { useEffect, useRef, useState } from "react"
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { layout, palette, radii, shadows } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

const tabs = {
  home: { labelKey: "home", outline: "home-outline", filled: "home" },
  explore: { labelKey: "explore", outline: "compass-outline", filled: "compass" },
  search: { labelKey: "search", outline: "search-outline", filled: "search" },
  library: { labelKey: "library", outline: "library-outline", filled: "library" },
  matches: { labelKey: "matches", outline: "heart-outline", filled: "heart" },
} as const

type TabName = keyof typeof tabs

export default function PersistentTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()
  const { width } = useWindowDimensions()
  const activeRoute = state.routes[state.index]

  if (!activeRoute || !(activeRoute.name in tabs)) return null

  return (
    <View style={[styles.safeArea, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={[styles.bar, { width: Math.min(width - 24, layout.readingMax) }]} accessibilityRole="tablist">
        {state.routes.filter((route) => route.name in tabs).map((route) => {
          const routeIndex = state.routes.findIndex((item) => item.key === route.key)
          const focused = state.index === routeIndex
          const config = tabs[route.name as TabName]
          const label = t(config.labelKey)
          const options = descriptors[route.key]?.options

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params)
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={options?.tabBarAccessibilityLabel ?? label}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}
            >
              <AnimatedTabIcon focused={focused} outline={config.outline} filled={config.filled} />
              <Text numberOfLines={1} style={[styles.label, focused && styles.activeLabel]}>{label}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function AnimatedTabIcon({ focused, outline, filled }: { focused: boolean; outline: keyof typeof Ionicons.glyphMap; filled: keyof typeof Ionicons.glyphMap }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion)
    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(focused ? 1 : 0)
      return
    }
    Animated.spring(progress, {
      toValue: focused ? 1 : 0,
      speed: 22,
      bounciness: focused ? 7 : 0,
      useNativeDriver: true,
    }).start()
  }, [focused, progress, reduceMotion])

  return (
    <Animated.View
      style={[
        styles.iconWrap,
        focused && styles.activeIconWrap,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
          ],
        },
      ]}
    >
      <Ionicons name={focused ? filled : outline} size={20} color={focused ? palette.accentDark : palette.textMuted} />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  safeArea: { width: "100%", maxWidth: "100%", overflow: "hidden", backgroundColor: palette.background, paddingHorizontal: 14, paddingTop: 7, alignItems: "center" },
  bar: {
    alignSelf: "center",
    minHeight: 64,
    flexDirection: "row",
    paddingHorizontal: 5,
    paddingVertical: 5,
    borderRadius: radii.lg,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.paper,
    ...shadows.soft,
  },
  item: { flex: 1, minWidth: 0, minHeight: 52, alignItems: "center", justifyContent: "center", gap: 3, borderRadius: radii.md },
  pressed: { backgroundColor: palette.surfaceMuted, opacity: 0.82 },
  iconWrap: { width: 34, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radii.sm },
  activeIconWrap: { backgroundColor: palette.accentSoft },
  label: { color: palette.textMuted, fontSize: 10, fontWeight: "600" },
  activeLabel: { color: palette.accentDark, fontWeight: "700" },
})
