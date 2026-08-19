import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, useWindowDimensions, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartNoAxesColumnIncreasing, FileChartColumn, HandCoins, Package } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../../theme';
import { DUR, useReducedMotion } from '../../animations';

const ACTIVE = colors.bg;
const ACTIVE_ICON = '#FFFFFF';
const ACTIVE_SOFT = colors.bg;
const INACTIVE_ICON = '#8A7A70';
const INACTIVE_LABEL = '#8A7A70';
const SMALL_BREAKPOINT = 360;

const TABS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Dashboard', label: 'Dashboard', icon: ChartNoAxesColumnIncreasing },
  { name: 'Sales', label: 'Sales', icon: HandCoins },
  { name: 'Inventory', label: 'Inventory', icon: Package },
  { name: 'Reports', label: 'Reports', icon: FileChartColumn },
];

function TabItem({
  icon,
  label,
  focused,
  onPress,
  size,
}: {
  icon: LucideIcon;
  label: string;
  focused: boolean;
  onPress: () => void;
  size: { icon: number; label: number; gap: number; boxPad: number };
}) {
  const reduced = useReducedMotion();
  const scale = useRef(new Animated.Value(focused ? 1.12 : 1)).current;
  const pillOpacity = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const pillScale = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  useEffect(() => {
    if (reduced) {
      scale.setValue(focused ? 1.12 : 1);
      pillOpacity.setValue(focused ? 1 : 0);
      pillScale.setValue(focused ? 1 : 0.85);
      return;
    }
    Animated.spring(scale, { toValue: focused ? 1.12 : 1, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
    Animated.timing(pillOpacity, { toValue: focused ? 1 : 0, duration: DUR.base, useNativeDriver: true }).start();
    Animated.spring(pillScale, { toValue: focused ? 1 : 0.85, useNativeDriver: true, speed: 28, bounciness: 6 }).start();
  }, [focused, reduced, scale, pillOpacity, pillScale]);

  const Icon = icon;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && { transform: [{ scale: 0.96 }] }]}>
      <View style={[styles.iconSlot, { padding: size.boxPad }]}>
        <Animated.View style={[styles.pillBg, { opacity: pillOpacity, transform: [{ scale: pillScale }] }]} />
        <Animated.View style={{ transform: [{ scale }] }}>
          <Icon size={size.icon} color={focused ? ACTIVE_ICON : INACTIVE_ICON} strokeWidth={focused ? 2.2 : 2} />
        </Animated.View>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.85}
        style={[
          styles.label,
          { fontSize: size.label, marginTop: size.gap, color: focused ? ACTIVE : INACTIVE_LABEL, fontWeight: focused ? '600' : '500' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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
            <TabItem
              key={route.key}
              icon={tab?.icon ?? Package}
              label={tab?.label ?? route.name}
              focused={isFocused}
              size={size}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
              }}
            />
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
  iconSlot: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  pillBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 14,
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