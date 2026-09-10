import { Modal, Pressable, StyleSheet, Text, View } from "react-native"

import { palette, radii, shadows, typography } from "@/constants/theme"

type ConfirmationModalProps = {
  visible: boolean
  title: string
  message: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmationModalProps) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel}
      transparent
      visible={visible}
    >
      <View accessibilityViewIsModal style={styles.overlay}>
        <Pressable
          accessibilityLabel={cancelLabel}
          onPress={onCancel}
          style={StyleSheet.absoluteFill}
        />
        <View accessibilityRole="alert" style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.button, styles.cancelButton, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={confirmLabel}
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [styles.button, styles.confirmButton, pressed && styles.pressed]}
              testID="confirmation-modal-confirm"
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(35, 28, 24, 0.46)",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderWidth: 1.5,
    borderColor: palette.borderStrong,
    borderRadius: radii.lg,
    padding: 22,
    backgroundColor: palette.surface,
    ...shadows.soft,
  },
  title: {
    color: palette.text,
    fontFamily: typography.serif,
    fontSize: 22,
    fontWeight: "700",
  },
  message: {
    marginTop: 10,
    color: palette.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
  button: {
    minWidth: 96,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    paddingHorizontal: 18,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surfaceMuted,
  },
  confirmButton: {
    backgroundColor: palette.danger,
  },
  cancelText: {
    color: palette.text,
    fontWeight: "700",
  },
  confirmText: {
    color: palette.white,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
})
