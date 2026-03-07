import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';

interface BenefitBarProps {
  nameAr: string;
  nameEn: string;
  used: number;
  total: number;
  icon: string;
}

export function BenefitBar({ nameAr, nameEn, used, total, icon }: BenefitBarProps) {
  const { t } = useLanguage();
  const progress = Math.min(used / total, 1);
  const percentage = Math.round(progress * 100);
  const color = percentage > 80 ? Colors.error : percentage > 60 ? Colors.warning : Colors.signalTeal;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Ionicons name={icon as any} size={16} color={color} />
          <Text style={styles.name}>{t(nameAr, nameEn)}</Text>
        </View>
        <Text style={styles.amount}>
          {used.toLocaleString()} / {total.toLocaleString()} SAR
        </Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentage: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'right',
  },
});
