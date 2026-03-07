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

const steps = [
  { key: 'provider', titleAr: '\u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', titleEn: 'Provider' },
  { key: 'service', titleAr: '\u0627\u0644\u062e\u062f\u0645\u0629', titleEn: 'Service' },
  { key: 'charges', titleAr: '\u0627\u0644\u0631\u0633\u0648\u0645', titleEn: 'Charges' },
  { key: 'review', titleAr: '\u0645\u0631\u0627\u062c\u0639\u0629', titleEn: 'Review' },
];

export default function NewClaimScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [providerName, setProviderName] = useState('');
  const [providerType, setProviderType] = useState<'facility' | 'practitioner'>('facility');
  const [serviceDate, setServiceDate] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosisDesc, setDiagnosisDesc] = useState('');
  const [procedureCode, setProcedureCode] = useState('');
  const [amount, setAmount] = useState('');
  const [priorAuthRef, setPriorAuthRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return providerName.trim().length > 0;
      case 1: return serviceDate.trim().length > 0 && diagnosisCode.trim().length > 0;
      case 2: return amount.trim().length > 0 && parseFloat(amount) > 0;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 1500));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSubmitting(false);
    Alert.alert(
      t('\u062a\u0645 \u0627\u0644\u0625\u0631\u0633\u0627\u0644', 'Claim Submitted'),
      t('\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0645\u0637\u0627\u0644\u0628\u062a\u0643 \u0628\u0646\u062c\u0627\u062d', 'Your claim has been submitted successfully'),
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('\u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', 'Select Provider')}</Text>
            <View style={styles.typeRow}>
              <Pressable
                style={[styles.typeButton, providerType === 'facility' && styles.typeActive]}
                onPress={() => setProviderType('facility')}
              >
                <Ionicons name="business" size={18} color={providerType === 'facility' ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.typeText, providerType === 'facility' && styles.typeTextActive]}>
                  {t('\u0645\u0646\u0634\u0623\u0629', 'Facility')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.typeButton, providerType === 'practitioner' && styles.typeActive]}
                onPress={() => setProviderType('practitioner')}
              >
                <Ionicons name="person" size={18} color={providerType === 'practitioner' ? '#fff' : Colors.textSecondary} />
                <Text style={[styles.typeText, providerType === 'practitioner' && styles.typeTextActive]}>
                  {t('\u0637\u0628\u064a\u0628', 'Practitioner')}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.fieldLabel}>{t('\u0627\u0633\u0645 \u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', 'Provider Name')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', 'Search provider')}
              placeholderTextColor={Colors.professionalGray}
              value={providerName}
              onChangeText={setProviderName}
            />
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062e\u062f\u0645\u0629', 'Service Details')}</Text>
            <Text style={styles.fieldLabel}>{t('\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062e\u062f\u0645\u0629', 'Service Date')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.professionalGray}
              value={serviceDate}
              onChangeText={setServiceDate}
            />
            <Text style={styles.fieldLabel}>{t('\u0631\u0645\u0632 \u0627\u0644\u062a\u0634\u062e\u064a\u0635 (ICD-10)', 'Diagnosis Code (ICD-10)')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('\u0645\u062b\u0627\u0644: M54.5', 'e.g., M54.5')}
              placeholderTextColor={Colors.professionalGray}
              value={diagnosisCode}
              onChangeText={setDiagnosisCode}
              autoCapitalize="characters"
            />
            <Text style={styles.fieldLabel}>{t('\u0648\u0635\u0641 \u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Diagnosis Description')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('\u0648\u0635\u0641 \u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Describe the diagnosis')}
              placeholderTextColor={Colors.professionalGray}
              value={diagnosisDesc}
              onChangeText={setDiagnosisDesc}
            />
            <Text style={styles.fieldLabel}>{t('\u0631\u0645\u0632 \u0627\u0644\u0625\u062c\u0631\u0627\u0621', 'Procedure Code')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('\u0645\u062b\u0627\u0644: 99213', 'e.g., 99213')}
              placeholderTextColor={Colors.professionalGray}
              value={procedureCode}
              onChangeText={setProcedureCode}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('\u0627\u0644\u0631\u0633\u0648\u0645', 'Charges')}</Text>
            <Text style={styles.fieldLabel}>{t('\u0627\u0644\u0645\u0628\u0644\u063a (SAR)', 'Amount (SAR)')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              placeholderTextColor={Colors.professionalGray}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>{t('\u0631\u0642\u0645 \u0627\u0644\u062a\u0641\u0648\u064a\u0636 \u0627\u0644\u0645\u0633\u0628\u0642', 'Prior Auth Reference')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('\u0627\u062e\u062a\u064a\u0627\u0631\u064a', 'Optional')}
              placeholderTextColor={Colors.professionalGray}
              value={priorAuthRef}
              onChangeText={setPriorAuthRef}
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('\u0645\u0631\u0627\u062c\u0639\u0629 \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629', 'Review Claim')}</Text>
            <GlassCard variant="surface" padding={14}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('\u0645\u0642\u062f\u0645 \u0627\u0644\u062e\u062f\u0645\u0629', 'Provider')}</Text>
                <Text style={styles.reviewValue}>{providerName}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('\u0627\u0644\u062a\u0627\u0631\u064a\u062e', 'Date')}</Text>
                <Text style={styles.reviewValue}>{serviceDate}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('\u0627\u0644\u062a\u0634\u062e\u064a\u0635', 'Diagnosis')}</Text>
                <Text style={styles.reviewValue}>{diagnosisCode}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('\u0627\u0644\u0645\u0628\u0644\u063a', 'Amount')}</Text>
                <Text style={[styles.reviewValue, { color: Colors.signalTeal }]}>{amount} SAR</Text>
              </View>
            </GlassCard>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('\u0645\u0637\u0627\u0644\u0628\u0629 \u062c\u062f\u064a\u062f\u0629', 'New Claim')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.stepIndicator}>
        {steps.map((step, i) => (
          <View key={step.key} style={styles.stepDotRow}>
            <View style={[styles.stepDot, i <= currentStep && styles.stepDotActive]} />
            {i < steps.length - 1 && <View style={[styles.stepLine, i < currentStep && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <View style={styles.stepLabels}>
        {steps.map((step, i) => (
          <Text key={step.key} style={[styles.stepLabel, i <= currentStep && styles.stepLabelActive]}>
            {t(step.titleAr, step.titleEn)}
          </Text>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 + (Platform.OS === 'web' ? 34 : 0) }]}>
        {currentStep < steps.length - 1 ? (
          <Pressable
            style={[styles.nextButton, !canProceed() && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={styles.nextText}>{t('\u0627\u0644\u062a\u0627\u0644\u064a', 'Next')}</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.nextText}>
              {isSubmitting ? t('\u062c\u0627\u0631\u064a \u0627\u0644\u0625\u0631\u0633\u0627\u0644...', 'Submitting...') : t('\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0645\u0637\u0627\u0644\u0628\u0629', 'Submit Claim')}
            </Text>
          </Pressable>
        )}
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
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginBottom: 4,
  },
  stepDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  stepDotActive: {
    backgroundColor: Colors.signalTeal,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: Colors.signalTeal,
  },
  stepLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    flex: 1,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: Colors.signalTeal,
    fontFamily: 'Inter_600SemiBold',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  stepContent: { gap: 12 },
  stepTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 4,
  },
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
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  typeActive: {
    backgroundColor: Colors.signalTeal,
    borderColor: Colors.signalTeal,
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  typeTextActive: { color: '#fff' },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  reviewLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  reviewValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
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
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.signalTeal,
    paddingVertical: 16,
    borderRadius: 14,
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
  nextText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    color: '#fff',
  },
});
