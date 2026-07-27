import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { AnimatedPressable } from '../components/AnimatedPressable';
import { useLoginMutation } from '../api/authApi';
import { useAppDispatch } from '../store/hooks';
import { setSession } from '../features/auth/authSlice';
import { saveRefreshToken } from '../features/auth/sessionStorage';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { COLORS } from '../utils/constants';

export function LoginScreen() {
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    try {
      const fcmToken = (await registerForPushNotificationsAsync()) ?? undefined;
      const result = await login({ mobileNumber, password, fcmToken }).unwrap();
      if (result.user.role !== 'DRIVER') {
        setError('This app is for drivers only. Please use the admin dashboard instead.');
        return;
      }
      await saveRefreshToken(result.refreshToken);
      dispatch(setSession(result));
    } catch {
      setError('Invalid mobile number or password.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.logo}>👑 The Royal Fresh Laundry</Text>
        <Text style={styles.tagline}>DUBAI</Text>
        <Text style={styles.subtitle}>Driver Sign In</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Text style={styles.label}>Mobile Number</Text>
        <TextInput
          value={mobileNumber}
          onChangeText={setMobileNumber}
          keyboardType="phone-pad"
          style={styles.input}
          placeholder="9876543210"
          placeholderTextColor={COLORS.textSecondary}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor={COLORS.textSecondary}
        />

        <AnimatedPressable style={styles.button} onPress={handleLogin}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </AnimatedPressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: COLORS.surface, borderRadius: 20, padding: 24 },
  logo: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginBottom: 2 },
  tagline: { fontSize: 12, fontWeight: '700', color: COLORS.secondary, letterSpacing: 2, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    color: COLORS.textPrimary,
  },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  errorBox: { backgroundColor: `${COLORS.error}15`, borderRadius: 10, padding: 10, marginBottom: 16 },
  errorText: { color: COLORS.error, fontSize: 13 },
});
