import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';
import { apiRequest } from '@/lib/query-client';

interface Notification {
  id: number;
  type: string;
  title_en: string;
  title_ar: string | null;
  body_en: string;
  body_ar: string | null;
  is_read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  claim_submitted: 'document-text-outline',
  prior_auth_submitted: 'clipboard-outline',
  claim_approved: 'checkmark-circle-outline',
  claim_denied: 'close-circle-outline',
  payment_received: 'card-outline',
  coverage_alert: 'warning-outline',
  info: 'information-circle-outline',
};

const TYPE_COLOR: Record<string, string> = {
  claim_submitted: Colors.signalTeal,
  prior_auth_submitted: Colors.medicalBlue ?? '#3b82f6',
  claim_approved: Colors.success ?? '#22c55e',
  claim_denied: '#ef4444',
  payment_received: Colors.success ?? '#22c55e',
  coverage_alert: Colors.warning ?? '#f59e0b',
  info: Colors.textSecondary,
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/notifications', showUnreadOnly],
    queryFn: async () => {
      const url = showUnreadOnly ? '/api/notifications?unread=true' : '/api/notifications';
      const res = await apiRequest('GET', url);
      return res.json() as Promise<{ notifications: Notification[]; unreadCount: number }>;
    },
    enabled: isAuthenticated,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('PATCH', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  const notifications: Notification[] = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.midnightBlue, '#0f2240', '#0a1628']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 + webTopInset }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{t('الإشعارات', 'Notifications')}</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <Pressable
            onPress={() => markAllReadMutation.mutate()}
            style={styles.markAllBtn}
            disabled={markAllReadMutation.isPending}
          >
            <Text style={styles.markAllText}>{t('قراءة الكل', 'Mark all read')}</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Toggle */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setShowUnreadOnly(false)}
          style={[styles.filterBtn, !showUnreadOnly && styles.filterBtnActive]}
        >
          <Text style={[styles.filterBtnText, !showUnreadOnly && styles.filterBtnTextActive]}>
            {t('الكل', 'All')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setShowUnreadOnly(true)}
          style={[styles.filterBtn, showUnreadOnly && styles.filterBtnActive]}
        >
          <Text style={[styles.filterBtnText, showUnreadOnly && styles.filterBtnTextActive]}>
            {t('غير مقروء', 'Unread')}
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.signalTeal} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>
            {t('لا توجد إشعارات', 'No notifications')}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {notifications.map((n) => {
            const icon = TYPE_ICON[n.type] ?? TYPE_ICON.info;
            const color = TYPE_COLOR[n.type] ?? TYPE_COLOR.info;
            const title = language === 'ar' ? (n.title_ar || n.title_en) : n.title_en;
            const body  = language === 'ar' ? (n.body_ar  || n.body_en)  : n.body_en;

            return (
              <Pressable
                key={n.id}
                onPress={() => {
                  if (!n.is_read) markReadMutation.mutate(n.id);
                }}
              >
                <GlassCard
                  variant="surface"
                  style={n.is_read ? { ...styles.card, ...styles.cardRead } : styles.card}
                  padding={14}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.iconWrap, { backgroundColor: `${color}20` }]}>
                      <Ionicons name={icon} size={22} color={color} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.cardTitleRow}>
                        <Text style={[styles.cardTitle, n.is_read && styles.cardTitleRead]}>
                          {title}
                        </Text>
                        {!n.is_read && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
                      </View>
                      <Text style={styles.cardBody} numberOfLines={3}>
                        {body}
                      </Text>
                      <Text style={styles.cardDate}>{formatDate(n.created_at)}</Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
  },
  headerBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.deepOrange ?? '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: '#fff',
  },
  markAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  markAllText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.signalTeal,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: {
    backgroundColor: Colors.signalTeal,
  },
  filterBtnText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  filterBtnTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    gap: 8,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  card: { marginBottom: 0 },
  cardRead: { opacity: 0.65 },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1, gap: 3 },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
    flex: 1,
  },
  cardTitleRead: {
    fontFamily: 'Inter_400Regular',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardBody: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  cardDate: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.professionalGray ?? Colors.textSecondary,
    marginTop: 2,
  },
});
