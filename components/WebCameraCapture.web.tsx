import { useEffect, useRef, useState } from "react"
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { CameraView, useCameraPermissions } from "expo-camera"
import type { ImagePickerAsset } from "expo-image-picker"

import { palette, radii, shadows } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

type Props = {
  visible: boolean
  onCancel: () => void
  onCapture: (asset: ImagePickerAsset) => void
}

export default function WebCameraCapture({ visible, onCancel, onCapture }: Props) {
  const { t } = useTranslation()
  const [permission, requestPermission] = useCameraPermissions()
  const [taking, setTaking] = useState(false)
  const cameraRef = useRef<CameraView>(null)

  useEffect(() => {
    if (visible && !permission?.granted && permission?.canAskAgain !== false) {
      void requestPermission()
    }
  }, [permission, requestPermission, visible])

  const takePhoto = async () => {
    setTaking(true)
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.86 })
      if (!photo) return
      onCapture({
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        type: "image",
        mimeType: "image/jpeg",
        fileName: "camera-photo.jpg",
      })
    } finally {
      setTaking(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <Text style={styles.title}>{t("takePhoto")}</Text>
          <View style={styles.preview}>
            {permission?.granted ? <CameraView ref={cameraRef} facing="back" style={StyleSheet.absoluteFill} /> : (
              <View style={styles.center}>
                {permission?.canAskAgain === false ? <Text style={styles.permissionText}>{t("allowCameraCover")}</Text> : <ActivityIndicator color={palette.accent} />}
              </View>
            )}
          </View>
          <View style={styles.actions}>
            <Pressable accessibilityRole="button" style={styles.cancelButton} onPress={onCancel}><Text style={styles.cancelText}>{t("cancel")}</Text></Pressable>
            <Pressable accessibilityRole="button" disabled={!permission?.granted || taking} style={[styles.captureButton, (!permission?.granted || taking) && styles.disabled]} onPress={() => void takePhoto()}>
              {taking ? <ActivityIndicator color={palette.paper} /> : null}
              <Text style={styles.captureText}>{t("takePhoto")}</Text>
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
  title: { color: palette.text, fontSize: 20, fontWeight: "800", marginBottom: 14 },
  preview: { position: "relative", width: "100%", aspectRatio: 4 / 3, overflow: "hidden", borderRadius: radii.md, backgroundColor: palette.surfaceMuted },
  center: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", padding: 24 },
  permissionText: { color: palette.textMuted, fontSize: 14, lineHeight: 20, textAlign: "center" },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  cancelButton: { minHeight: 42, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  cancelText: { color: palette.text, fontSize: 14, fontWeight: "700" },
  captureButton: { minWidth: 120, minHeight: 42, paddingHorizontal: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: palette.accent },
  captureText: { color: palette.paper, fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.55 },
})
