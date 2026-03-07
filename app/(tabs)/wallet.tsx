import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { BenefitBar } from '@/components/BenefitBar';
import { ProgressRing } from '@/components/ProgressRing';
import { mockCoverage, mockBenefits, mockDocuments } from '@/lib/mock-data';

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isFlipped, setIsFlipped] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const coverage = mockCoverage;
  const benefits = mockBenefits;
  const documents = mockDocuments;
  const totalUsed = benefits.reduce((sum, b) => sum + b.used, 0);
  const totalMax = benefits.reduce((sum, b) => sum + b.total, 0);

  const categoryIcons: Record<string, string> = {
    lab: 'flask',
    imaging: 'scan',
    prescription: 'medical',
    referral: 'document-text',
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 12 + webTopInset, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.screenTitle}>{t('\u0627\u0644\u0645\u062d\u0641\u0638\u0629 \u0627\u0644\u0635\u062d\u064a\u0629', 'Health Wallet')}</Text>

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
                    <Text style={styles.cardLabel}>{t('\u0631\u0642\u0645 \u0627\u0644\u0648\u062b\u064a\u0642\u0629', 'Policy')}</Text>
                    <Text style={styles.cardFieldValue}>{coverage.policyNumber}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>{t('\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629', 'Valid')}</Text>
                    <Text style={styles.cardFieldValue}>{coverage.startDate} - {coverage.endDate}</Text>
                  </View>
                </View>
                <Text style={styles.flipHint}>{t('\u0627\u0646\u0642\u0631 \u0644\u0644\u0642\u0644\u0628', 'Tap to flip')}</Text>
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
                    <Text style={styles.backText}>{t('\u0627\u0644\u0634\u0628\u0643\u0629', 'Network')}: {coverage.networkTier}</Text>
                  </View>
                </View>
                <Text style={styles.flipHint}>{t('\u0627\u0646\u0642\u0631 \u0644\u0644\u0642\u0644\u0628', 'Tap to flip')}</Text>
              </View>
            )}
          </GlassCard>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('\u0645\u0644\u062e\u0635 \u0627\u0644\u0625\u0646\u0641\u0627\u0642', 'Spending Summary')}</Text>
        <GlassCard style={styles.spendingCard}>
          <View style={styles.spendingRow}>
            <ProgressRing
              progress={totalUsed / totalMax}
              size={90}
              strokeWidth={8}
              value={`${Math.round((totalUsed / totalMax) * 100)}%`}
              label={t('\u0645\u0633\u062a\u062e\u062f\u0645', 'Used')}
            />
            <View style={styles.spendingInfo}>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645', 'Used')}</Text>
                <Text style={styles.spendingValue}>{totalUsed.toLocaleString()} SAR</Text>
              </View>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('\u0627\u0644\u0645\u062a\u0628\u0642\u064a', 'Remaining')}</Text>
                <Text style={[styles.spendingValue, { color: Colors.success }]}>
                  {(totalMax - totalUsed).toLocaleString()} SAR
                </Text>
              </View>
              <View style={styles.spendingItem}>
                <Text style={styles.spendingLabel}>{t('\u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a', 'Total')}</Text>
                <Text style={styles.spendingValue}>{totalMax.toLocaleString()} SAR</Text>
              </View>
            </View>
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0627\u0633\u062a\u062d\u0642\u0627\u0642\u0627\u062a', 'Benefits')}</Text>
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
              {i < benefits.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassCard>

        <Text style={styles.sectionTitle}>{t('\u0627\u0644\u0645\u0633\u062a\u0646\u062f\u0627\u062a \u0627\u0644\u0635\u062d\u064a\u0629', 'Health Documents')}</Text>
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
                  <Text style={styles.verifiedText}>{t('\u0645\u0648\u062b\u0642', 'Verified')}</Text>
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
});
