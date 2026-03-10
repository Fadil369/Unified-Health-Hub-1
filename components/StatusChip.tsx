import { StyleSheet, Text, View } from 'react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import Colors from '@/constants/colors';

type Status = 'active' | 'pending' | 'approved' | 'rejected' | 'processing' | 'appealed' | 'submitted' | 'in_review' | 'denied' | 'expired';

const statusConfig: Record<Status, { color: string; bgColor: string; ar: string; en: string }> = {
  active: { color: Colors.success, bgColor: 'rgba(22, 163, 74, 0.15)', ar: '\u0646\u0634\u0637', en: 'Active' },
  pending: { color: Colors.warning, bgColor: 'rgba(217, 119, 6, 0.15)', ar: '\u0645\u0639\u0644\u0642', en: 'Pending' },
  approved: { color: Colors.success, bgColor: 'rgba(22, 163, 74, 0.15)', ar: '\u0645\u0648\u0627\u0641\u0642', en: 'Approved' },
  rejected: { color: Colors.error, bgColor: 'rgba(220, 38, 38, 0.15)', ar: '\u0645\u0631\u0641\u0648\u0636', en: 'Rejected' },
  denied: { color: Colors.error, bgColor: 'rgba(220, 38, 38, 0.15)', ar: '\u0645\u0631\u0641\u0648\u0636', en: 'Denied' },
  processing: { color: Colors.signalTeal, bgColor: 'rgba(14, 165, 233, 0.15)', ar: '\u0642\u064a\u062f \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629', en: 'Processing' },
  appealed: { color: Colors.deepOrange, bgColor: 'rgba(234, 88, 12, 0.15)', ar: '\u0645\u0633\u062a\u0623\u0646\u0641', en: 'Appealed' },
  submitted: { color: Colors.medicalBlue, bgColor: 'rgba(43, 108, 184, 0.15)', ar: '\u0645\u0642\u062f\u0645', en: 'Submitted' },
  in_review: { color: Colors.warning, bgColor: 'rgba(217, 119, 6, 0.15)', ar: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', en: 'In Review' },
  expired: { color: Colors.professionalGray, bgColor: 'rgba(100, 116, 139, 0.15)', ar: '\u0645\u0646\u062a\u0647\u064a', en: 'Expired' },
};

export function StatusChip({ status }: { status: string }) {
  const { t } = useLanguage();
  const config = statusConfig[status as Status] || statusConfig.pending;

  return (
    <View style={[styles.chip, { backgroundColor: config.bgColor, borderColor: config.color }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{t(config.ar, config.en)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});
