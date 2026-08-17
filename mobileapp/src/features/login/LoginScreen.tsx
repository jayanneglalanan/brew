import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Lock, Mail } from 'lucide-react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import FloatingInput from './FloatingInput';
import { resolveUser, DEMO_ACCOUNTS } from '../../data/auth';
import { useAuth } from '../../data/AuthContext';
import { loginColors as C } from './tokens';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const finishLogin = (user: { id: string; name: string; role: string }) => {
    setError('');
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      login({ id: user.id, name: user.name, role: user.role as 'owner' | 'manager' | 'cashier' }).then(() => {
        navigation.replace('Main');
      });
    }, 1500);
  };

  const handleLogin = () => {
    if (loading) return;
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    const user = resolveUser(email, password);
    if (!user) {
      setError('Invalid email or password. Use one of the demo accounts below.');
      return;
    }
    finishLogin(user);
  };

  const useDemo = (account: { email: string; password: string; user: { id: string; name: string; role: string } }) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brandMark}>
            <View style={styles.brandTile}>
              <Text style={styles.brandEmoji}>☕</Text>
            </View>
            <Text style={styles.brand}>KapeFlow</Text>
            <Text style={styles.subtitle}>Good Coffee, Good Day</Text>
          </View>

          <View style={styles.form}>
            <FloatingInput
              label="Email / Username"
              icon={Mail}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              invalid={!!error}
            />

            <View style={styles.spacing} />

            <FloatingInput
              label="Password"
              icon={Lock}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              toggle={{ show: showPassword, onPress: () => setShowPassword((v) => !v) }}
              error={error}
            />

            <View style={styles.row}>
              <Pressable style={styles.remember} onPress={() => setRemember((v) => !v)} hitSlop={8} accessibilityRole="button">
                <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                  {remember ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.rememberText}>Remember Me</Text>
              </Pressable>
              <Pressable hitSlop={8} accessibilityRole="button">
                <Text style={styles.forgot}>Forgot Password?</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.button, pressed && !loading && styles.buttonPressed, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <>
                  <ActivityIndicator color={C.surface} size="small" />
                  <Text style={styles.buttonText}>Brewing...</Text>
                </>
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.demo}>
            <Text style={styles.demoTitle}>Demo accounts</Text>
            <View style={styles.demoCards}>
              {DEMO_ACCOUNTS.map((a) => (
                <Pressable key={a.user.id} onPress={() => useDemo(a)} style={styles.demoCard} hitSlop={4} accessibilityRole="button">
                  <Text style={styles.demoCardName}>{a.user.name}</Text>
                  <Text style={styles.demoCardRole}>{a.user.role}</Text>
                  <Text style={styles.demoCardEmail} numberOfLines={1}>{a.email}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.demoText}>
              Password: <Text style={styles.demoStrong}>{DEMO_ACCOUNTS[0].password}</Text> for both
            </Text>
            <Pressable onPress={() => useDemo(DEMO_ACCOUNTS[0])} hitSlop={8} accessibilityRole="button">
              <Text style={styles.demoUse}>Use demo account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 14 },
  brandMark: { alignItems: 'center', marginBottom: 20 },
  brandTile: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  brandEmoji: { fontSize: 34 },
  brand: { fontSize: 28, fontWeight: '800', color: C.text, marginTop: 14 },
  subtitle: { fontSize: 14, color: C.textSub, fontStyle: 'italic', marginTop: 8 },
  form: { width: '100%', maxWidth: 420, alignSelf: 'center' },
  spacing: { height: 14 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 18 },
  remember: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark: { fontSize: 12, color: C.surface, fontWeight: '700' },
  rememberText: { fontSize: 13, color: C.text },
  forgot: { fontSize: 13, color: C.primary, fontWeight: '600' },
  button: {
    backgroundColor: C.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: C.primaryDark,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.85 },
  buttonText: { color: C.surface, fontSize: 15, fontWeight: '600', letterSpacing: 0.4 },
  demo: { alignItems: 'center', marginTop: 16, width: '100%', maxWidth: 420, alignSelf: 'center' },
  demoTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, color: C.textSub },
  demoCards: { flexDirection: 'row', gap: 8, width: '100%', marginTop: 8 },
  demoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  demoCardName: { fontSize: 14, fontWeight: '700', color: C.primary },
  demoCardRole: { fontSize: 12, fontWeight: '600', color: C.secondary, textTransform: 'capitalize', marginTop: 1 },
  demoCardEmail: { fontSize: 10, color: C.textSub, marginTop: 4 },
  demoText: { fontSize: 13, color: C.text, marginTop: 10 },
  demoStrong: { fontWeight: '700', color: C.text },
  demoUse: { fontSize: 13, color: C.primary, fontWeight: '600', marginTop: 6 },
});