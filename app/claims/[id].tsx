import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusChip } from '@/components/StatusChip';
import { apiRequest } from '@/lib/query-client';

const timelineSteps = [
  { key: 'submitted', ar: 'تم الإرسال', en: 'Submitted', icon: 'paper-plane' },
  { key: 'processing', ar: 'قيد المعالجة', en: 'Processing', icon: 'hourglass' },
  { key: 'adjudicated', ar: 'تم التحكيم', en: 'Adjudicated', icon: 'checkmark-done' },
  { key: 'paid', ar: 'تم الدفع', en: 'Paid', icon: 'card' },
];

function getTimelineIndex(status: string): number {
  switch (status) {
    case 'submitted': return 0;
    case 'processing': return 1;
    case 'approved': return 3;
    case 'rejected': return 2;
    default: return 0;
  }
}

export default function ClaimDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [isPaying, setIsPaying] = useState(false);

  const { data: claimData, isLoading } = useQuery({
    queryKey: ['/api/claims', id],
  });

  if (isLoading || !claimData) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
        <ActivityIndicator size="large" color={Colors.signalTeal} />
      </View>
    );
  }

  const claim = {
    claimNumber: claimData.claim_number || id,
    status: claimData.status || 'submitted',
    serviceDate: claimData.service_date ? new Date(claimData.service_date).toISOString().split('T')[0] : '',
    providerNameAr: claimData.provider_name_ar || claimData.diagnosis_desc_ar || '',
    providerNameEn: claimData.provider_name_en || 'Provider',
    diagnosisAr: claimData.diagnosis_desc_ar || '',
    diagnosisEn: claimData.diagnosis_desc_en || '',
    amountClaimed: claimData.amount_claimed || 0,
    amountApproved: claimData.amount_approved || 0,
    lastUpdated: claimData.updated_at ? new Date(claimData.updated_at).toISOString().split('T')[0] : '',
    denialReason: claimData.denial_reason || null,
    pipelineStages: claimData.pipeline_stages || null,
    sbsCode: claimData.sbs_code || null,
    sbsDescEn: claimData.sbs_desc_en || null,
    sbsDescAr: claimData.sbs_desc_ar || null,
  };

  const activeStep = getTimelineIndex(claim.status);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{claim.claimNumber}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <GlassCard variant="elevated" style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.claimTitle}>{t(claim.providerNameAr, claim.providerNameEn)}</Text>
            <StatusChip status={claim.status} />
          </View>
          <Text style={styles.claimDiagnosis}>{t(claim.diagnosisAr, claim.diagnosisEn)}</Text>
          <Text style={styles.claimDate}>{claim.serviceDate}</Text>
        </GlassCard>

        {claim.sbsCode && (
          <GlassCard variant="surface" style={styles.sbsCard} padding={14}>
            <View style={styles.sbsRow}>
              <Ionicons name="medical" size={16} color={Colors.signalTeal} />
              <Text style={styles.sbsLabel}>{t('رمز SBS', 'SBS Code')}</Text>
              <Text style={styles.sbsCode}>{claim.sbsCode}</Text>
            </View>
            {claim.sbsDescEn && (
              <Text style={styles.sbsDesc}>{t(claim.sbsDescAr || '', claim.sbsDescEn)}</Text>
            )}
          </GlassCard>
        )}

        <Text style={styles.sectionTitle}>{t('الجدول الزمني', 'Timeline')}</Text>
        <GlassCard style={styles.timelineCard}>
          {timelineSteps.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            const isRejected = claim.status === 'rejected' && i === 2;

            return (
              <View key={step.key} style={styles.timelineStep}>
                <View style={styles.timelineDotCol}>
                  <View style={[
                    styles.timelineDot,
                    isActive && styles.timelineDotActive,
                    isRejected && styles.timelineDotRejected,
                    isCurrent && styles.timelineDotCurrent,
                  ]}>
                    <Ionicons
                      name={(isRejected ? 'close' : step.icon) as any}
                      size={14}
                      color={isActive ? '#fff' : Colors.professionalGray}
                    />
                  </View>
                  {i < timelineSteps.length - 1 && (
                    <View style={[styles.timelineLine, isActive && i < activeStep && styles.timelineLineActive]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                    {isRejected ? t('مرفوض', 'Rejected') : t(step.ar, step.en)}
                  </Text>
                  {isCurrent && <Text style={styles.timelineDate}>{claim.lastUpdated}</Text>}
                </View>
              </View>
            );
          })}
        </GlassCard>

        {claim.pipelineStages && (
          <>
            <Text style={styles.sectionTitle}>{t('مراحل المعالجة', 'Processing Pipeline')}</Text>
            <GlassCard style={styles.detailsCard}>
              {Object.entries(claim.pipelineStages).map(([stage, info]: [string, any]) => (
                <View key={stage} style={styles.detailRow}>
                  <View style={styles.pipelineStageRow}>
                    <Ionicons
                      name={info.status === 'completed' ? 'checkmark-circle' : info.status === 'failed' ? 'close-circle' : 'ellipse-outline'}
                      size={16}
                      color={info.status === 'completed' ? Colors.success : info.status === 'failed' ? Colors.error : Colors.professionalGray}
                    />
                    <Text style={styles.detailLabel}>{stage.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                  </View>
                  <Text style={[styles.detailValue, {
                    color: info.status === 'completed' ? Colors.success : info.status === 'failed' ? Colors.error : Colors.textSecondary
                  }]}>
                    {info.status}
                  </Text>
                </View>
              ))}
            </GlassCard>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('تفاصيل المطالبة', 'Claim Details')}</Text>
        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('المبلغ المطالب به', 'Amount Claimed')}</Text>
            <Text style={styles.detailValue}>{claim.amountClaimed.toLocaleString()} SAR</Text>
          </View>
          {claim.amountApproved > 0 && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('المبلغ الموافق عليه', 'Amount Approved')}</Text>
                <Text style={[styles.detailValue, { color: Colors.success }]}>{claim.amountApproved.toLocaleString()} SAR</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('مسؤولية المريض', 'Patient Responsibility')}</Text>
                <Text style={[styles.detailValue, { color: Colors.deepOrange }]}>
                  {(claim.amountClaimed - claim.amountApproved).toLocaleString()} SAR
                </Text>
              </View>
            </>
          )}
          {claim.denialReason && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('سبب الرفض', 'Denial Reason')}</Text>
                <Text style={[styles.detailValue, { color: Colors.error }]}>{claim.denialReason}</Text>
              </View>
            </>
          )}
        </GlassCard>

        {(claim.status === 'submitted' || claim.status === 'approved') && claim.amountClaimed > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('الدفع', 'Payment')}</Text>
            <GlassCard variant="surface" style={styles.paymentCard} padding={16}>
              <View style={styles.paymentRow}>
                <View>
                  <Text style={styles.paymentLabel}>{t('المبلغ المشترك (20%)', 'Copay (20%)')}</Text>
                  <Text style={styles.paymentAmount}>{(claim.amountClaimed * 0.2).toFixed(2)} SAR</Text>
                </View>
                <Pressable
                  style={[styles.payButton, isPaying && styles.payButtonDisabled]}
                  onPress={async () => {
                    setIsPaying(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    try {
                      const copay = claim.amountClaimed * 0.2;
                      const res = await apiRequest('POST', '/api/payments/create-intent', {
                        claimId: claimData.id,
                        amount: copay,
                        memberId: user?.memberId || 'MEM-2024-001',
                      });
                      const data = await res.json();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      Alert.alert(
                        t('تم إنشاء طلب الدفع', 'Payment Created'),
                        t(
                          `تم إنشاء طلب دفع بمبلغ ${copay.toFixed(2)} ريال سعودي. معرف الدفع: ${data.paymentIntentId?.slice(-8) || ''}`,
                          `Payment of ${copay.toFixed(2)} SAR created. ID: ${data.paymentIntentId?.slice(-8) || ''}`
                        ),
                      );
                    } catch (err: any) {
                      Alert.alert(t('خطأ', 'Error'), err.message || t('فشل الدفع', 'Payment failed'));
                    }
                    setIsPaying(false);
                  }}
                  disabled={isPaying}
                >
                  {isPaying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="card" size={16} color="#fff" />
                      <Text style={styles.payButtonText}>{t('ادفع الآن', 'Pay Now')}</Text>
                    </>
                  )}
                </Pressable>
              </View>
              <Text style={styles.paymentNote}>
                {t('الدفع عبر Stripe · بطاقة ائتمان/خصم', 'Via Stripe · Credit/Debit card')}
              </Text>
            </GlassCard>
          </>
        )}

        {claim.status === 'rejected' && (
          <Pressable style={styles.appealButton}>
            <Ionicons name="arrow-redo" size={18} color="#fff" />
            <Text style={styles.appealText}>{t('تقديم استئناف', 'File Appeal')}</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.aiButton}
          onPress={() => router.push('/ai-assistant')}
        >
          <Ionicons name="sparkles" size={18} color={Colors.signalTeal} />
          <Text style={styles.aiButtonText}>{t('اسأل بسمة عن هذه المطالبة', 'Ask Basma about this claim')}</Text>
        </Pressable>
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
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  scrollContent: { paddingHorizontal: 16 },
  statusCard: { marginBottom: 20 },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  claimTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  claimDiagnosis: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  claimDate: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    marginTop: 2,
  },
  sbsCard: { marginBottom: 16 },
  sbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sbsLabel: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  sbsCode: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: Colors.signalTeal,
  },
  sbsDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  timelineCard: { marginBottom: 20 },
  timelineStep: {
    flexDirection: 'row',
    gap: 12,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotActive: { backgroundColor: Colors.signalTeal },
  timelineDotRejected: { backgroundColor: Colors.error },
  timelineDotCurrent: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 2,
  },
  timelineLineActive: { backgroundColor: Colors.signalTeal },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.professionalGray,
  },
  timelineLabelActive: { color: Colors.textPrimary },
  timelineDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  detailsCard: { marginBottom: 20 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pipelineStageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  appealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.deepOrange,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  appealText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  aiButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.signalTeal,
  },
  paymentCard: { marginBottom: 20 },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  paymentAmount: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
  paymentNote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
  },
});
