import { StyleSheet } from "react-native"
import { CameraView } from "expo-camera"

type Props = {
  active: boolean
  onDetected: (isbn: string) => void
  onReady?: () => void
  onError?: (message: string) => void
}

export default function IsbnCameraScanner({ active, onDetected, onReady, onError }: Props) {
  return (
    <CameraView
      style={StyleSheet.absoluteFill}
      facing="back"
      mirror={false}
      barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
      onBarcodeScanned={active ? ({ data }) => onDetected(data) : undefined}
      onCameraReady={onReady}
      onMountError={({ message }) => onError?.(message)}
    />
  )
}
