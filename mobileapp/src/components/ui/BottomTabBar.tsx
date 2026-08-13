import { Pressable, StyleSheet, Text, useWindowDimensions, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartNoAxesColumnIncreasing, FileChartColumn, HandCoins, Package, ShoppingCart } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../theme';

const ACTIVE = colors.brand;
const ACTIVE_SOFT = colors.brandSoft;
const INACTIVE_ICON = '#8A7A70';
const INACTIVE_LABEL = '#8A7A70';
const SMALL_BREAKPOINT = 360;

const TABS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: ChartNoAxesColumnIncreasing },
  { name: 'Register', label: 'Register', icon: ShoppingCart },
  { name: 'Sales', label: 'Sales', icon: HandCoins },
  { name: 'Inventory', label: 'Inventory', icon: Package },
  { name: 'Reports', label: 'Reports', icon: FileChartColumn },
];

export default function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < SMALL_BREAKPOINT;

  const size = {
    pillHeight: isSmall ? 76 : 80,
    pillMarginH: isSmall ? 10 : 12,
    icon: isSmall ? 24 : 28,
    label: isSmall ? 12 : 13,
    gap: isSmall ? 4 : 6,
    boxPad: isSmall ? 6 : 8,
  };

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 0) + 10 }]}>
      <View
        style={[
          styles.pill,
          { height: size.pillHeight, marginHorizontal: size.pillMarginH },
          Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(255,255,255,0.88)' } as object) : null,
        ]}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          const isFocused = state.index === index;
          return (
            <Pressable
              key={route.key}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
              style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.97 }] }]}
            >
              <View style={[styles.iconBox, { padding: size.boxPad }, isFocused && styles.iconBoxActive]}>
                {tab?.icon ? (
                  <tab.icon size={size.icon} color={isFocused ? ACTIVE : INACTIVE_ICON} strokeWidth={isFocused ? 2.2 : 2} />
                ) : null}
              </View>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={[
                  styles.label,
                  { fontSize: size.label, marginTop: size.gap, color: isFocused ? ACTIVE : INACTIVE_LABEL, fontWeight: isFocused ? '600' : '500' },
                ]}
              >
                {tab?.label ?? route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  pill: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(61,48,42,0.08)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  iconBoxActive: {
    backgroundColor: ACTIVE_SOFT,
    shadowColor: ACTIVE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  label: {
    letterSpacing: -0.1,
  },
});