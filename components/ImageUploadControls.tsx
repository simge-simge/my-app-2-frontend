import { useState } from "react"
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native"
import * as ImagePicker from "expo-image-picker"
import type { ImagePickerAsset } from "expo-image-picker"
import WebCameraCapture from "./WebCameraCapture"
import WebImageCropper from "./WebImageCropper"
import { palette, radii } from "@/constants/theme"
import { useTranslation } from "@/localization/LanguageContext"

export default function ImageUploadControls({ purpose = "cover", disabled = false, onSelect }: {
  purpose?: "cover" | "avatar"
  disabled?: boolean
  onSelect: (asset: ImagePickerAsset) => void
}) {
  const { t } = useTranslation()
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cropAsset, setCropAsset] = useState<ImagePickerAsset | null>(null)
  const select = (asset: ImagePickerAsset) => {
    if (Platform.OS === "web") setCropAsset(asset)
    else onSelect(asset)
  }
  const pick = async (camera: boolean) => {
    try {
      if (camera && Platform.OS === "web") { setCameraOpen(true); return }
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert(t("permissionNeeded"), t(purpose === "avatar"
          ? (camera ? "allowCameraAvatar" : "allowPhotoAvatar")
          : (camera ? "allowCameraCover" : "allowPhotoCover")))
        return
      }
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ["images"], allowsEditing: true, quality: 0.8,
        ...(purpose === "avatar" ? { aspect: [1, 1] as [number, number] } : {}),
      }
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options)
      if (!result.canceled && result.assets?.[0]?.uri) select(result.assets[0])
    } catch {
      Alert.alert(t("error"), t("imageSelectionFailed"))
    }
  }
  return <>
    <WebImageCropper asset={cropAsset} purpose={purpose} onCancel={() => setCropAsset(null)} onComplete={(asset) => { setCropAsset(null); onSelect(asset) }} />
    <WebCameraCapture visible={cameraOpen} onCancel={() => setCameraOpen(false)} onCapture={(asset) => { setCameraOpen(false); select(asset) }} />
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={disabled} style={[styles.button, disabled && styles.disabled]} onPress={() => void pick(false)}><Text style={styles.text}>{t("pickFromLibrary")}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={disabled} style={[styles.button, disabled && styles.disabled]} onPress={() => void pick(true)}><Text style={styles.text}>{t("captureNewImage")}</Text></Pressable>
    </View>
  </>
}
const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  button: { flexGrow: 1, minHeight: 44, padding: 12, alignItems: "center", justifyContent: "center", borderRadius: radii.md, borderWidth: 1, borderColor: palette.borderStrong, backgroundColor: palette.surfaceMuted },
  text: { color: palette.text, fontSize: 14, fontWeight: "700" },
  disabled: { opacity: 0.5 },
})
