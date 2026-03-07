import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/(auth)/login');
  };

  const menuItems = [
    { icon: 'shield-checkmark-outline', label: t('\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062a\u063a\u0637\u064a\u0629', 'Coverage Details'), route: '/(tabs)/wallet' },
    { icon: 'card-outline', label: t('\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a', 'Benefits'), route: '/(tabs)/wallet' },
    { icon: 'settings-outline', label: t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', 'Settings'), route: '/profile/settings' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062e\u0635\u064a', 'Profile')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.signalTeal} />
          </View>
          <Text style={styles.userName}>{user?.nameEn || 'User'}</Text>
          <Text style={styles.userNameAr}>{user?.nameAr || ''}</Text>
          <Text style={styles.memberId}>{user?.memberId}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0627\u0644\u0634\u062e\u0635\u064a\u0629', 'Personal Information')}</Text>
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="card-outline" size={16} color={Colors.signalTeal} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('\u0627\u0644\u0647\u0648\u064a\u0629 \u0627\u0644\u0648\u0637\u0646\u064a\u0629', 'National ID')}</Text>
              <Text style={styles.infoValue}>{user?.nationalId}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="mail-outline" size={16} color={Colors.signalTeal} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a', 'Email')}</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="call-outline" size={16} color={Colors.signalTeal} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{t('\u0627\u0644\u0647\u0627\u062a\u0641', 'Phone')}</Text>
              <Text style={styles.infoValue}>{user?.phone}</Text>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0642\u0627\u0626\u0645\u0629', 'Menu')}</Text>
        {menuItems.map((item, i) => (
          <Pressable key={i} onPress={() => router.push(item.route as any)}>
            <GlassCard variant="surface" style={styles.menuCard} padding={14}>
              <View style={styles.menuRow}>
                <Ionicons name={item.icon as any} size={20} color={Colors.signalTeal} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>{t('\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c', 'Sign Out')}</Text>
        </Pressable>

        <Text style={styles.version}>BrainSAIT v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  scrollContent: { paddingHorizontal: 16 },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  userNameAr: {
    fontSize: 16,
    fontFamily: 'IBMPlexSansArabic_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberId: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.signalTeal,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  infoCard: { marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
    marginLeft: 44,
  },
  menuCard: { marginBottom: 8 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    textAlign: 'center',
    marginTop: 20,
  },
});
