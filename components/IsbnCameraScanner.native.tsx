import { useCallback, useEffect, useRef, useState } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { CameraView } from "expo-camera"

import { palette, radii } from "@/constants/theme"

type Props = {
  active: boolean
  torchEnabled?: boolean
  onDetected: (isbn: string) => void
  onReady?: () => void
  onError?: (message: string) => void
}

export default function IsbnCameraScanner({ active, torchEnabled = false, onDetected, onReady, onError }: Props) {
  const detectedCallback = useRef(onDetected)
  const readyCallback = useRef(onReady)
  const [useFallback, setUseFallback] = useState(!CameraView.isModernBarcodeScannerAvailable)
  const launching = useRef(false)
  detectedCallback.current = onDetected
  readyCallback.current = onReady

  const launchSystemScanner = useCallback(async () => {
    if (launching.current || !active) return
    launching.current = true
    try {
      await CameraView.launchScanner({
        barcodeTypes: ["ean13"],
        isGuidanceEnabled: true,
        isHighlightingEnabled: true,
        isPinchToZoomEnabled: false,
      })
    } catch (error) {
      setUseFallback(true)
      console.warn("System barcode scanner unavailable; using camera fallback.", error)
    } finally {
      launching.current = false
    }
  }, [active])

  useEffect(() => {
    if (!active || useFallback) return
    const subscription = CameraView.onModernBarcodeScanned(({ data }) => {
      if (Platform.OS === "ios") void CameraView.dismissScanner()
      detectedCallback.current(data)
    })
    readyCallback.current?.()
    void launchSystemScanner()
    return () => subscription.remove()
  }, [active, launchSystemScanner, useFallback])

  if (!useFallback) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.systemScannerFallback]}>
        <Text style={styles.systemScannerTitle}>Use the full-screen scanner</Text>
        <Text style={styles.systemScannerHint}>It uses the phone’s optimized high-resolution barcode detector.</Text>
        <Pressable accessibilityRole="button" onPress={() => void launchSystemScanner()} style={styles.reopenButton}>
          <Text style={styles.reopenButtonText}>Open scanner</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      mirror={false}
      zoom={0}
      ratio="4:3"
      autofocus="off"
      enableTorch={torchEnabled}
      barcodeScannerSettings={{ barcodeTypes: ["ean13"] }}
      onBarcodeScanned={active ? ({ data }) => onDetected(data) : undefined}
      onCameraReady={onReady}
      onMountError={({ message }) => onError?.(message)}
    />
  )
}

const styles = StyleSheet.create({
  systemScannerFallback: {
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.surfaceStrong,
  },
  systemScannerTitle: {
    color: palette.paper,
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  systemScannerHint: {
    color: palette.paper,
    opacity: 0.78,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },
  reopenButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.round,
    backgroundColor: palette.accent,
  },
  reopenButtonText: {
    color: palette.paper,
    fontSize: 14,
    fontWeight: "800",
  },
})
