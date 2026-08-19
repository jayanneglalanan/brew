import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type ScrollViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, gap } from '../../theme';
import { useReducedMotion } from '../../animations';
import { SkeletonScreen } from './Skeleton';

interface ScreenProps extends ScrollViewProps {
  title: string;
  subtitle?: string;
  sticky?: React.ReactNode;
  floating?: React.ReactNode;
  skeleton?: boolean;
  children: React.ReactNode;
}

export default function Screen({ subtitle, sticky, floating, skeleton = true, children, ...rest }: ScreenProps) {
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(!skeleton);

  useEffect(() => {
    if (reduced) {
      setReady(true);
      return;
    }
    if (!skeleton) {
      setReady(true);
      return;
    }
    const t = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(t);
  }, [reduced, skeleton]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} stickyHeaderIndices={[0]} {...rest}>
        <View style={styles.sticky}>
          <View style={styles.header}>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {sticky}
        </View>
        {ready ? children : <SkeletonScreen />}
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