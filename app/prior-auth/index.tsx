import { StyleSheet, Text, View, FlatList, Pressable, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { StatusChip } from '@/components/StatusChip';
import { apiRequest } from '@/lib/query-client';

interface PriorAuthDisplay {
  id: string;
  referenceNumber: string;
  status: string;
  serviceTypeAr: string;
  serviceTypeEn: string;
  providerNameAr: string;
  providerNameEn: string;
  diagnosisCodeAr: string;
  diagnosisCodeEn: string;
  urgency: string;
  approvalProbability: number;
}

function PriorAuthItem({ item }: { item: PriorAuthDisplay }) {
  const { t } = useLanguage();
  const urgencyColors: Record<string, string> = {
    routine: Colors.success,
    urgent: Colors.warning,
    emergency: Colors.error,
  };

  return (
    <GlassCard variant="surface" style={styles.card} padding={16}>
      <View style={styles.cardHeader}>
        <Text style={styles.refNumber}>{item.referenceNumber}</Text>
        <StatusChip status={item.status} />
      </View>
      <Text style={styles.serviceType}>{t(item.serviceTypeAr, item.serviceTypeEn)}</Text>
      <Text style={styles.provider}>{t(item.providerNameAr, item.providerNameEn)}</Text>
      <Text style={styles.diagnosis}>{t(item.diagnosisCodeAr, item.diagnosisCodeEn)}</Text>
      <View style={styles.cardFooter}>
        <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColors[item.urgency] || Colors.success}20` }]}>
          <Text style={[styles.urgencyText, { color: urgencyColors[item.urgency] || Colors.success }]}>
            {t(
              item.urgency === 'routine' ? 'روتيني' : item.urgency === 'urgent' ? 'عاجل' : 'طارئ',
              item.urgency.charAt(0).toUpperCase() + item.urgency.slice(1)
            )}
          </Text>
        </View>
        <View style={styles.probabilityBadge}>
          <Ionicons name="sparkles" size={12} color={item.approvalProbability > 0.9 ? Colors.success : Colors.warning} />
          <Text style={[styles.probabilityText, { color: item.approvalProbability > 0.9 ? Colors.success : Colors.warning }]}>
            {Math.round(item.approvalProbability * 100)}%
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}

export default function PriorAuthListScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data: authsData, isLoading } = useQuery({
    queryKey: ['/api/prior-auth'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/prior-auth?memberId=${user?.memberId || 'MEM-2024-001'}`);
      return res.json();
    },
  });

  const priorAuths: PriorAuthDisplay[] = (authsData?.priorAuths || []).map((pa: any) => ({
    id: String(pa.id),
    referenceNumber: pa.reference_number || pa.referenceNumber || `PA-${pa.id}`,
    status: pa.status || 'pending',
    serviceTypeAr: pa.service_type_ar || pa.service_type || '',
    serviceTypeEn: pa.service_type_en || pa.service_type || '',
    providerNameAr: pa.provider_name_ar || '',
    providerNameEn: pa.provider_name_en || 'Provider',
    diagnosisCodeAr: pa.diagnosis_code_ar || pa.diagnosis_code || '',
    diagnosisCodeEn: pa.diagnosis_code_en || pa.diagnosis_code || '',
    urgency: pa.urgency || 'routine',
    approvalProbability: pa.approval_probability || pa.ai_approval_probability || 0.85,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('التفويض المسبق', 'Prior Authorization')}</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/prior-auth/new'); }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.signalTeal} />
        </View>
      ) : (
        <FlatList
          data={priorAuths}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <PriorAuthItem item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color={Colors.professionalGray} />
              <Text style={styles.emptyText}>{t('لا توجد طلبات', 'No prior auth requests')}</Text>
            </View>
          }
        />
      )}
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
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.signalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: { paddingHorizontal: 16 },
  card: { marginBottom: 10 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refNumber: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  serviceType: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  provider: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  diagnosis: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  urgencyText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  probabilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  probabilityText: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
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
