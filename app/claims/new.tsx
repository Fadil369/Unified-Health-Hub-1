import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, Pressable, Platform, Alert, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { GlassCard } from '@/components/GlassCard';
import { apiRequest } from '@/lib/query-client';

const steps = [
  { key: 'provider', titleAr: 'مقدم الخدمة', titleEn: 'Provider' },
  { key: 'service', titleAr: 'الخدمة', titleEn: 'Service' },
  { key: 'charges', titleAr: 'الرسوم', titleEn: 'Charges' },
  { key: 'review', titleAr: 'مراجعة', titleEn: 'Review' },
];

interface SBSCode {
  sbs_id: string;
  sbs_code: string;
  description_en: string;
  description_ar: string;
  category_name: string;
  unit_price: number;
  requires_prior_auth: boolean;
}

interface Provider {
  id: number;
  name_en: string;
  name_ar: string;
  provider_type: string;
  city: string;
}

export default function NewClaimScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerSearch, setProviderSearch] = useState('');
  const [serviceDate, setServiceDate] = useState('');
  const [diagnosisCode, setDiagnosisCode] = useState('');
  const [diagnosisDesc, setDiagnosisDesc] = useState('');
  const [sbsSearch, setSbsSearch] = useState('');
  const [selectedSBS, setSelectedSBS] = useState<SBSCode | null>(null);
  const [amount, setAmount] = useState('');
  const [priorAuthRef, setPriorAuthRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data: providersData } = useQuery({
    queryKey: ['/api/providers'],
  });

  const { data: sbsResults } = useQuery({
    queryKey: ['/api/sbs/search', sbsSearch],
    queryFn: async () => {
      if (!sbsSearch || sbsSearch.length < 2) return { codes: [] };
      const res = await apiRequest('GET', `/api/sbs/search?q=${encodeURIComponent(sbsSearch)}&limit=8`);
      return res.json();
    },
    enabled: sbsSearch.length >= 2,
  });

  const providers: Provider[] = providersData?.providers || providersData || [];
  const filteredProviders = providerSearch.length > 0
    ? providers.filter(p =>
        p.name_en.toLowerCase().includes(providerSearch.toLowerCase()) ||
        p.name_ar.includes(providerSearch)
      )
    : providers;

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedProvider !== null;
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

  const handleSelectSBS = useCallback((code: SBSCode) => {
    setSelectedSBS(code);
    setSbsSearch('');
    if (code.unit_price > 0) {
      setAmount(String(code.unit_price));
    }
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await apiRequest('POST', '/api/claims', {
        memberId: user?.memberId || 'MEM-2024-001',
        providerId: selectedProvider?.id || 1,
        serviceDate,
        diagnosisCode,
        diagnosisDescEn: diagnosisDesc || selectedSBS?.description_en || '',
        diagnosisDescAr: selectedSBS?.description_ar || '',
        sbsCode: selectedSBS?.sbs_code || null,
        amount: parseFloat(amount),
        priorAuthRef: priorAuthRef || null,
      });
      const data = await res.json();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.invalidateQueries({ queryKey: ['/api/claims'] });
      Alert.alert(
        t('تم الإرسال', 'Claim Submitted'),
        t(
          `تم إرسال المطالبة ${data.claim?.claim_number || ''} بنجاح`,
          `Claim ${data.claim?.claim_number || ''} submitted successfully`
        ),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert(
        t('خطأ', 'Error'),
        err.message || t('فشل الإرسال', 'Submission failed'),
      );
    }
    setIsSubmitting(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('اختيار مقدم الخدمة', 'Select Provider')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('ابحث عن مقدم الخدمة', 'Search provider')}
              placeholderTextColor={Colors.professionalGray}
              value={providerSearch}
              onChangeText={setProviderSearch}
            />
            {filteredProviders.slice(0, 6).map((p) => (
              <Pressable
                key={p.id}
                style={[styles.providerItem, selectedProvider?.id === p.id && styles.providerItemActive]}
                onPress={() => { setSelectedProvider(p); Haptics.selectionAsync(); }}
              >
                <Ionicons
                  name={p.provider_type === 'hospital' ? 'business' : 'medkit'}
                  size={18}
                  color={selectedProvider?.id === p.id ? '#fff' : Colors.textSecondary}
                />
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, selectedProvider?.id === p.id && { color: '#fff' }]}>
                    {t(p.name_ar, p.name_en)}
                  </Text>
                  <Text style={[styles.providerCity, selectedProvider?.id === p.id && { color: 'rgba(255,255,255,0.7)' }]}>
                    {p.city} · {p.provider_type}
                  </Text>
                </View>
                {selectedProvider?.id === p.id && (
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                )}
              </Pressable>
            ))}
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('تفاصيل الخدمة', 'Service Details')}</Text>
            <Text style={styles.fieldLabel}>{t('تاريخ الخدمة', 'Service Date')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.professionalGray}
              value={serviceDate}
              onChangeText={setServiceDate}
            />
            <Text style={styles.fieldLabel}>{t('رمز التشخيص (ICD-10)', 'Diagnosis Code (ICD-10)')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('مثال: M54.5', 'e.g., M54.5')}
              placeholderTextColor={Colors.professionalGray}
              value={diagnosisCode}
              onChangeText={setDiagnosisCode}
              autoCapitalize="characters"
            />
            <Text style={styles.fieldLabel}>{t('رمز الإجراء SBS', 'SBS Procedure Code')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('ابحث عن رمز SBS...', 'Search SBS code...')}
              placeholderTextColor={Colors.professionalGray}
              value={selectedSBS ? `${selectedSBS.sbs_code} - ${t(selectedSBS.description_ar, selectedSBS.description_en)}` : sbsSearch}
              onChangeText={(text) => {
                if (selectedSBS) setSelectedSBS(null);
                setSbsSearch(text);
              }}
            />
            {(sbsResults?.codes || []).length > 0 && !selectedSBS && (
              <GlassCard variant="surface" padding={0} style={styles.sbsDropdown}>
                {sbsResults.codes.map((code: SBSCode) => (
                  <Pressable
                    key={code.sbs_id}
                    style={styles.sbsItem}
                    onPress={() => handleSelectSBS(code)}
                  >
                    <View style={styles.sbsItemLeft}>
                      <Text style={styles.sbsItemCode}>{code.sbs_code}</Text>
                      <Text style={styles.sbsItemDesc} numberOfLines={1}>
                        {t(code.description_ar, code.description_en)}
                      </Text>
                    </View>
                    {code.requires_prior_auth && (
                      <View style={styles.priorAuthBadge}>
                        <Text style={styles.priorAuthBadgeText}>PA</Text>
                      </View>
                    )}
                    {code.unit_price > 0 && (
                      <Text style={styles.sbsItemPrice}>{code.unit_price} SAR</Text>
                    )}
                  </Pressable>
                ))}
              </GlassCard>
            )}
            {selectedSBS?.requires_prior_auth && (
              <View style={styles.warningBanner}>
                <Ionicons name="warning" size={16} color={Colors.warning} />
                <Text style={styles.warningText}>
                  {t('هذا الإجراء يتطلب تفويض مسبق', 'This procedure requires prior authorization')}
                </Text>
              </View>
            )}
            <Text style={styles.fieldLabel}>{t('وصف التشخيص', 'Diagnosis Description')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('وصف التشخيص', 'Describe the diagnosis')}
              placeholderTextColor={Colors.professionalGray}
              value={diagnosisDesc}
              onChangeText={setDiagnosisDesc}
            />
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('الرسوم', 'Charges')}</Text>
            <Text style={styles.fieldLabel}>{t('المبلغ (SAR)', 'Amount (SAR)')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              placeholderTextColor={Colors.professionalGray}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.fieldLabel}>{t('رقم التفويض المسبق', 'Prior Auth Reference')}</Text>
            <TextInput
              style={styles.textInput}
              placeholder={t('اختياري', 'Optional')}
              placeholderTextColor={Colors.professionalGray}
              value={priorAuthRef}
              onChangeText={setPriorAuthRef}
            />
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{t('مراجعة المطالبة', 'Review Claim')}</Text>
            <GlassCard variant="surface" padding={14}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('مقدم الخدمة', 'Provider')}</Text>
                <Text style={styles.reviewValue}>{selectedProvider ? t(selectedProvider.name_ar, selectedProvider.name_en) : ''}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('التاريخ', 'Date')}</Text>
                <Text style={styles.reviewValue}>{serviceDate}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('التشخيص', 'Diagnosis')}</Text>
                <Text style={styles.reviewValue}>{diagnosisCode}</Text>
              </View>
              {selectedSBS && (
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>{t('رمز SBS', 'SBS Code')}</Text>
                  <Text style={[styles.reviewValue, { color: Colors.signalTeal }]}>{selectedSBS.sbs_code}</Text>
                </View>
              )}
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>{t('المبلغ', 'Amount')}</Text>
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
        <Text style={styles.topBarTitle}>{t('مطالبة جديدة', 'New Claim')}</Text>
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
            <Text style={styles.nextText}>{t('التالي', 'Next')}</Text>
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
              {isSubmitting ? t('جاري الإرسال...', 'Submitting...') : t('إرسال المطالبة', 'Submit Claim')}
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
  providerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  providerItemActive: {
    backgroundColor: Colors.signalTeal,
    borderColor: Colors.signalTeal,
  },
  providerInfo: { flex: 1 },
  providerName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  providerCity: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  sbsDropdown: {
    maxHeight: 250,
    overflow: 'hidden',
  },
  sbsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sbsItemLeft: { flex: 1 },
  sbsItemCode: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    color: Colors.signalTeal,
  },
  sbsItemDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  sbsItemPrice: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    marginLeft: 8,
  },
  priorAuthBadge: {
    backgroundColor: `${Colors.warning}30`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  priorAuthBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: Colors.warning,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: `${Colors.warning}15`,
    borderWidth: 1,
    borderColor: `${Colors.warning}30`,
  },
  warningText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.warning,
    flex: 1,
  },
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
