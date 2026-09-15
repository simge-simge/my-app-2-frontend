import { PropsWithChildren, useEffect, useRef } from "react"
import { AccessibilityInfo, Animated, type StyleProp, type ViewStyle } from "react-native"

let cachedReduceMotion: boolean | undefined

export default function GentleEntrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const progress = useRef(new Animated.Value(cachedReduceMotion ? 1 : 0.78)).current

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return
      cachedReduceMotion = reduceMotion
      if (reduceMotion) {
        progress.setValue(1)
        return
      }
      Animated.timing(progress, { toValue: 1, duration: 220, delay: Math.min(delay, 60), useNativeDriver: true }).start()
    })
    return () => { mounted = false; progress.stopAnimation() }
  }, [delay, progress])

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [5, 0] }) }] }]}>
      {children}
    </Animated.View>
  )
}
