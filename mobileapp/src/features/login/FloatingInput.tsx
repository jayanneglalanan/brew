import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react-native';
import { loginColors as C } from './tokens';

interface FloatingInputProps {
  label: string;
  icon: LucideIcon;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  toggle?: { show: boolean; onPress: () => void };
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  error?: string;
  invalid?: boolean;
}

export default function FloatingInput({
  label,
  icon,
  value,
  onChangeText,
  secureTextEntry,
  toggle,
  autoCapitalize = 'none',
  keyboardType = 'default',
  error,
  invalid,
}: FloatingInputProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const active = useRef(new Animated.Value(value ? 1 : 0)).current;
  const focus = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(active, {
      toValue: focused || value ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, value, active]);

  useEffect(() => {
    Animated.timing(focus, {
      toValue: focused ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [focused, focus]);

  const hasError = !!error || !!invalid;

  const labelTop = active.interpolate({ inputRange: [0, 1], outputRange: [17, -9] });
  const labelSize = active.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelBg = active.interpolate({ inputRange: [0, 1], outputRange: ['rgba(248,243,237,0)', C.bg] });
  const labelPad = active.interpolate({ inputRange: [0, 1], outputRange: [0, 6] });
  const labelColor = hasError
    ? C.error
    : focus.interpolate({ inputRange: [0, 1], outputRange: [C.textSub, C.primary] });
  const borderWidth = hasError ? 1 : focus.interpolate({ inputRange: [0, 1], outputRange: [1, 2] });
  const borderColor = hasError
    ? C.error
    : focus.interpolate({ inputRange: [0, 1], outputRange: [C.border, C.primary] });
  const iconColor = hasError ? C.error : focused ? C.primary : C.textSub;

  const LeadIcon = icon;

  return (
    <View style={styles.field}>
      <View style={styles.inputArea}>
        <Animated.View style={[styles.inputWrap, { borderColor, borderWidth }]}>
          <View style={styles.leadIconWrap}>
            <LeadIcon size={18} strokeWidth={1.8} color={iconColor} />
          </View>
          <TextInput
            ref={inputRef}
            style={[styles.input, toggle ? styles.inputWithToggle : undefined]}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            caretHidden
          />
          {toggle ? (
            <Pressable
              onPress={() => {
                toggle.onPress();
                inputRef.current?.focus();
              }}
              hitSlop={8}
              style={styles.eyeBtn}
              accessibilityRole="button"
            >
              {toggle.show ? <EyeOff size={18} color={C.textSub} /> : <Eye size={18} color={C.textSub} />}
            </Pressable>
          ) : null}
        </Animated.View>
        <View pointerEvents="none" style={styles.floatLabelWrap}>
          <Animated.Text
            style={[
              styles.floatLabel,
              { top: labelTop, fontSize: labelSize, backgroundColor: labelBg, paddingHorizontal: labelPad, color: labelColor },
            ]}
          >
            {label}
          </Animated.Text>
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%' },
  inputArea: { position: 'relative', height: 56 },
  inputWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: 14,
  },
  leadIconWrap: { marginLeft: 16, marginRight: 12 },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: C.text,
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingRight: 14,
  },
  inputWithToggle: { paddingRight: 44 },
  eyeBtn: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', minWidth: 44 },
  floatLabelWrap: { position: 'absolute', left: 46, right: 0, top: 0, bottom: 0 },
  floatLabel: {
    position: 'absolute',
    left: 0,
    color: C.textSub,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  errorText: { fontSize: 12, color: C.error, marginTop: 6, marginLeft: 4 },
});