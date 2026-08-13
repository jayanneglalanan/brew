import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, gap, radius } from '../../theme';

export default function FormField({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.sub} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: gap.md },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, color: colors.onCardSub, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, backgroundColor: '#fff',
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.ink,
  },
});
