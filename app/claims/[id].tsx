import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusChip } from '@/components/StatusChip';
import { mockClaims } from '@/lib/mock-data';

const timelineSteps = [
  { key: 'submitted', ar: '\u062a\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644', en: 'Submitted', icon: 'paper-plane' },
  { key: 'processing', ar: '\u0642\u064a\u062f \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629', en: 'Processing', icon: 'hourglass' },
  { key: 'adjudicated', ar: '\u062a\u0645 \u0627\u0644\u062a\u062d\u0643\u064a\u0645', en: 'Adjudicated', icon: 'checkmark-done' },
  { key: 'paid', ar: '\u062a\u0645 \u0627\u0644\u062f\u0641\u0639', en: 'Paid', icon: 'card' },
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const claim = mockClaims.find(c => c.id === id) || mockClaims[0];
  const activeStep = getTimelineIndex(claim.status);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

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

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u062c\u062f\u0648\u0644 \u0627\u0644\u0632\u0645\u0646\u064a', 'Timeline')}</Text>
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
                    {isRejected ? t('\u0645\u0631\u0641\u0648\u0636', 'Rejected') : t(step.ar, step.en)}
                  </Text>
                  {isCurrent && <Text style={styles.timelineDate}>{claim.lastUpdated}</Text>}
                </View>
              </View>
            );
          })}
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629', 'Claim Details')}</Text>
        <GlassCard style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0637\u0627\u0644\u0628 \u0628\u0647', 'Amount Claimed')}</Text>
            <Text style={styles.detailValue}>{claim.amountClaimed.toLocaleString()} SAR</Text>
          </View>
          {claim.amountApproved > 0 && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0645\u0648\u0627\u0641\u0642 \u0639\u0644\u064a\u0647', 'Amount Approved')}</Text>
                <Text style={[styles.detailValue, { color: Colors.success }]}>{claim.amountApproved.toLocaleString()} SAR</Text>
              </View>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>{t('\u0645\u0633\u0624\u0648\u0644\u064a\u0629 \u0627\u0644\u0645\u0631\u064a\u0636', 'Patient Responsibility')}</Text>
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
                <Text style={styles.detailLabel}>{t('\u0633\u0628\u0628 \u0627\u0644\u0631\u0641\u0636', 'Denial Reason')}</Text>
                <Text style={[styles.detailValue, { color: Colors.error }]}>{claim.denialReason}</Text>
              </View>
            </>
          )}
        </GlassCard>

        {claim.status === 'rejected' && (
          <Pressable style={styles.appealButton}>
            <Ionicons name="arrow-redo" size={18} color="#fff" />
            <Text style={styles.appealText}>{t('\u062a\u0642\u062f\u064a\u0645 \u0627\u0633\u062a\u0626\u0646\u0627\u0641', 'File Appeal')}</Text>
          </Pressable>
        )}

        <Pressable
          style={styles.aiButton}
          onPress={() => router.push('/ai-assistant')}
        >
          <Ionicons name="sparkles" size={18} color={Colors.signalTeal} />
          <Text style={styles.aiButtonText}>{t('\u0627\u0633\u0623\u0644 \u0628\u0633\u0645\u0629 \u0639\u0646 \u0647\u0630\u0647 \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629', 'Ask Basma about this claim')}</Text>
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
});
