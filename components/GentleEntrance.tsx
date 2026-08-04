import { PropsWithChildren, useEffect, useRef } from "react"
import { AccessibilityInfo, Animated, type StyleProp, type ViewStyle } from "react-native"

export default function GentleEntrance({ children, delay = 0, style }: PropsWithChildren<{ delay?: number; style?: StyleProp<ViewStyle> }>) {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let mounted = true
    AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (!mounted) return
      if (reduceMotion) {
        progress.setValue(1)
        return
      }
      Animated.timing(progress, { toValue: 1, duration: 520, delay, useNativeDriver: true }).start()
    })
    return () => { mounted = false; progress.stopAnimation() }
  }, [delay, progress])

  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  )
}
