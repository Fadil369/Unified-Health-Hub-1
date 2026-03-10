import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { BenefitBar } from '@/components/BenefitBar';
import { ProgressRing } from '@/components/ProgressRing';
import { StatusChip } from '@/components/StatusChip';

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

interface PaymentSummary {
  totalPaid?: number;
  totalClaims?: number;
  pendingCount?: number;
}

interface PaymentItem {
  id: string;
  claim_number?: string;
  amount?: string;
  status: string;
}

interface PaymentData {
  payments?: PaymentItem[];
  summary?: PaymentSummary;
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data: coverageData, isLoading } = useQuery<CoverageData>({
    queryKey: ['/api/coverage', user?.memberId || 'MEM-2024-001'],
  });

  const { data: paymentData } = useQuery<PaymentData>({
    queryKey: ['/api/payments/history'],
  });

  const coverage = coverageData ? {
    insurerNameAr: coverageData.insurer_name_ar || '',
    insurerNameEn: coverageData.insurer_name_en || '',
    planNameAr: coverageData.plan_name_ar || '',
    planNameEn: coverageData.plan_name_en || '',
    status: coverageData.status || 'active',
    policyNumber: coverageData.policy_number || '',
    memberId: coverageData.member_id || '',
    startDate: coverageData.start_date ? new Date(coverageData.start_date).toLocaleDateString() : '',
    endDate: coverageData.end_date ? new Date(coverageData.end_date).toLocaleDateString() : '',
    networkTier: coverageData.network_tier || 'Tier 1',
    copayPercentage: coverageData.copay_percentage || 20,
    deductibleUsed: coverageData.deductible_used || 0,
    deductibleTotal: coverageData.deductible_total || 1,
    outOfPocketUsed: coverageData.oop_used || 0,
    outOfPocketMax: coverageData.oop_max || 1,
  } : null;

  const benefits = coverageData?.benefits || [
    { id: 'ben-001', nameAr: 'طبي', nameEn: 'Medical', used: 0, total: 50000, icon: 'medkit' },
    { id: 'ben-002', nameAr: 'أسنان', nameEn: 'Dental', used: 0, total: 5000, icon: 'body' },
    { id: 'ben-003', nameAr: 'بصريات', nameEn: 'Vision', used: 0, total: 2000, icon: 'eye' },
    { id: 'ben-004', nameAr: 'صيدلة', nameEn: 'Pharmacy', used: 0, total: 10000, icon: 'flask' },
  ];

  const documents = [
    { id: 'doc-001', nameAr: 'نتائج فحص الدم', nameEn: 'Blood Test Results', category: 'lab', date: '2024-10-15', verified: true },
    { id: 'doc-002', nameAr: 'أشعة سينية للصدر', nameEn: 'Chest X-Ray', category: 'imaging', date: '2024-09-20', verified: true },
    { id: 'doc-003', nameAr: 'وصفة طبية', nameEn: 'Prescription', category: 'prescription', date: '2024-11-02', verified: false },
    { id: 'doc-004', nameAr: 'خطاب إحالة', nameEn: 'Referral Letter', category: 'referral', date: '2024-11-10', verified: true },
  ];

  const totalUsed = benefits.reduce((sum: number, b: any) => sum + b.used, 0);
  const totalMax = benefits.reduce((sum: number, b: any) => sum + b.total, 0);

  const categoryIcons: Record<string, string> = {
    lab: 'flask',
    imaging: 'scan',
    prescription: 'medical',
    referral: 'document-text',
  };

  if (isLoading || !coverage) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.signalTeal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopInset, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.screenTitle}>{t('المحفظة الصحية', 'Health Wallet')}</Text>

        <Pressable onPress={() => setIsFlipped(!isFlipped)}>
          <GlassCard variant="elevated" style={styles.insuranceCard}>
            {!isFlipped ? (
              <View>
                <View style={styles.cardTopRow}>
                  <View style={styles.cardBrand}>
                    <Ionicons name="shield-checkmark" size={20} color={Colors.signalTeal} />
                    <Text style={styles.cardBrandText}>{t(coverage.insurerNameAr, coverage.insurerNameEn)}</Text>
                  </View>
                  <Text style={styles.cardType}>{t(coverage.planNameAr, coverage.planNameEn)}</Text>
                </View>
                <View style={styles.cardMemberInfo}>
                  <Text style={styles.cardMemberName}>{user?.nameEn || 'Member'}</Text>
                  <Text style={styles.cardMemberId}>{coverage.memberId}</Text>
                </View>
                <View style={styles.cardBottomRow}>
                  <View>
                    <Text style={styles.cardLabel}>{t('رقم الوثيقة', 'Policy')}</Text>
                    <Text style={styles.cardFieldValue}>{coverage.policyNumber}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>{t('الصلاحية', 'Valid')}</Text>
                    <Text style={styles.cardFieldValue}>{coverage.startDate} - {coverage.endDate}</Text>
                  </View>
                </View>
                <Text style={styles.flipHint}>{t('انقر للقلب', 'Tap to flip')}</Text>
              </View>
            ) : (
              <View>
                <View style={styles.qrSection}>
                  <View style={styles.qrPlaceholder}>
                    <Ionicons name="qr-code" size={64} color={Colors.signalTeal} />
                  </View>
                </View>
                <View style={styles.backDetails}>
                  <View style={styles.backRow}>
                    <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.backText}>920012345</Text>
                  </View>
                  <View style={styles.backRow}>
                    <Ionicons name="globe-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.backText}>www.brainsait.com</Text>
                  </View>
                  <View style={styles.backRow}>
                    <Ionicons name="business-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.backText}>{t('الشبكة', 'Network')}: {coverage.networkTier}</Text>
                  </View>
                </View>
                <Text style={styles.flipHint}>{t('انقر للقلب', 'Tap to flip')}</Text>
              </View>
            )}
          </GlassCard>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('ملخص الإنفاق', 'Spending Summary')}</Text>
        <GlassCard style={styles.spendingCard}>
          <View style={styles.spendingRow}>
            <ProgressRing
              progress={totalMax > 0 ? totalUsed / totalMax : 0}
              size={90}
              strokeWidth={8}
              value={`${totalMax > 0 ? Math.round((totalUsed / totalMax) * 100) : 0}%`}
              label={t('مستخدم', 'Used')}
            />
            <View style={styles.spendingInfo}>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('المستخدم', 'Used')}</Text>
                <Text style={styles.spendingValue}>{totalUsed.toLocaleString()} SAR</Text>
              </View>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('المتبقي', 'Remaining')}</Text>
                <Text style={[styles.spendingValue, { color: Colors.success }]}>
                  {(totalMax - totalUsed).toLocaleString()} SAR
                </Text>
              </View>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('الإجمالي', 'Total')}</Text>
                <Text style={styles.spendingValue}>{totalMax.toLocaleString()} SAR</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('الاستحقاقات', 'Benefits')}</Text>
        <GlassCard style={styles.benefitsCard}>
          {benefits.map((benefit: any, i: number) => (
            <View key={benefit.id}>
              <BenefitBar
                nameAr={benefit.nameAr}
                nameEn={benefit.nameEn}
                used={benefit.used}
                total={benefit.total}
                icon={benefit.icon}
              />
              {i < benefits.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>

        {(paymentData?.payments || []).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('سجل المدفوعات', 'Payment History')}</Text>
            {paymentData?.summary && (
              <GlassCard style={styles.paymentSummaryCard}>
                <View style={styles.paymentSummaryRow}>
                  <View style={styles.paymentStat}>
                    <Text style={styles.paymentStatValue}>{paymentData.summary.totalPaid?.toFixed(0) || '0'}</Text>
                    <Text style={styles.paymentStatUnit}>SAR</Text>
                    <Text style={styles.paymentStatLabel}>{t('مدفوع', 'Paid')}</Text>
                  </View>
                  <View style={styles.paymentStatDivider} />
                  <View style={styles.paymentStat}>
                    <Text style={styles.paymentStatValue}>{paymentData.summary.totalClaims || 0}</Text>
                    <Text style={styles.paymentStatLabel}>{t('معاملة', 'Transactions')}</Text>
                  </View>
                  <View style={styles.paymentStatDivider} />
                  <View style={styles.paymentStat}>
                    <Text style={[styles.paymentStatValue, (paymentData.summary?.pendingCount ?? 0) > 0 && { color: '#f59e0b' }]}>
                      {paymentData.summary.pendingCount || 0}
                    </Text>
                    <Text style={styles.paymentStatLabel}>{t('قيد الانتظار', 'Pending')}</Text>
                  </View>
                </View>
              </GlassCard>
            )}
            {paymentData?.payments?.slice(0, 5).map((p: PaymentItem) => (
              <GlassCard key={p.id} variant="surface" style={styles.docCard} padding={14}>
                <View style={styles.docRow}>
                  <View style={[styles.docIcon, { backgroundColor: p.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                    <Ionicons
                      name={p.status === 'completed' ? 'checkmark-circle' : 'time'}
                      size={18}
                      color={p.status === 'completed' ? Colors.success : '#f59e0b'}
                    />
                  </View>
                  <View style={styles.docInfo}>
                    <Text style={styles.docName}>{p.claim_number || t('دفعة', 'Payment')}</Text>
                    <Text style={styles.docDate}>
                      {p.amount ? `${parseFloat(p.amount).toFixed(2)} SAR` : ''} · {p.status}
                    </Text>
                  </View>
                  <StatusChip status={p.status === 'completed' ? 'approved' : p.status === 'failed' ? 'rejected' : 'submitted'} />
                </View>
              </GlassCard>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>{t('المستندات الصحية', 'Health Documents')}</Text>
        {documents.map(doc => (
          <GlassCard key={doc.id} variant="surface" style={styles.docCard} padding={14}>
            <View style={styles.docRow}>
              <View style={[styles.docIcon, { backgroundColor: `${Colors.signalTeal}20` }]}>
                <Ionicons name={(categoryIcons[doc.category] || 'document') as any} size={18} color={Colors.signalTeal} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName}>{t(doc.nameAr, doc.nameEn)}</Text>
                <Text style={styles.docDate}>{doc.date}</Text>
              </View>
              {doc.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                  <Text style={styles.verifiedText}>{t('موثق', 'Verified')}</Text>
                </View>
              )}
            </View>
          </GlassCard>
        ))}
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
  insuranceCard: { marginBottom: 24 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardBrandText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  cardType: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  cardMemberInfo: { marginBottom: 20 },
  cardMemberName: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cardMemberId: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    letterSpacing: 2,
    marginTop: 4,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  cardFieldValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  flipHint: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    textAlign: 'center',
    marginTop: 4,
  },
  qrSection: { alignItems: 'center', marginBottom: 20, marginTop: 8 },
  qrPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backDetails: { gap: 8, marginBottom: 8 },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  spendingCard: { marginBottom: 24 },
  spendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  spendingInfo: { flex: 1, gap: 8 },
  spendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  spendingLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  spendingValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  benefitsCard: { marginBottom: 24 },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  docCard: { marginBottom: 8 },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  docDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: Colors.success,
  },
  paymentSummaryCard: { marginBottom: 12 },
  paymentSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStat: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatValue: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  paymentStatUnit: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  paymentStatLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
