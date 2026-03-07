import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (username.length < 3) {
      setError(t('\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 3 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644', 'Username must be at least 3 characters'));
      return;
    }
    if (password.length < 4) {
      setError(t('\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 4 \u0623\u062d\u0631\u0641 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644', 'Password must be at least 4 characters'));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await login(username, password);
    setIsLoading(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('\u0641\u0634\u0644 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', 'Login failed'));
    }
  };

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <LinearGradient
      colors={[Colors.midnightBlue, '#0f2240', '#0a1628']}
      style={styles.gradient}
    >
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 + webTopInset, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.langToggle}>
            <Pressable onPress={toggleLanguage} style={styles.langButton}>
              <Ionicons name="globe-outline" size={18} color={Colors.signalTeal} />
              <Text style={styles.langText}>{language === 'en' ? '\u0639\u0631\u0628\u064a' : 'English'}</Text>
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="pulse" size={36} color={Colors.signalTeal} />
            </View>
            <Text style={styles.brandName}>BrainSAIT</Text>
            <Text style={styles.brandSubtitle}>
              {t('\u0645\u0646\u0635\u0629 \u0627\u0644\u0631\u0639\u0627\u064a\u0629 \u0627\u0644\u0635\u062d\u064a\u0629 \u0627\u0644\u0645\u0648\u062d\u062f\u0629', 'Unified Healthcare Platform')}
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>
              {t('\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', 'Sign In')}
            </Text>

            <Pressable style={styles.absherButton}>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.absherText}>
                {t('\u062f\u062e\u0648\u0644 \u0639\u0628\u0631 \u0623\u0628\u0634\u0631', 'Sign in with Absher')}
              </Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('\u0623\u0648', 'or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={18} color={Colors.professionalGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.rtlInput]}
                placeholder={t('\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645', 'Username')}
                placeholderTextColor={Colors.professionalGray}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.professionalGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.rtlInput]}
                placeholder={t('\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631', 'Password')}
                placeholderTextColor={Colors.professionalGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.professionalGray} />
              </Pressable>
            </View>

            {!!error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [styles.loginButton, pressed && styles.loginPressed, isLoading && styles.loginDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginText}>{t('\u062f\u062e\u0648\u0644', 'Sign In')}</Text>
              )}
            </Pressable>
          </GlassCard>

          <Text style={styles.footer}>
            {t('\u0645\u062a\u0648\u0627\u0641\u0642 \u0645\u0639 NPHIES \u00b7 \u0631\u0624\u064a\u0629 2030', 'NPHIES Compliant \u00b7 Vision 2030')}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  langToggle: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.2)',
  },
  langText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.signalTeal,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandName: {
    fontSize: 32,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  absherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.signalTeal,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  absherText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  rtlInput: {
    textAlign: 'right',
  },
  eyeButton: {
    padding: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.error,
    flex: 1,
  },
  loginButton: {
    backgroundColor: Colors.medicalBlue,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  loginPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  loginDisabled: {
    opacity: 0.6,
  },
  loginText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
