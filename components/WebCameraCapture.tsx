import type { ImagePickerAsset } from "expo-image-picker"

type Props = {
  visible: boolean
  onCancel: () => void
  onCapture: (asset: ImagePickerAsset) => void
}

export default function WebCameraCapture(_props: Props) {
  return null
}
