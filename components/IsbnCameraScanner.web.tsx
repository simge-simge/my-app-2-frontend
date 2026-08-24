import { createElement, useEffect, useRef, type CSSProperties } from "react"
import { StyleSheet, View } from "react-native"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"

type Props = {
  active: boolean
  onDetected: (isbn: string) => void
  onReady?: () => void
  onError?: (message: string) => void
}

export default function IsbnCameraScanner({ active, onDetected, onReady, onError }: Props) {
  const video = useRef<HTMLVideoElement | null>(null)
  const detectedCallback = useRef(onDetected)
  const readyCallback = useRef(onReady)
  const errorCallback = useRef(onError)
  detectedCallback.current = onDetected
  readyCallback.current = onReady
  errorCallback.current = onError

  useEffect(() => {
    if (!active || !video.current) return

    let disposed = false
    let controls: IScannerControls | undefined
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
    ])
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 250,
      delayBetweenScanSuccess: 500,
    })

    reader.decodeFromConstraints(
      { audio: false, video: { facingMode: { ideal: "environment" } } },
      video.current,
      (result) => {
        if (!disposed && result) detectedCallback.current(result.getText())
      },
    ).then((scannerControls) => {
      if (disposed) scannerControls.stop()
      else {
        controls = scannerControls
        readyCallback.current?.()
      }
    }).catch((error: unknown) => {
      if (!disposed) errorCallback.current?.(error instanceof Error ? error.message : "The camera could not start.")
    })

    return () => {
      disposed = true
      controls?.stop()
    }
  }, [active])

  return (
    <View style={StyleSheet.absoluteFill}>
      {createElement("video", {
        ref: video,
        autoPlay: true,
        muted: true,
        playsInline: true,
        style: webVideoStyle,
      })}
    </View>
  )
}

const webVideoStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transform: "none",
}
