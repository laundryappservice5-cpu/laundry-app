import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({ visible, title, description, confirmLabel = 'Confirm', loading, onConfirm, onClose }: ConfirmModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {description && <Text style={styles.description}>{description}</Text>}
          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
  },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  description: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 16 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  button: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, minWidth: 80, alignItems: 'center' },
  cancelButton: { backgroundColor: 'transparent' },
  cancelText: { color: COLORS.textSecondary, fontWeight: '600' },
  confirmButton: { backgroundColor: COLORS.primary },
  confirmText: { color: '#fff', fontWeight: '700' },
});
