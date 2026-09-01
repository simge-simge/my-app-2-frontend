import { createElement, useEffect, useRef, type CSSProperties } from "react"
import { StyleSheet, View } from "react-native"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { BarcodeFormat, DecodeHintType } from "@zxing/library"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  active: boolean
  torchEnabled?: boolean
  onDetected: (isbn: string) => void
  onReady?: () => void
  onError?: (message: string) => void
}

export default function IsbnCameraScanner({ active, torchEnabled = false, onDetected, onReady, onError }: Props) {
  const { t } = useTranslation()
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
    ])
    hints.set(DecodeHintType.TRY_HARDER, true)
    const reader = new BrowserMultiFormatReader(hints, {
      delayBetweenScanAttempts: 250,
      delayBetweenScanSuccess: 500,
    })

    const onScan = (result: Parameters<Parameters<typeof reader.decodeFromConstraints>[2]>[0]) => {
      if (!disposed && result) detectedCallback.current(result.getText())
    }

    const startScanner = async () => {
      try {
        return await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
              width: { min: 1280, ideal: 1920 },
              height: { min: 720, ideal: 1080 },
              frameRate: { ideal: 30 },
            },
          },
          video.current!,
          onScan,
        )
      } catch {
        return reader.decodeFromConstraints(
          { audio: false, video: { facingMode: { ideal: "environment" } } },
          video.current!,
          onScan,
        )
      }
    }

    void startScanner().then(async (scannerControls) => {
      if (disposed) scannerControls.stop()
      else {
        controls = scannerControls
        const stream = video.current?.srcObject
        if (stream instanceof MediaStream) {
          const track = stream.getVideoTracks()[0]
          const capabilities = track?.getCapabilities() as MediaTrackCapabilities & {
            focusMode?: string[]
          }
          const advanced: MediaTrackConstraintSet & { focusMode?: string } = {}
          if (capabilities?.focusMode?.includes("continuous")) advanced.focusMode = "continuous"
          if (track && Object.keys(advanced).length) {
            await track.applyConstraints({ advanced: [advanced] }).catch(() => {
              // Some mobile browsers report focus controls but reject applying them.
            })
          }
        }
        readyCallback.current?.()
      }
    }).catch((error: unknown) => {
      if (!disposed) errorCallback.current?.(error instanceof Error ? error.message : t("cameraStartError"))
    })

    return () => {
      disposed = true
      controls?.stop()
    }
  }, [active, t])

  useEffect(() => {
    const stream = video.current?.srcObject
    if (!(stream instanceof MediaStream)) return
    const track = stream.getVideoTracks()[0]
    if (!track) return
    void track.applyConstraints({
      advanced: [{ torch: torchEnabled } as MediaTrackConstraintSet],
    }).catch(() => {
      // Torch constraints are optional and unsupported by many desktop cameras.
    })
  }, [torchEnabled])

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
