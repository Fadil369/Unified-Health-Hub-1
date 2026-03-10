import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { BenefitBar } from '@/components/BenefitBar';
import { StatusChip } from '@/components/StatusChip';
import { apiRequest } from '@/lib/query-client';

interface BenefitItem {
  id: string;
  nameAr: string;
  nameEn: string;
  used: number;
  total: number;
  icon: string;
}

interface CoverageData {
  insurer_name_ar?: string;
  insurer_name_en?: string;
  plan_name_ar?: string;
  plan_name_en?: string;
  status?: string;
  policy_number?: string;
  member_id?: string;
  start_date?: string;
  end_date?: string;
  network_tier?: string;
  copay_percentage?: number;
  deductible_used?: number;
  deductible_total?: number;
  oop_used?: number;
  oop_max?: number;
  benefits?: BenefitItem[];
}

interface EligibilityResult {
  eligible: boolean;
  member_id: string;
  plan: string;
  benefits: string[];
  coverage: {
    deductibleRemaining: number | null;
    copay: number | null;
    network: string;
    oopRemaining: number | null;
  };
  notes: string;
  source: string;
  response_time_ms: number;
}

export default function EligibilityScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [searchId, setSearchId] = useState(user?.memberId || 'MEM-2024-001');
  const [isChecking, setIsChecking] = useState(false);
  const [eligResult, setEligResult] = useState<EligibilityResult | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data: coverageData } = useQuery<CoverageData>({
    queryKey: ['/api/coverage', user?.memberId || 'MEM-2024-001'],
  });

  const handleCheck = useCallback(async () => {
    if (!searchId.trim()) return;
    setIsChecking(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest('POST', '/api/eligibility/check', { memberId: searchId.trim() });
      const data: EligibilityResult = await res.json();
      setEligResult(data);
      Haptics.notificationAsync(
        data.eligible
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch {
      setEligResult(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    setIsChecking(false);
  }, [searchId]);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const benefits = coverageData?.benefits || [];

  const sections = [
    { key: 'medical', titleAr: '\u0637\u0628\u064a', titleEn: 'Medical', icon: 'medkit', copay: `${coverageData?.copay_percentage || 20}%`, preAuth: t('\u0645\u0637\u0644\u0648\u0628 \u0644\u0644\u062c\u0631\u0627\u062d\u0629', 'Required for surgery') },
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

        {eligResult && (
          <>
            <View style={styles.responseTimeRow}>
              <Ionicons name="timer-outline" size={14} color={eligResult.response_time_ms < 500 ? Colors.signalTeal : Colors.deepOrange} />
              <Text style={[styles.responseTimeText, { color: eligResult.response_time_ms < 500 ? Colors.signalTeal : Colors.deepOrange }]}>
                {eligResult.response_time_ms}ms {eligResult.response_time_ms < 500 ? '\u2713' : '\u26A0'} ({eligResult.source})
              </Text>
            </View>

            <GlassCard variant="elevated" style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View>
                  <Text style={styles.resultTitle}>{eligResult.plan}</Text>
                  <Text style={styles.resultSubtitle}>{eligResult.notes}</Text>
                </View>
                <StatusChip status={eligResult.eligible ? 'active' : 'expired'} />
              </View>
              <View style={styles.resultGrid}>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0634\u0628\u0643\u0629', 'Network')}</Text>
                  <Text style={styles.gridValue}>{eligResult.coverage.network}</Text>
                </View>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0629', 'Copay')}</Text>
                  <Text style={styles.gridValue}>{eligResult.coverage.copay ? `${Math.round(eligResult.coverage.copay * 100)}%` : '—'}</Text>
                </View>
                <View style={styles.resultGridItem}>
                  <Text style={styles.gridLabel}>{t('\u0627\u0644\u0645\u062e\u0635\u0648\u0645 \u0627\u0644\u0645\u062a\u0628\u0642\u064a', 'Deductible Left')}</Text>
                  <Text style={styles.gridValue}>{eligResult.coverage.deductibleRemaining?.toLocaleString() || '—'} SAR</Text>
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
              {benefits.map((benefit: BenefitItem, i: number) => (
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
