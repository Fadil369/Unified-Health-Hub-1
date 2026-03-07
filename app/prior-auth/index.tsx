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
import { mockPriorAuths, type PriorAuth } from '@/lib/mock-data';

function PriorAuthItem({ item }: { item: PriorAuth }) {
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
        <View style={[styles.urgencyBadge, { backgroundColor: `${urgencyColors[item.urgency]}20` }]}>
          <Text style={[styles.urgencyText, { color: urgencyColors[item.urgency] }]}>
            {t(
              item.urgency === 'routine' ? '\u0631\u0648\u062a\u064a\u0646\u064a' : item.urgency === 'urgent' ? '\u0639\u0627\u062c\u0644' : '\u0637\u0627\u0631\u0626',
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
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('\u0627\u0644\u062a\u0641\u0648\u064a\u0636 \u0627\u0644\u0645\u0633\u0628\u0642', 'Prior Authorization')}</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/prior-auth/new'); }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={mockPriorAuths}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <PriorAuthItem item={item} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={48} color={Colors.professionalGray} />
            <Text style={styles.emptyText}>{t('\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a', 'No prior auth requests')}</Text>
          </View>
        }
      />
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
