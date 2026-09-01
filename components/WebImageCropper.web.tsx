import { useCallback, useEffect, useMemo, useState } from "react"
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native"
import type { ImagePickerAsset } from "expo-image-picker"
import Cropper, { type Area, type Point } from "react-easy-crop"

import { palette, radii, shadows } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  asset: ImagePickerAsset | null
  purpose?: "cover" | "shelf"
  onCancel: () => void
  onComplete: (asset: ImagePickerAsset) => void
}

type AspectOption = "preferred" | "square" | "original"

const radians = (degrees: number) => degrees * Math.PI / 180

async function cropImage(asset: ImagePickerAsset, crop: Area, rotation: number) {
  const image = document.createElement("img")
  image.src = asset.uri
  await image.decode()

  const angle = radians(rotation)
  const boundingWidth = Math.abs(Math.cos(angle) * image.naturalWidth) + Math.abs(Math.sin(angle) * image.naturalHeight)
  const boundingHeight = Math.abs(Math.sin(angle) * image.naturalWidth) + Math.abs(Math.cos(angle) * image.naturalHeight)
  const sourceCanvas = document.createElement("canvas")
  sourceCanvas.width = Math.round(boundingWidth)
  sourceCanvas.height = Math.round(boundingHeight)
  const sourceContext = sourceCanvas.getContext("2d")
  if (!sourceContext) throw new Error("Canvas is unavailable")

  sourceContext.translate(sourceCanvas.width / 2, sourceCanvas.height / 2)
  sourceContext.rotate(angle)
  sourceContext.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2)

  const outputCanvas = document.createElement("canvas")
  outputCanvas.width = Math.max(1, Math.round(crop.width))
  outputCanvas.height = Math.max(1, Math.round(crop.height))
  const outputContext = outputCanvas.getContext("2d")
  if (!outputContext) throw new Error("Canvas is unavailable")
  outputContext.drawImage(
    sourceCanvas,
    Math.round(crop.x),
    Math.round(crop.y),
    outputCanvas.width,
    outputCanvas.height,
    0,
    0,
    outputCanvas.width,
    outputCanvas.height,
  )

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not crop image")), "image/jpeg", 0.86)
  })
  const fileName = "cropped-cover.jpg"

  return {
    uri: URL.createObjectURL(blob),
    width: outputCanvas.width,
    height: outputCanvas.height,
    type: "image" as const,
    mimeType: "image/jpeg",
    fileName,
    file: new File([blob], fileName, { type: "image/jpeg" }),
  }
}

export default function WebImageCropper({ asset, purpose = "cover", onCancel, onComplete }: Props) {
  const { t } = useTranslation()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [aspectOption, setAspectOption] = useState<AspectOption>("preferred")
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!asset) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setAspectOption("preferred")
    setCroppedArea(null)
  }, [asset])

  const aspect = useMemo(() => {
    if (aspectOption === "square") return 1
    if (aspectOption === "original" && asset?.width && asset.height) return asset.width / asset.height
    return purpose === "shelf" ? 4 / 3 : 2 / 3
  }, [aspectOption, asset, purpose])

  const finishCrop = useCallback(async () => {
    if (!asset || !croppedArea) return
    setSaving(true)
    try {
      onComplete(await cropImage(asset, croppedArea, rotation))
    } finally {
      setSaving(false)
    }
  }, [asset, croppedArea, onComplete, rotation])

  return (
    <Modal visible={Boolean(asset)} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text style={styles.title}>{t("cropPhoto")}</Text>
          <Text style={styles.hint}>{t("cropPhotoHint")}</Text>
          <View style={styles.cropArea}>
            {asset ? (
              <Cropper
                image={asset.uri}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedArea(pixels)}
                showGrid
              />
            ) : null}
          </View>

          <View style={styles.controlRow}>
            <Pressable accessibilityRole="button" style={styles.smallButton} onPress={() => setZoom((value) => Math.max(1, value - 0.2))}><Text style={styles.smallButtonText}>−</Text></Pressable>
            <Text style={styles.controlLabel}>{t("zoom")}</Text>
            <Pressable accessibilityRole="button" style={styles.smallButton} onPress={() => setZoom((value) => Math.min(3, value + 0.2))}><Text style={styles.smallButtonText}>+</Text></Pressable>
            <Pressable accessibilityRole="button" style={styles.rotateButton} onPress={() => setRotation((value) => (value + 90) % 360)}><Text style={styles.rotateButtonText}>{t("rotate")}</Text></Pressable>
          </View>

          <View style={styles.aspectRow}>
            {(["preferred", "square", "original"] as const).map((option) => (
              <Pressable key={option} accessibilityRole="button" style={[styles.aspectButton, aspectOption === option && styles.aspectButtonSelected]} onPress={() => setAspectOption(option)}>
                <Text style={[styles.aspectText, aspectOption === option && styles.aspectTextSelected]}>{t(option === "preferred" ? (purpose === "shelf" ? "shelfRatio" : "coverRatio") : option === "square" ? "squareRatio" : "originalRatio")}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" disabled={saving} style={styles.cancelButton} onPress={onCancel}><Text style={styles.cancelText}>{t("cancel")}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={saving || !croppedArea} style={[styles.applyButton, (saving || !croppedArea) && styles.disabled]} onPress={() => void finishCrop()}>
              {saving ? <ActivityIndicator color={palette.paper} /> : null}
              <Text style={styles.applyText}>{t("applyCrop")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(12, 14, 11, 0.72)" },
  dialog: { width: "100%", maxWidth: 620, padding: 18, borderRadius: radii.lg, backgroundColor: palette.surface, ...shadows.lifted },
  title: { color: palette.text, fontSize: 20, fontWeight: "800" },
  hint: { color: palette.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: 14 },
  cropArea: { position: "relative", width: "100%", height: 380, overflow: "hidden", borderRadius: radii.md, backgroundColor: "#111" },
  controlRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  controlLabel: { color: palette.textMuted, fontSize: 13, fontWeight: "700" },
  smallButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.paper },
  smallButtonText: { color: palette.text, fontSize: 20, fontWeight: "700", lineHeight: 22 },
  rotateButton: { minHeight: 34, marginLeft: "auto", paddingHorizontal: 12, alignItems: "center", justifyContent: "center", borderRadius: radii.sm, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.paper },
  rotateButtonText: { color: palette.text, fontSize: 12, fontWeight: "800" },
  aspectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  aspectButton: { minHeight: 34, paddingHorizontal: 11, alignItems: "center", justifyContent: "center", borderRadius: radii.round, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.paper },
  aspectButtonSelected: { borderColor: palette.accentDark, backgroundColor: palette.accentSoft },
  aspectText: { color: palette.textMuted, fontSize: 12, fontWeight: "700" },
  aspectTextSelected: { color: palette.accentDark },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 16 },
  cancelButton: { minHeight: 42, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  cancelText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  applyButton: { minWidth: 120, minHeight: 42, paddingHorizontal: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: palette.accent },
  applyText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.55 },
})
