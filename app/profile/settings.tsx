import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, toggleLanguage } = useLanguage();
  const { user } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('الإعدادات', 'Settings')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('الحسابات المرتبطة', 'Linked Accounts')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="logo-github" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>GitHub</Text>
                <Text style={styles.settingValue}>
                  {user?.githubConnected
                    ? t('متصل', 'Connected')
                    : t('غير متصل', 'Not connected')}
                </Text>
              </View>
            </View>
            <View style={[styles.statusDot, user?.githubConnected ? styles.statusConnected : styles.statusDisconnected]} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="card-outline" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>Stripe</Text>
                <Text style={styles.settingValue}>{t('الدفع الإلكتروني', 'Online Payments')}</Text>
              </View>
            </View>
            <View style={[styles.statusDot, styles.statusConnected]} />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('اللغة والوصول', 'Language & Accessibility')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>{t('اللغة', 'Language')}</Text>
                <Text style={styles.settingValue}>{language === 'ar' ? 'العربية' : 'English'}</Text>
              </View>
            </View>
            <Pressable onPress={toggleLanguage} style={styles.langToggle}>
              <Text style={styles.langToggleText}>{language === 'ar' ? 'EN' : 'عر'}</Text>
            </Pressable>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('طرق الدفع', 'Payment Methods')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="card" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>{t('بطاقة الائتمان/الخصم', 'Credit/Debit Card')}</Text>
                <Text style={styles.settingValue}>{t('عبر Stripe', 'Via Stripe')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="phone-portrait-outline" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>Apple Pay / mada</Text>
                <Text style={styles.settingValue}>{t('قريباً', 'Coming Soon')}</Text>
              </View>
            </View>
            <View style={[styles.statusDot, styles.statusDisconnected]} />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('الأمان', 'Security')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('المصادقة البيومترية', 'Biometric Auth')}</Text>
            </View>
            <Switch
              value={false}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.signalTeal }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('رمز PIN', 'PIN Code')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('الإشعارات', 'Notifications')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('تحديثات المطالبات', 'Claim Updates')}</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.signalTeal }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="cash-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('تأكيدات الدفع', 'Payment Confirmations')}</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.signalTeal }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.settingDivider} />
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="clipboard-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('قرارات التفويض', 'Auth Decisions')}</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.signalTeal }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('الخصوصية', 'Privacy')}</Text>
        <GlassCard style={styles.settingsCard}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('سجل المراجعة', 'Audit Log')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </Pressable>
          <View style={styles.settingDivider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('تصدير البيانات', 'Export Data')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </Pressable>
        </GlassCard>
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
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  settingsCard: { marginBottom: 4 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  settingDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 14,
    marginLeft: 32,
  },
  langToggle: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
  },
  langToggleText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusConnected: {
    backgroundColor: '#22c55e',
  },
  statusDisconnected: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
