import type { ImagePickerAsset } from "expo-image-picker"

type Props = {
  asset: ImagePickerAsset | null
  purpose?: "cover" | "shelf"
  onCancel: () => void
  onComplete: (asset: ImagePickerAsset) => void
}

export default function WebImageCropper(_props: Props) {
  return null
}
