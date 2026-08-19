import { AlertTriangle } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AnimatedModal from './AnimatedModal';
import { colors, gap, radius } from '../../theme';

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatedModal visible={visible} onClose={onCancel} panelStyle={styles.panel}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <AlertTriangle size={20} color={colors.critical} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable style={[styles.btn, styles.confirmBtn]} onPress={onConfirm}>
          <Text style={styles.confirmText}>{confirmLabel}</Text>
        </Pressable>
      </View>
    </AnimatedModal>
  );
}

const styles = StyleSheet.create({
  panel: { width: '86%', maxWidth: 340 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: gap.md },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.criticalSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '800', color: colors.onCard },
  message: { marginTop: 4, fontSize: 13, lineHeight: 18, color: colors.onCardSub },
  actions: { flexDirection: 'row', gap: gap.sm, marginTop: gap.lg },
  btn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F4EDE3' },
  cancelText: { color: colors.sub, fontWeight: '700' },
  confirmBtn: { backgroundColor: colors.critical },
  confirmText: { color: '#fff', fontWeight: '700' },
});