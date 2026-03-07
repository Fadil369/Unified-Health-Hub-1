import { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform, Alert,
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
  const { login, loginWithGitHub, register } = useAuth();
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGitHubLoading, setIsGitHubLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleLogin = async () => {
    setError('');
    if (!email || email.length < 3) {
      setError(t('البريد الإلكتروني مطلوب', 'Email is required'));
      return;
    }
    if (password.length < 4) {
      setError(t('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'Password must be at least 4 characters'));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await login(email, password);
    setIsLoading(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('فشل تسجيل الدخول', 'Invalid email or password'));
    }
  };

  const handleRegister = async () => {
    setError('');
    if (!email || !email.includes('@')) {
      setError(t('بريد إلكتروني صالح مطلوب', 'Valid email required'));
      return;
    }
    if (password.length < 4) {
      setError(t('كلمة المرور يجب أن تكون 4 أحرف على الأقل', 'Password must be at least 4 characters'));
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await register({ email, password, nameEn: nameEn || undefined });
    setIsLoading(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('فشل إنشاء الحساب', 'Registration failed. Email may already be in use.'));
    }
  };

  const handleGitHubLogin = async () => {
    setError('');
    setIsGitHubLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await loginWithGitHub();
    setIsGitHubLoading(false);

    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(t('فشل تسجيل الدخول عبر GitHub', 'GitHub login failed'));
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
              <Text style={styles.langText}>{language === 'en' ? 'عربي' : 'English'}</Text>
            </Pressable>
          </View>

          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <Ionicons name="pulse" size={36} color={Colors.signalTeal} />
            </View>
            <Text style={styles.brandName}>BrainSAIT</Text>
            <Text style={styles.brandSubtitle}>
              {t('منصة الرعاية الصحية الموحدة', 'Unified Healthcare Platform')}
            </Text>
          </View>

          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>
              {mode === 'login'
                ? t('تسجيل الدخول', 'Sign In')
                : t('إنشاء حساب', 'Create Account')}
            </Text>

            <Pressable
              style={[styles.githubButton, isGitHubLoading && styles.loginDisabled]}
              onPress={handleGitHubLogin}
              disabled={isGitHubLoading}
            >
              {isGitHubLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-github" size={20} color="#fff" />
                  <Text style={styles.githubText}>
                    {t('تسجيل الدخول عبر GitHub', 'Sign in with GitHub')}
                  </Text>
                </>
              )}
            </Pressable>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('أو', 'or')}</Text>
              <View style={styles.dividerLine} />
            </View>

            {mode === 'register' && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={18} color={Colors.professionalGray} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  placeholder={t('الاسم الكامل', 'Full Name')}
                  placeholderTextColor={Colors.professionalGray}
                  value={nameEn}
                  onChangeText={setNameEn}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={18} color={Colors.professionalGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.rtlInput]}
                placeholder={t('البريد الإلكتروني', 'Email')}
                placeholderTextColor={Colors.professionalGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.professionalGray} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, isRTL && styles.rtlInput]}
                placeholder={t('كلمة المرور', 'Password')}
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
              onPress={mode === 'login' ? handleLogin : handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginText}>
                  {mode === 'login'
                    ? t('دخول', 'Sign In')
                    : t('إنشاء حساب', 'Create Account')}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.switchMode}
              onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            >
              <Text style={styles.switchText}>
                {mode === 'login'
                  ? t('ليس لديك حساب؟ إنشاء حساب جديد', "Don't have an account? Create one")
                  : t('لديك حساب بالفعل؟ تسجيل الدخول', 'Already have an account? Sign in')}
              </Text>
            </Pressable>
          </GlassCard>

          <Text style={styles.footer}>
            {t('متوافق مع NPHIES · رؤية 2030', 'NPHIES Compliant · Vision 2030')}
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
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#24292e',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  githubText: {
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
  switchMode: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.signalTeal,
  },
  footer: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
