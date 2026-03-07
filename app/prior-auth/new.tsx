import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';

export default function NewPriorAuthScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [providerName, setProviderName] = useState('');
  const [serviceType, setServiceType] = useState<'inpatient' | 'outpatient' | 'procedure' | 'medication'>('outpatient');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'emergency'>('routine');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const serviceTypes = [
    { key: 'inpatient' as const, ar: '\u062f\u0627\u062e\u0644\u064a', en: 'Inpatient', icon: 'bed' },
    { key: 'outpatient' as const, ar: '\u062e\u0627\u0631\u062c\u064a', en: 'Outpatient', icon: 'walk' },
    { key: 'procedure' as const, ar: '\u0625\u062c\u0631\u0627\u0621', en: 'Procedure', icon: 'cut' },
    { key: 'medication' as const, ar: '\u062f\u0648\u0627\u0621', en: 'Medication', icon: 'medical' },
  ];

  const urgencies = [
    { key: 'routine' as const, ar: '\u0631\u0648\u062a\u064a\u0646\u064a', en: 'Routine', color: Colors.success },
    { key: 'urgent' as const, ar: '\u0639\u0627\u062c\u0644', en: 'Urgent', color: Colors.warning },
    { key: 'emergency' as const, ar: '\u0637\u0627\u0631\u0626', en: 'Emergency', color: Colors.error },
  ];

  const handlePreAssess = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise(resolve => setTimeout(resolve, 1200));
    const score = 0.7 + Math.random() * 0.28;
    setAiScore(score);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 1500));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    Alert.alert(
      t('\u062a\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644', 'Request Submitted'),
      t('\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0637\u0644\u0628 \u0627\u0644\u062a\u0641\u0648\u064a\u0636 \u0627\u0644\u0645\u0633\u0628\u0642 \u0628\u0646\u062c\u0627\u062d', 'Your prior auth request has been submitted'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('\u062a\u0641\u0648\u064a\u0636 \u0645\u0633\u0628\u0642 \u062c\u062f\u064a\u062f', 'New Prior Auth')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>{t('\u0646\u0648\u0639 \u0627\u0644\u062e\u062f\u0645\u0629', 'Service Type')}</Text>
        <View style={styles.typeGrid}>
          {serviceTypes.map(st => (
            <Pressable
              key={st.key}
              style={[styles.typeCard, serviceType === st.key && styles.typeCardActive]}
              onPress={() => setServiceType(st.key)}
            >
              <Ionicons name={st.icon as any} size={20} color={serviceType === st.key ? '#fff' : Colors.textSecondary} />
              <Text style={[styles.typeCardText, serviceType === st.key && styles.typeCardTextActive]}>
                {t(st.ar, st.en)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionLabel}>{t('\u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', 'Provider')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u0634\u0641\u0649 / \u0627\u0644\u0637\u0628\u064a\u0628', 'Hospital / Doctor name')}
          placeholderTextColor={Colors.professionalGray}
          value={providerName}
          onChangeText={setProviderName}
        />

        <Text style={styles.sectionLabel}>{t('\u0631\u0645\u0632 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 (ICD-10)', 'Diagnosis Code (ICD-10)')}</Text>
        <TextInput
          style={styles.textInput}
          placeholder={t('\u0645\u062b\u0627\u0644: M17.1', 'e.g., M17.1')}
          placeholderTextColor={Colors.professionalGray}
          value={diagnosisCode}
          onChangeText={setDiagnosisCode}
          autoCapitalize="characters"
        />

        <Text style={styles.sectionLabel}>{t('\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0633\u0631\u064a\u0631\u064a\u0629', 'Clinical Notes')}</Text>
        <TextInput
          style={[styles.textInput, styles.multiline]}
          placeholder={t('\u0627\u0643\u062a\u0628 \u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0627\u0644\u0633\u0631\u064a\u0631\u064a\u0629 \u0647\u0646\u0627', 'Enter clinical notes here')}
          placeholderTextColor={Colors.professionalGray}
          value={clinicalNotes}
          onChangeText={setClinicalNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.sectionLabel}>{t('\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0627\u0633\u062a\u0639\u062c\u0627\u0644', 'Urgency Level')}</Text>
        <View style={styles.urgencyRow}>
          {urgencies.map(u => (
            <Pressable
              key={u.key}
              style={[styles.urgencyButton, urgency === u.key && { backgroundColor: `${u.color}30`, borderColor: u.color }]}
              onPress={() => setUrgency(u.key)}
            >
              <Text style={[styles.urgencyText, urgency === u.key && { color: u.color }]}>
                {t(u.ar, u.en)}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.aiAssessButton} onPress={handlePreAssess}>
          <Ionicons name="sparkles" size={18} color={Colors.signalTeal} />
          <Text style={styles.aiAssessText}>{t('\u062a\u0642\u064a\u064a\u0645 \u0630\u0643\u064a \u0645\u0633\u0628\u0642', 'AI Pre-Assessment')}</Text>
        </Pressable>

        {aiScore !== null && (
          <GlassCard variant={aiScore > 0.9 ? 'elevated' : 'default'} style={styles.aiScoreCard}>
            <View style={styles.aiScoreRow}>
              <Ionicons name="sparkles" size={20} color={aiScore > 0.9 ? Colors.success : Colors.warning} />
              <View style={styles.aiScoreContent}>
                <Text style={styles.aiScoreLabel}>{t('\u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629', 'Approval Probability')}</Text>
                <Text style={[styles.aiScoreValue, { color: aiScore > 0.9 ? Colors.success : Colors.warning }]}>
                  {Math.round(aiScore * 100)}%
                </Text>
              </View>
            </View>
            <Text style={styles.aiScoreHint}>
              {aiScore > 0.9
                ? t('\u0627\u062d\u062a\u0645\u0627\u0644\u064a\u0629 \u0639\u0627\u0644\u064a\u0629 \u0644\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0627\u0644\u062a\u0644\u0642\u0627\u0626\u064a\u0629', 'High probability of auto-approval')
                : t('\u0642\u062f \u064a\u062a\u0637\u0644\u0628 \u0645\u0631\u0627\u062c\u0639\u0629 \u064a\u062f\u0648\u064a\u0629', 'May require manual review')}
            </Text>
          </GlassCard>
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (Platform.OS === 'web' ? 34 : 0) }]}>
        <Pressable
          style={[styles.submitButton, (!providerName || !diagnosisCode || isSubmitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!providerName || !diagnosisCode || isSubmitting}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.submitText}>
            {isSubmitting ? t('\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644...', 'Submitting...') : t('\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628', 'Submit Request')}
          </Text>
        </Pressable>
      </View>
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
  scrollContent: { paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%' as any,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeCardActive: {
    backgroundColor: Colors.signalTeal,
    borderColor: Colors.signalTeal,
  },
  typeCardText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  typeCardTextActive: { color: '#fff' },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  multiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  urgencyText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },
  aiAssessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.3)',
  },
  aiAssessText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.signalTeal,
  },
  aiScoreCard: { marginTop: 12 },
  aiScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  aiScoreContent: { flex: 1 },
  aiScoreLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  aiScoreValue: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
  },
  aiScoreHint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(15, 34, 64, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
