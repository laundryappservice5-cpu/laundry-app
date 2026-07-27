import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedPressable } from './AnimatedPressable';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../features/auth/authSlice';
import { clearRefreshToken } from '../features/auth/sessionStorage';
import { useChangePasswordMutation } from '../api/authApi';
import { COLORS } from '../utils/constants';

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const insets = useSafeAreaInsets();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const translateY = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 4 }).start();
    } else {
      translateY.setValue(400);
      setMessage(null);
    }
  }, [visible, translateY]);

  function handleClose() {
    Keyboard.dismiss();
    onClose();
  }

  async function handleLogout() {
    await clearRefreshToken();
    dispatch(logout());
    handleClose();
  }

  async function handleChangePassword() {
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', isError: true });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: 'New password must be at least 6 characters.', isError: true });
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setMessage({ text: 'Password changed successfully.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage({ text: 'Could not change password — check your current password.', isError: true });
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View
          style={[styles.sheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY }] }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.grabber} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.mobile}>{user?.mobileNumber}</Text>
                {user?.vehicleNumber && <Text style={styles.vehicle}>Vehicle: {user.vehicleNumber}</Text>}
              </View>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Change Password</Text>
            {message && (
              <Text style={[styles.message, { color: message.isError ? COLORS.error : COLORS.success }]}>{message.text}</Text>
            )}
            <TextInput
              placeholder="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={COLORS.textSecondary}
            />
            <TextInput
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={COLORS.textSecondary}
            />
            <TextInput
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              style={styles.input}
              placeholderTextColor={COLORS.textSecondary}
            />
            <AnimatedPressable style={styles.primaryButton} onPress={handleChangePassword}>
              {isChangingPassword ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Update Password</Text>
              )}
            </AnimatedPressable>

            <AnimatedPressable style={styles.logoutButton} onPress={handleLogout} haptic="medium">
              <Text style={styles.logoutText}>Log Out</Text>
            </AnimatedPressable>
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,18,36,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: { width: 0, height: -4 } },
      android: { elevation: 12 },
    }),
  },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 8 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: COLORS.secondary, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  mobile: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  vehicle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  message: { fontSize: 13, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: COLORS.textPrimary,
  },
  primaryButton: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutButton: { marginTop: 16, backgroundColor: COLORS.error, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '700' },
});
