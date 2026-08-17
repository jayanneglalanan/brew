import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gap } from '../../theme';

interface ScreenProps extends ScrollViewProps {
  title: string;
  subtitle?: string;
  sticky?: React.ReactNode;
  floating?: React.ReactNode;
  children: React.ReactNode;
}

export default function Screen({ subtitle, sticky, floating, children, ...rest }: ScreenProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]} {...rest}>
        <View style={styles.sticky}>
          <View style={styles.header}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {sticky}
        </View>
        {children}
      </ScrollView>
      {floating}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: gap.lg, paddingBottom: 96 },
  sticky: {
    marginHorizontal: -gap.lg,
    paddingHorizontal: gap.lg,
    paddingTop: gap.lg,
    paddingBottom: gap.xl,
    backgroundColor: colors.bg,
  },
  header: { marginBottom: gap.lg },
  subtitle: { marginTop: 4, fontSize: 13, color: '#E6D2C0' },
});
