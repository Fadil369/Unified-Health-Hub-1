import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Image, TextInput, Alert } from 'react-native';
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
import { apiRequest, getApiUrl } from '@/lib/query-client';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user, logout, updateProfile } = useAuth();
  const webTopInset = Platform.OS === 'web' ? 67 : 0;
  const [isEditing, setIsEditing] = useState(false);
  const [editNameEn, setEditNameEn] = useState(user?.nameEn || '');
  const [editNameAr, setEditNameAr] = useState(user?.nameAr || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editNationalId, setEditNationalId] = useState(user?.nationalId || '');

  const { data: paymentData } = useQuery({
    queryKey: ['/api/payments/history'],
    enabled: !!user?.memberId,
  });

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleSaveProfile = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await updateProfile({
      nameEn: editNameEn,
      nameAr: editNameAr,
      phone: editPhone,
      nationalId: editNationalId,
    });
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditing(false);
    } else {
      Alert.alert(t('خطأ', 'Error'), t('فشل تحديث الملف الشخصي', 'Failed to update profile'));
    }
  };

  const menuItems = [
    { icon: 'shield-checkmark-outline' as const, label: t('تفاصيل التغطية', 'Coverage Details'), route: '/(tabs)/wallet' },
    { icon: 'card-outline' as const, label: t('الاستحقاقات', 'Benefits'), route: '/(tabs)/wallet' },
    { icon: 'receipt-outline' as const, label: t('سجل المدفوعات', 'Payment History'), route: '/(tabs)/wallet' },
    { icon: 'settings-outline' as const, label: t('الإعدادات', 'Settings'), route: '/profile/settings' },
  ];

  const summary = paymentData?.summary;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />
      <View style={[styles.topBar, { paddingTop: insets.top + 8 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.topBarTitle}>{t('الملف الشخصي', 'Profile')}</Text>
        <Pressable onPress={() => isEditing ? handleSaveProfile() : setIsEditing(true)} style={styles.backButton}>
          <Ionicons name={isEditing ? 'checkmark' : 'create-outline'} size={20} color={Colors.signalTeal} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom + (Platform.OS === 'web' ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color={Colors.signalTeal} />
            </View>
          )}
          <Text style={styles.userName}>{user?.nameEn || user?.username || 'User'}</Text>
          {user?.nameAr ? <Text style={styles.userNameAr}>{user.nameAr}</Text> : null}
          <Text style={styles.memberId}>{user?.memberId}</Text>
          {user?.githubConnected && (
            <View style={styles.githubBadge}>
              <Ionicons name="logo-github" size={14} color="#fff" />
              <Text style={styles.githubBadgeText}>GitHub Connected</Text>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>{t('المعلومات الشخصية', 'Personal Information')}</Text>
        <GlassCard style={styles.infoCard}>
          {isEditing ? (
            <>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>{t('الاسم (EN)', 'Name (EN)')}</Text>
                <TextInput
                  style={styles.editInput}
                  value={editNameEn}
                  onChangeText={setEditNameEn}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.professionalGray}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>{t('الاسم (AR)', 'Name (AR)')}</Text>
                <TextInput
                  style={[styles.editInput, { textAlign: 'right' }]}
                  value={editNameAr}
                  onChangeText={setEditNameAr}
                  placeholder="الاسم بالعربية"
                  placeholderTextColor={Colors.professionalGray}
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>{t('الهاتف', 'Phone')}</Text>
                <TextInput
                  style={styles.editInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+966 50 xxx xxxx"
                  placeholderTextColor={Colors.professionalGray}
                  keyboardType="phone-pad"
                />
              </View>
              <View style={styles.editRow}>
                <Text style={styles.editLabel}>{t('الهوية', 'National ID')}</Text>
                <TextInput
                  style={styles.editInput}
                  value={editNationalId}
                  onChangeText={setEditNationalId}
                  placeholder="National ID"
                  placeholderTextColor={Colors.professionalGray}
                />
              </View>
            </>
          ) : (
            <>
              <InfoRow icon="card-outline" label={t('الهوية الوطنية', 'National ID')} value={user?.nationalId || t('غير محدد', 'Not set')} />
              <View style={styles.infoDivider} />
              <InfoRow icon="mail-outline" label={t('البريد الإلكتروني', 'Email')} value={user?.email || '—'} />
              <View style={styles.infoDivider} />
              <InfoRow icon="call-outline" label={t('الهاتف', 'Phone')} value={user?.phone || t('غير محدد', 'Not set')} />
            </>
          )}
        </GlassCard>

        {summary && (summary.totalClaims > 0 || summary.totalPaid > 0) && (
          <>
            <Text style={styles.sectionTitle}>{t('ملخص المدفوعات', 'Payment Summary')}</Text>
            <GlassCard style={styles.infoCard}>
              <View style={styles.paymentSummaryRow}>
                <View style={styles.paymentStat}>
                  <Text style={styles.paymentStatValue}>{summary.totalPaid?.toFixed(0) || '0'} SAR</Text>
                  <Text style={styles.paymentStatLabel}>{t('إجمالي المدفوعات', 'Total Paid')}</Text>
                </View>
                <View style={styles.paymentStatDivider} />
                <View style={styles.paymentStat}>
                  <Text style={styles.paymentStatValue}>{summary.totalClaims || 0}</Text>
                  <Text style={styles.paymentStatLabel}>{t('المعاملات', 'Transactions')}</Text>
                </View>
                <View style={styles.paymentStatDivider} />
                <View style={styles.paymentStat}>
                  <Text style={[styles.paymentStatValue, summary.pendingCount > 0 && { color: '#f59e0b' }]}>
                    {summary.pendingCount || 0}
                  </Text>
                  <Text style={styles.paymentStatLabel}>{t('قيد الانتظار', 'Pending')}</Text>
                </View>
              </View>
            </GlassCard>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('القائمة', 'Menu')}</Text>
        {menuItems.map((item, i) => (
          <Pressable key={i} onPress={() => router.push(item.route as any)}>
            <GlassCard variant="surface" style={styles.menuCard} padding={14}>
              <View style={styles.menuRow}>
                <Ionicons name={item.icon} size={20} color={Colors.signalTeal} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={18} color={Colors.professionalGray} />
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.logoutText}>{t('تسجيل الخروج', 'Sign Out')}</Text>
        </Pressable>

        <Text style={styles.version}>BrainSAIT v2.0.0</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={16} color={Colors.signalTeal} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 24,
    marginBottom: 12,
  },
  userName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  userNameAr: {
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberId: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.signalTeal,
    marginTop: 4,
  },
  githubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(36, 41, 46, 0.6)',
  },
  githubBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    color: '#e1e4e8',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    marginBottom: 10,
    marginTop: 8,
  },
  infoCard: { marginBottom: 20 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
    marginLeft: 44,
  },
  editRow: {
    marginBottom: 14,
  },
  editLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  paymentSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentStat: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatValue: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  paymentStatLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  menuCard: { marginBottom: 8 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  logoutText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray,
    textAlign: 'center',
    marginTop: 20,
  },
});
