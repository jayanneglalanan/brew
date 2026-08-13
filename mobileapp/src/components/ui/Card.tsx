import { StyleSheet, Text, View } from 'react-native';
import { colors, gap, radius } from '../../theme';

export default function Card({
  title,
  subtitle,
  children,
  style,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.card, style]}>
      {title ? (
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      <View style={title ? styles.body : undefined}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: gap.lg },
  head: { padding: gap.lg, paddingBottom: gap.md, borderBottomWidth: 1, borderBottomColor: 'rgba(253,246,236,0.12)' },
  title: { fontSize: 15, fontWeight: '700', color: colors.onCard },
  subtitle: { marginTop: 2, fontSize: 12, color: colors.onCardSub },
  body: { padding: gap.lg },
});
