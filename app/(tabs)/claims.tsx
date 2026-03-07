import { useState } from 'react';
import { StyleSheet, Text, View, FlatList, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusChip } from '@/components/StatusChip';
import { mockClaims, type Claim } from '@/lib/mock-data';

type FilterType = 'all' | 'submitted' | 'processing' | 'approved' | 'rejected';

const filters: { key: FilterType; ar: string; en: string }[] = [
  { key: 'all', ar: '\u0627\u0644\u0643\u0644', en: 'All' },
  { key: 'submitted', ar: '\u0645\u0642\u062f\u0645', en: 'Submitted' },
  { key: 'processing', ar: '\u0645\u0639\u0627\u0644\u062c\u0629', en: 'Processing' },
  { key: 'approved', ar: '\u0645\u0648\u0627\u0641\u0642', en: 'Approved' },
  { key: 'rejected', ar: '\u0645\u0631\u0641\u0648\u0636', en: 'Rejected' },
];

function ClaimItem({ claim }: { claim: Claim }) {
  const { t } = useLanguage();

  return (
    <Pressable onPress={() => router.push({ pathname: '/claims/[id]', params: { id: claim.id } })}>
      <GlassCard variant="surface" style={styles.claimCard} padding={16}>
        <View style={styles.claimHeader}>
          <Text style={styles.claimNumber}>{claim.claimNumber}</Text>
          <StatusChip status={claim.status} />
        </View>
        <View style={styles.claimBody}>
          <View style={styles.claimInfo}>
            <Text style={styles.claimProvider}>{t(claim.providerNameAr, claim.providerNameEn)}</Text>
            <Text style={styles.claimDiagnosis}>{t(claim.diagnosisAr, claim.diagnosisEn)}</Text>
            <Text style={styles.claimDate}>
              <Ionicons name="calendar-outline" size={11} color={Colors.professionalGray} /> {claim.serviceDate}
            </Text>
          </View>
          <View style={styles.claimAmounts}>
            <Text style={styles.claimAmountLabel}>{t('\u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629', 'Claimed')}</Text>
            <Text style={styles.claimAmount}>{claim.amountClaimed.toLocaleString()}</Text>
            {claim.amountApproved > 0 && (
              <>
                <Text style={styles.claimAmountLabel}>{t('\u0627\u0644\u0645\u0648\u0627\u0641\u0642', 'Approved')}</Text>
                <Text style={[styles.claimAmount, { color: Colors.success }]}>{claim.amountApproved.toLocaleString()}</Text>
              </>
            )}
            <Text style={styles.currencyLabel}>SAR</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function ClaimsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const filteredClaims = activeFilter === 'all'
    ? mockClaims
    : mockClaims.filter(c => c.status === activeFilter);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.headerArea, { paddingTop: insets.top + 12 + webTopInset }]}>
        <View style={styles.titleRow}>
          <Text style={styles.screenTitle}>{t('\u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0627\u062a', 'Claims')}</Text>
          <Pressable
            style={styles.newButton}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/claims/new'); }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        <FlatList
          horizontal
          data={filters}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(item.key); }}
              style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === item.key && styles.filterTextActive]}>
                {t(item.ar, item.en)}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={filteredClaims}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <ClaimItem claim={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={Colors.professionalGray} />
            <Text style={styles.emptyText}>{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0637\u0627\u0644\u0628\u0627\u062a', 'No claims found')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  headerArea: { paddingHorizontal: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  newButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.signalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActive: {
    backgroundColor: Colors.signalTeal,
    borderColor: Colors.signalTeal,
  },
  filterText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  listContent: { paddingHorizontal: 16 },
  claimCard: { marginBottom: 10 },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  claimNumber: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  claimBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  claimInfo: { flex: 1, gap: 3 },
  claimProvider: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  claimDiagnosis: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  claimDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
  },
  claimAmounts: {
    alignItems: 'flex-end',
    gap: 1,
  },
  claimAmountLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  claimAmount: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  currencyLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.professionalGray,
  },
});
