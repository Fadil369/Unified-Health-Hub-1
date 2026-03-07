import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';
import { BenefitBar } from '@/components/BenefitBar';
import { StatusChip } from '@/components/StatusChip';
import { mockCoverage, mockBenefits } from '@/lib/mock-data';

export default function EligibilityScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [searchId, setSearchId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [responseTime, setResponseTime] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const handleCheck = useCallback(async () => {
    if (!searchId.trim()) return;
    setIsChecking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const start = Date.now();
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));
    setResponseTime(Date.now() - start);
    setHasResult(true);
    setIsChecking(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [searchId]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const coverage = mockCoverage;
  const benefits = mockBenefits;

  const sections = [
    { key: 'medical', titleAr: '\u0637\u0628\u064a', titleEn: 'Medical', icon: 'medkit', copay: '20%', preAuth: t('\u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u062c\u0631\u0627\u062d\u0629', 'Required for surgery') },
    { key: 'dental', titleAr: '\u0623\u0633\u0646\u0627\u0646', titleEn: 'Dental', icon: 'body', copay: '30%', preAuth: t('\u063a\u064a\u0631 \u0645\u0637\u0644\u0648\u0628', 'Not required') },
    { key: 'vision', titleAr: '\u0628\u0635\u0631\u064a\u0627\u062a', titleEn: 'Vision', icon: 'eye', copay: '25%', preAuth: t('\u063a\u064a\u0631 \u0645\u0637\u0644\u0648\u0628', 'Not required') },
    { key: 'pharmacy', titleAr: '\u0635\u064a\u062f\u0644\u0629', titleEn: 'Pharmacy', icon: 'flask', copay: '15%', preAuth: t('\u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u0623\u062f\u0648\u064a\u0629 \u0627\u0644\u0645\u062a\u062e\u0635\u0635\u0629', 'Required for specialty drugs') },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopInset, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.screenTitle}>{t('\u0641\u062d\u0635 \u0627\u0644\u0623\u0647\u0644\u064a\u0629', 'Eligibility Check')}</Text>

        <GlassCard style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={Colors.professionalGray} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('\u0631\u0642\u0645 \u0627\u0644\u0639\u0636\u0648\u064a\u0629 \u0623\u0648 \u0627\u0644\u0647\u0648\u064a\u0629', 'Member ID or National ID')}
              placeholderTextColor={Colors.professionalGray}
              value={searchId}
              onChangeText={setSearchId}
              autoCapitalize="none"
            />
          </View>
          <Pressable
            style={({ pressed }) => [styles.checkButton, pressed && styles.checkPressed, isChecking && styles.checkDisabled]}
            onPress={handleCheck}
            disabled={isChecking}
          >
            <Ionicons name={isChecking ? 'hourglass' : 'shield-checkmark'} size={18} color="#fff" />
            <Text style={styles.checkText}>
              {isChecking ? t('\u062c\u0627\u0631\u064a \u0627\u0644\u0641\u062d\u0635...', 'Checking...') : t('\u0641\u062d\u0635 \u0627\u0644\u0623\u0647\u0644\u064a\u0629', 'Check Eligibility')}
            </Text>
          </Pressable>
        </GlassCard>

        {hasResult && (
          <>
            <View style={styles.responseTimeRow}>
              <Ionicons name="timer-outline" size={14} color={responseTime < 900 ? Colors.signalTeal : Colors.deepOrange} />
              <Text style={[styles.responseTimeText, { color: responseTime < 900 ? Colors.signalTeal : Colors.deepOrange }]}>
                {responseTime}ms {responseTime < 900 ? '\u2713' : '\u26A0'}
              </Text>
            </View>

            <GlassCard variant="elevated" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultTitle}>{t(coverage.insurerNameAr, coverage.insurerNameEn)}</Text>
                  <Text style={styles.resultSubtitle}>{t(coverage.planNameAr, coverage.planNameEn)}</Text>
                </View>
                <StatusChip status="active" />
              </View>
              <View style={styles.resultGrid}>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0634\u0628\u0643\u0629', 'Network')}</Text>
                  <Text style={styles.gridValue}>{coverage.networkTier}</Text>
                </View>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629', 'Copay')}</Text>
                  <Text style={styles.gridValue}>{coverage.copayPercentage}%</Text>
                </View>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0645\u062e\u0635\u0648\u0645', 'Deductible')}</Text>
                  <Text style={styles.gridValue}>{coverage.deductibleUsed}/{coverage.deductibleTotal}</Text>
                </View>
              </View>
            </GlassCard>

            <Text style={styles.sectionTitle}>{t('\u062a\u063a\u0637\u064a\u0629 \u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a', 'Coverage Breakdown')}</Text>
            {sections.map(section => (
              <Pressable key={section.key} onPress={() => toggleSection(section.key)}>
                <GlassCard variant="surface" style={styles.accordionCard} padding={14}>
                  <View style={styles.accordionHeader}>
                    <View style={styles.accordionLeft}>
                      <Ionicons name={section.icon as any} size={18} color={Colors.signalTeal} />
                      <Text style={styles.accordionTitle}>{t(section.titleAr, section.titleEn)}</Text>
                    </View>
                    <Ionicons
                      name={expandedSection === section.key ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={Colors.textSecondary}
                    />
                  </View>
                  {expandedSection === section.key && (
                    <View style={styles.accordionContent}>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629', 'Copay')}</Text>
                        <Text style={styles.accordionValue}>{section.copay}</Text>
                      </View>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('\u062a\u0641\u0648\u064a\u0636 \u0645\u0633\u0628\u0642', 'Pre-Auth')}</Text>
                        <Text style={styles.accordionValue}>{section.preAuth}</Text>
                      </View>
                      <View style={styles.accordionRow}>
                        <Text style={styles.accordionLabel}>{t('\u0627\u0644\u0634\u0628\u0643\u0629', 'In-Network')}</Text>
                        <Text style={[styles.accordionValue, { color: Colors.success }]}>{t('\u0645\u063a\u0637\u0649', 'Covered')}</Text>
                      </View>
                    </View>
                  )}
                </GlassCard>
              </Pressable>
            ))}

            <Text style={styles.sectionTitle}>{t('\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a', 'Benefit Utilization')}</Text>
            <GlassCard style={styles.benefitsCard}>
              {benefits.map((benefit, i) => (
                <View key={benefit.id}>
                  <BenefitBar
                    nameAr={benefit.nameAr}
                    nameEn={benefit.nameEn}
                    used={benefit.used}
                    total={benefit.total}
                    icon={benefit.icon}
                  />
                  {i < benefits.length - 1 && <View style={styles.benefitDivider} />}
                </View>
              ))}
            </GlassCard>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  scrollContent: { paddingHorizontal: 16 },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  searchCard: { marginBottom: 16 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingLeft: 10,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.signalTeal,
    paddingVertical: 14,
    borderRadius: 12,
  },
  checkPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  checkDisabled: { opacity: 0.6 },
  checkText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  responseTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    alignSelf: 'flex-end',
  },
  responseTimeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  resultCard: { marginBottom: 20 },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.signalTeal,
  },
  resultGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultGridItem: { alignItems: 'center', gap: 2 },
  gridLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  gridValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  accordionCard: { marginBottom: 8 },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accordionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accordionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  accordionContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 8,
  },
  accordionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accordionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  accordionValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  benefitsCard: { marginBottom: 16 },
  benefitDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
});
