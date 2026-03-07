import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language, toggleLanguage } = useLanguage();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', 'Settings')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0644\u063a\u0629 \u0648\u0627\u0644\u0648\u0635\u0648\u0644', 'Language & Accessibility')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="globe-outline" size={20} color={Colors.signalTeal} />
              <View>
                <Text style={styles.settingLabel}>{t('\u0627\u0644\u0644\u063a\u0629', 'Language')}</Text>
                <Text style={styles.settingValue}>{language === 'ar' ? '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' : 'English'}</Text>
              </View>
            </View>
            <Pressable onPress={toggleLanguage} style={styles.langToggle}>
              <Text style={styles.langToggleText}>{language === 'ar' ? 'EN' : '\u0639\u0631'}</Text>
            </Pressable>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0623\u0645\u0627\u0646', 'Security')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('\u0627\u0644\u0645\u0635\u0627\u062f\u0642\u0629 \u0627\u0644\u0628\u064a\u0648\u0645\u062a\u0631\u064a\u0629', 'Biometric Auth')}</Text>
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
              <Text style={styles.settingLabel}>{t('\u0631\u0645\u0632 PIN', 'PIN Code')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062a', 'Notifications')}</Text>
        <GlassCard style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('\u062a\u062d\u062f\u064a\u062b\u0627\u062a \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0627\u062a', 'Claim Updates')}</Text>
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
              <Text style={styles.settingLabel}>{t('\u0642\u0631\u0627\u0631\u0627\u062a \u0627\u0644\u062a\u0641\u0648\u064a\u0636', 'Auth Decisions')}</Text>
            </View>
            <Switch
              value={true}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: Colors.signalTeal }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629', 'Privacy')}</Text>
        <GlassCard style={styles.settingsCard}>
          <Pressable style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('\u0633\u062c\u0644 \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', 'Audit Log')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
          </Pressable>
          <View style={styles.settingDivider} />
          <Pressable style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="download-outline" size={20} color={Colors.signalTeal} />
              <Text style={styles.settingLabel}>{t('\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a', 'Export Data')}</Text>
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
});
