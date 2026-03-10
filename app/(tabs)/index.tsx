import { useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';
import { ProgressRing } from '@/components/ProgressRing';
import { QuickAction } from '@/components/QuickAction';
import { StatusChip } from '@/components/StatusChip';
import { apiRequest } from '@/lib/query-client';

interface CoverageData {
  insurer_name_ar?: string;
  insurer_name_en?: string;
  plan_name_ar?: string;
  plan_name_en?: string;
  status?: string;
  policy_number?: string;
  member_id?: string;
  end_date?: string;
  deductible_used?: number;
  deductible_total?: number;
  oop_used?: number;
  oop_max?: number;
}

interface ClaimsData {
  claims?: any[];
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t, toggleLanguage, language } = useLanguage();

  const { data: coverageData } = useQuery<CoverageData>({
    queryKey: ['/api/coverage', user?.memberId || 'MEM-2024-001'],
    enabled: isAuthenticated,
  });

  const { data: claimsData } = useQuery<ClaimsData>({
    queryKey: ['/api/claims'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/claims?memberId=${user?.memberId || 'MEM-2024-001'}`);
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: notifData } = useQuery({
    queryKey: ['/api/notifications/unread-count'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/notifications/unread-count');
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 60_000, // poll every minute
  });

  const unreadCount: number = notifData?.count ?? 0;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isLoading]);

  if (!isAuthenticated || !user) return null;

  const coverage = coverageData ? {
    insurerNameAr: coverageData.insurer_name_ar || '',
    insurerNameEn: coverageData.insurer_name_en || '',
    planNameAr: coverageData.plan_name_ar || '',
    planNameEn: coverageData.plan_name_en || '',
    status: coverageData.status || 'active',
    policyNumber: coverageData.policy_number || '',
    memberId: coverageData.member_id || '',
    endDate: coverageData.end_date || '',
    deductibleUsed: coverageData.deductible_used || 0,
    deductibleTotal: coverageData.deductible_total || 1,
    outOfPocketUsed: coverageData.oop_used || 0,
    outOfPocketMax: coverageData.oop_max || 1,
  } : null;

  const recentClaims = (claimsData?.claims || []).slice(0, 4).map((c: any) => ({
    id: c.claim_number || c.id,
    claimNumber: c.claim_number,
    status: c.status,
    serviceDate: c.service_date ? new Date(c.service_date).toISOString().split('T')[0] : '',
    providerNameAr: c.provider_name_ar || c.diagnosis_desc_ar || '',
    providerNameEn: c.provider_name_en || 'Provider',
    diagnosisAr: c.diagnosis_desc_ar || '',
    diagnosisEn: c.diagnosis_desc_en || '',
    amountClaimed: c.amount_claimed || 0,
    amountApproved: c.amount_approved || 0,
  }));

  const deductibleProgress = coverage ? coverage.deductibleUsed / coverage.deductibleTotal : 0;
  const oopProgress = coverage ? coverage.outOfPocketUsed / coverage.outOfPocketMax : 0;
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.midnightBlue, '#0f2240', '#0a1628']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopInset, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>
              {t(`\u0645\u0631\u062d\u0628\u0627\u064b\u060c ${user.nameAr}`, `Welcome, ${user.nameEn}`)}
            </Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={toggleLanguage} style={styles.headerIcon}>
              <Ionicons name="globe-outline" size={20} color={Colors.textSecondary} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/notifications');
              }}
              style={styles.headerIcon}
            >
              <Ionicons name="notifications-outline" size={20} color={Colors.textSecondary} />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : String(unreadCount)}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/ai-assistant'); }} style={styles.headerIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={Colors.signalTeal} />
            </Pressable>
            <Pressable onPress={() => router.push('/profile')} style={styles.headerIcon}>
              <Ionicons name="person-circle-outline" size={22} color={Colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {coverage ? (
        <GlassCard variant="elevated" style={styles.coverageCard}>
          <View style={styles.coverageHeader}>
            <View style={styles.coverageInfo}>
              <Text style={styles.insurerName}>{t(coverage.insurerNameAr, coverage.insurerNameEn)}</Text>
              <Text style={styles.planName}>{t(coverage.planNameAr, coverage.planNameEn)}</Text>
              <StatusChip status={coverage.status} />
            </View>
            <ProgressRing
              progress={deductibleProgress}
              size={72}
              value={`${Math.round(deductibleProgress * 100)}%`}
              label={t('\u0645\u062e\u0635\u0648\u0645', 'Deductible')}
              color={deductibleProgress > 0.8 ? Colors.warning : Colors.signalTeal}
            />
          </View>
          <View style={styles.coverageDetails}>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageLabel}>{t('\u0631\u0642\u0645 \u0627\u0644\u0648\u062b\u064a\u0642\u0629', 'Policy')}</Text>
              <Text style={styles.coverageValue}>{coverage.policyNumber}</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageLabel}>{t('\u0627\u0644\u0639\u0636\u0648\u064a\u0629', 'Member ID')}</Text>
              <Text style={styles.coverageValue}>{coverage.memberId}</Text>
            </View>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageLabel}>{t('\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629', 'Valid Until')}</Text>
              <Text style={styles.coverageValue}>{coverage.endDate ? new Date(coverage.endDate).toLocaleDateString() : ''}</Text>
            </View>
          </View>
          <View style={styles.oopRow}>
            <Text style={styles.oopLabel}>{t('\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 \u0645\u0646 \u0627\u0644\u062c\u064a\u0628', 'Out-of-Pocket Max')}</Text>
            <Text style={styles.oopValue}>{coverage.outOfPocketUsed.toLocaleString()} / {coverage.outOfPocketMax.toLocaleString()} SAR</Text>
          </View>
          <View style={styles.oopBar}>
            <View style={[styles.oopFill, { width: `${Math.round(oopProgress * 100)}%` }]} />
          </View>
        </GlassCard>
        ) : (
        <GlassCard variant="elevated" style={styles.coverageCard}>
          <ActivityIndicator color={Colors.signalTeal} />
          <Text style={[styles.planName, { textAlign: 'center', marginTop: 8 }]}>{t('جاري التحميل...', 'Loading coverage...')}</Text>
        </GlassCard>
        )}

        <Text style={styles.sectionTitle}>{t('\u0625\u062c\u0631\u0627\u0621\u0627\u062a \u0633\u0631\u064a\u0639\u0629', 'Quick Actions')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActions}>
          <QuickAction icon="shield-checkmark-outline" label={t('\u0641\u062d\u0635 \u0627\u0644\u0623\u0647\u0644\u064a\u0629', 'Check Eligibility')} onPress={() => router.push('/(tabs)/eligibility')} />
          <QuickAction icon="add-circle-outline" label={t('\u0645\u0637\u0627\u0644\u0628\u0629 \u062c\u062f\u064a\u062f\u0629', 'New Claim')} onPress={() => router.push('/claims/new')} color={Colors.medicalBlue} />
          <QuickAction icon="clipboard-outline" label={t('\u062a\u0641\u0648\u064a\u0636 \u0645\u0633\u0628\u0642', 'Prior Auth')} onPress={() => router.push('/prior-auth')} color={Colors.deepOrange} />
          <QuickAction icon="star-outline" label={t('\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a\u064a', 'My Benefits')} onPress={() => router.push('/(tabs)/wallet')} color={Colors.success} />
          <QuickAction icon="chatbubble-ellipses-outline" label={t('\u0645\u0633\u0627\u0639\u062f \u0630\u0643\u064a', 'AI Assistant')} onPress={() => router.push('/ai-assistant')} color={Colors.signalTeal} />
          <QuickAction icon="business-outline" label={t('\u0628\u0648\u0627\u0628\u0627\u062a', 'Portals')} onPress={() => router.push('/(tabs)/portals')} color={Colors.medicalBlue} />
        </ScrollView>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0646\u0634\u0627\u0637 \u0627\u0644\u0623\u062e\u064a\u0631', 'Recent Activity')}</Text>
        {recentClaims.map(claim => (
          <Pressable
            key={claim.id}
            onPress={() => router.push({ pathname: '/claims/[id]', params: { id: claim.id } })}
          >
            <GlassCard variant="surface" style={styles.claimCard} padding={14}>
              <View style={styles.claimRow}>
                <View style={styles.claimInfo}>
                  <Text style={styles.claimProvider}>{t(claim.providerNameAr, claim.providerNameEn)}</Text>
                  <Text style={styles.claimDiagnosis}>{t(claim.diagnosisAr, claim.diagnosisEn)}</Text>
                  <Text style={styles.claimDate}>{claim.serviceDate}</Text>
                </View>
                <View style={styles.claimRight}>
                  <StatusChip status={claim.status} />
                  <Text style={styles.claimAmount}>{claim.amountClaimed.toLocaleString()} SAR</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <GlassCard variant="elevated" style={styles.aiCard}>
          <View style={styles.aiRow}>
            <View style={styles.aiIconWrap}>
              <Ionicons name="sparkles" size={24} color={Colors.signalTeal} />
            </View>
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>{t('\u0645\u0633\u0627\u0639\u062f \u0628\u0633\u0645\u0629 \u0627\u0644\u0630\u0643\u064a', 'Basma AI Assistant')}</Text>
              <Text style={styles.aiSubtitle}>
                {t('\u0627\u0633\u0623\u0644 \u0639\u0646 \u062a\u0623\u0645\u064a\u0646\u0643 \u0648\u0645\u0637\u0627\u0644\u0628\u0627\u062a\u0643', 'Ask about your insurance & claims')}
              </Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/ai-assistant'); }}
              style={styles.aiButton}
            >
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </Pressable>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  scrollContent: { paddingHorizontal: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: { flex: 1 },
  greeting: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.deepOrange ?? '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
    lineHeight: 12,
  },
  coverageCard: { marginBottom: 24 },
  coverageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  coverageInfo: { flex: 1, gap: 4 },
  insurerName: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  planName: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.signalTeal,
    marginBottom: 4,
  },
  coverageDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  coverageItem: { gap: 2 },
  coverageLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  coverageValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  oopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  oopLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  oopValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  oopBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  oopFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.signalTeal,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  quickActions: {
    gap: 12,
    paddingRight: 16,
    marginBottom: 24,
  },
  claimCard: { marginBottom: 8 },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  claimInfo: { flex: 1, gap: 2 },
  claimProvider: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  claimDiagnosis: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  claimDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
  },
  claimRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  claimAmount: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  aiCard: { marginTop: 16 },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: { flex: 1 },
  aiTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  aiSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  aiButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.signalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
