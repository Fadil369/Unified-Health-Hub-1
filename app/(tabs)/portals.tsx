import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useLanguage } from '@/contexts/LanguageContext';
import { GlassCard } from '@/components/GlassCard';

// ─── Portal data ──────────────────────────────────────────────────────────────

type PortalStatus = 'online' | 'offline' | 'maintenance';

interface Portal {
  id: string;
  nameAr: string;
  nameEn: string;
  cityAr: string;
  cityEn: string;
  url: string;
  status: PortalStatus;
  category: 'oracle' | 'moh';
  backendIp?: string;
  noteAr?: string;
  noteEn?: string;
}

const PORTALS: Portal[] = [
  // Oracle ERP — 6 cities
  {
    id: 'khamis',
    nameAr: 'خميس مشيط',
    nameEn: 'Khamis Mushait',
    cityAr: 'خميس مشيط',
    cityEn: 'Khamis Mushait',
    url: 'https://oracle.elfadil.com',
    status: 'online',
    category: 'oracle',
    backendIp: '172.30.0.77',
    noteAr: 'البوابة الرئيسية',
    noteEn: 'Primary portal',
  },
  {
    id: 'riyadh',
    nameAr: 'الرياض',
    nameEn: 'Riyadh',
    cityAr: 'الرياض',
    cityEn: 'Riyadh',
    url: 'https://oracle-riyadh.elfadil.com',
    status: 'online',
    category: 'oracle',
    backendIp: '128.1.1.185',
    noteAr: 'HTTPS Backend',
    noteEn: 'HTTPS Backend',
  },
  {
    id: 'madinah',
    nameAr: 'المدينة المنورة',
    nameEn: 'Madinah',
    cityAr: 'المدينة المنورة',
    cityEn: 'Madinah',
    url: 'https://oracle-madinah.elfadil.com',
    status: 'offline',
    category: 'oracle',
    backendIp: '172.25.11.26',
    noteAr: 'قيد التحقيق',
    noteEn: 'Under investigation',
  },
  {
    id: 'unaizah',
    nameAr: 'عنيزة',
    nameEn: 'Unaizah',
    cityAr: 'عنيزة',
    cityEn: 'Unaizah',
    url: 'https://oracle-unaizah.elfadil.com',
    status: 'online',
    category: 'oracle',
    backendIp: '10.0.100.105',
    noteAr: 'يعمل بشكل طبيعي',
    noteEn: 'Working',
  },
  {
    id: 'jizan',
    nameAr: 'جيزان',
    nameEn: 'Jizan',
    cityAr: 'جيزان',
    cityEn: 'Jizan',
    url: 'https://oracle-jizan.elfadil.com',
    status: 'online',
    category: 'oracle',
    backendIp: '172.17.4.84',
    noteAr: 'يعمل بشكل طبيعي',
    noteEn: 'Working',
  },
  {
    id: 'abha',
    nameAr: 'أبها',
    nameEn: 'Abha',
    cityAr: 'أبها',
    cityEn: 'Abha',
    url: 'https://oracle-abha.elfadil.com',
    status: 'offline',
    category: 'oracle',
    backendIp: '172.19.1.1',
    noteAr: 'قيد التحقيق',
    noteEn: 'Under investigation',
  },
  // MOH Systems — 2 portals
  {
    id: 'moh-claims',
    nameAr: 'مطالبات وزارة الصحة',
    nameEn: 'MOH Claims',
    cityAr: '',
    cityEn: '',
    url: 'https://moh-claims.elfadil.com',
    status: 'online',
    category: 'moh',
    backendIp: 'e-claims.globemedsaudi.com',
    noteAr: 'نظام خارجي',
    noteEn: 'External system',
  },
  {
    id: 'moh-approval',
    nameAr: 'موافقات وزارة الصحة',
    nameEn: 'MOH Approval',
    cityAr: '',
    cityEn: '',
    url: 'https://moh-approval.elfadil.com',
    status: 'online',
    category: 'moh',
    backendIp: 'purchasingprogramsaudi.com',
    noteAr: 'نظام خارجي',
    noteEn: 'External system',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(status: PortalStatus): string {
  if (status === 'online') return Colors.success;
  if (status === 'offline') return Colors.error;
  return Colors.warning;
}

function statusLabel(status: PortalStatus, language: string): string {
  if (language === 'ar') {
    if (status === 'online') return 'متاح';
    if (status === 'offline') return 'غير متاح';
    return 'صيانة';
  }
  if (status === 'online') return 'Online';
  if (status === 'offline') return 'Offline';
  return 'Maintenance';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PortalCard({ portal, language, onPress }: { portal: Portal; language: string; onPress: () => void }) {
  const isOnline = portal.status === 'online';
  const color = statusColor(portal.status);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.85 }]}>
      <GlassCard variant="surface" padding={14} style={styles.portalCard}>
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />

        <View style={styles.portalContent}>
          {/* Header row */}
          <View style={styles.portalHeader}>
            <View style={styles.portalTitleGroup}>
              <Text style={styles.portalName}>
                {language === 'ar' ? portal.nameAr : portal.nameEn}
              </Text>
              {(portal.cityEn || portal.cityAr) ? (
                <Text style={styles.portalCity}>
                  {language === 'ar' ? portal.cityAr : portal.cityEn}
                </Text>
              ) : null}
            </View>

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: `${color}22`, borderColor: `${color}66` }]}>
              <View style={[styles.statusDot, { backgroundColor: color }]} />
              <Text style={[styles.statusText, { color }]}>
                {statusLabel(portal.status, language)}
              </Text>
            </View>
          </View>

          {/* Note row */}
          {portal.noteEn && (
            <Text style={styles.portalNote}>
              {language === 'ar' ? portal.noteAr : portal.noteEn}
            </Text>
          )}

          {/* URL + launch row */}
          <View style={styles.portalFooter}>
            <Text style={styles.portalUrl} numberOfLines={1}>
              {portal.url.replace('https://', '')}
            </Text>
            <View style={[styles.launchBtn, { backgroundColor: isOnline ? Colors.signalTeal : Colors.professionalGray }]}>
              <Ionicons name="open-outline" size={14} color="#fff" />
            </View>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBadge}>
        <Text style={styles.sectionBadgeText}>{count}</Text>
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PortalsScreen() {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'oracle' | 'moh'>('all');

  const webTopInset = Platform.OS === 'web' ? 67 : 0;

  // Stats
  const onlineCount = PORTALS.filter((p) => p.status === 'online').length;
  const totalCount = PORTALS.length;
  const availability = Math.round((onlineCount / totalCount) * 100);

  // Filtering
  const filtered = PORTALS.filter((p) => {
    const matchesCategory = activeFilter === 'all' || p.category === activeFilter;
    const query = search.toLowerCase();
    const matchesSearch =
      query === '' ||
      p.nameEn.toLowerCase().includes(query) ||
      p.nameAr.includes(query) ||
      p.url.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const oraclePortals = filtered.filter((p) => p.category === 'oracle');
  const mohPortals = filtered.filter((p) => p.category === 'moh');

  const handleOpen = useCallback(
    async (portal: Portal) => {
      if (portal.status === 'offline') {
        Alert.alert(
          t('البوابة غير متاحة', 'Portal Offline'),
          t(
            `بوابة ${portal.nameAr} غير متاحة حالياً. قيد التحقيق.`,
            `${portal.nameEn} portal is currently offline. Under investigation.`,
          ),
          [
            { text: t('إلغاء', 'Cancel'), style: 'cancel' },
            {
              text: t('فتح على أي حال', 'Open anyway'),
              onPress: () => Linking.openURL(portal.url),
            },
          ],
        );
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(portal.url);
      if (supported) {
        Linking.openURL(portal.url);
      } else {
        Alert.alert(t('خطأ', 'Error'), t('لا يمكن فتح الرابط', 'Cannot open URL'));
      }
    },
    [t],
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.midnightBlue, '#0f2240', '#0a1628']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12 + webTopInset, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.heading}>{t('بوابات المستشفيات', 'Hospital Portals')}</Text>
            <Text style={styles.subheading}>{t('وصول مركزي لجميع الأنظمة', 'Centralised access to all systems')}</Text>
          </View>
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityPct}>{availability}%</Text>
            <Text style={styles.availabilityLabel}>{t('متاح', 'Uptime')}</Text>
          </View>
        </View>

        {/* ── Stats bar ──────────────────────────────────────────── */}
        <GlassCard variant="elevated" style={styles.statsCard} padding={14}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCount}</Text>
              <Text style={styles.statLabel}>{t('إجمالي البوابات', 'Total Portals')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.success }]}>{onlineCount}</Text>
              <Text style={styles.statLabel}>{t('متاحة', 'Online')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.error }]}>{totalCount - onlineCount}</Text>
              <Text style={styles.statLabel}>{t('غير متاحة', 'Offline')}</Text>
            </View>
          </View>
          {/* Availability progress bar */}
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${availability}%` }]} />
          </View>
        </GlassCard>

        {/* ── Search ─────────────────────────────────────────────── */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('بحث عن بوابة...', 'Search portals...')}
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* ── Category filters ───────────────────────────────────── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersRow}>
          {(['all', 'oracle', 'moh'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => { Haptics.selectionAsync(); setActiveFilter(f); }}
              style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, activeFilter === f && styles.filterChipTextActive]}>
                {f === 'all' ? t('الكل', 'All') : f === 'oracle' ? t('أوراكل ERP', 'Oracle ERP') : t('وزارة الصحة', 'MOH')}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Oracle ERP section ─────────────────────────────────── */}
        {oraclePortals.length > 0 && (
          <>
            <SectionHeader
              title={t('أنظمة أوراكل ERP', 'Oracle ERP Systems')}
              count={oraclePortals.length}
            />
            {oraclePortals.map((portal) => (
              <PortalCard
                key={portal.id}
                portal={portal}
                language={language}
                onPress={() => handleOpen(portal)}
              />
            ))}
          </>
        )}

        {/* ── MOH section ────────────────────────────────────────── */}
        {mohPortals.length > 0 && (
          <>
            <SectionHeader
              title={t('أنظمة وزارة الصحة', 'MOH Systems')}
              count={mohPortals.length}
            />
            {mohPortals.map((portal) => (
              <PortalCard
                key={portal.id}
                portal={portal}
                language={language}
                onPress={() => handleOpen(portal)}
              />
            ))}
          </>
        )}

        {/* ── Empty state ────────────────────────────────────────── */}
        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={40} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>{t('لا توجد نتائج', 'No portals found')}</Text>
          </View>
        )}

        {/* ── Info footer ────────────────────────────────────────── */}
        <GlassCard variant="surface" style={styles.infoCard} padding={14}>
          <View style={styles.infoRow}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.signalTeal} />
            <Text style={styles.infoText}>
              {t(
                'جميع البوابات تعمل عبر Enhanced-Tunnel (Cloudflare). آخر تحقق: 09/03/2026',
                'All portals route through Enhanced-Tunnel (Cloudflare). Last checked: 09/03/2026',
              )}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surfaceDark },
  scrollContent: { paddingHorizontal: 16 },

  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  availabilityBadge: {
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  availabilityPct: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    color: Colors.success,
  },
  availabilityLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    color: Colors.success,
  },

  // Stats card
  statsCard: { marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22, fontFamily: 'Inter_700Bold', color: Colors.textPrimary },
  statLabel: { fontSize: 11, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.success,
  },

  // Search
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 42,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
  },

  // Filters
  filtersRow: { gap: 8, paddingRight: 16, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterChipActive: {
    backgroundColor: Colors.signalTeal,
    borderColor: Colors.signalTeal,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: Colors.textSecondary,
  },
  filterChipTextActive: { color: '#fff' },

  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  sectionBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  sectionBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
  },

  // Portal card
  cardPressable: { marginBottom: 10 },
  portalCard: { flexDirection: 'row', paddingLeft: 0 },
  accentBar: { width: 4, borderRadius: 4, marginRight: 12, minHeight: 60 },
  portalContent: { flex: 1, gap: 4 },
  portalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portalTitleGroup: { flex: 1, gap: 1 },
  portalName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textPrimary,
  },
  portalCity: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  portalNote: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
  },
  portalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  portalUrl: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    color: Colors.signalTeal,
    flex: 1,
  },
  launchBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: Colors.textSecondary },

  // Info footer
  infoCard: { marginTop: 8 },
  infoRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  infoText: {
    flex: 1,
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: Colors.textSecondary,
    lineHeight: 16,
  },
});
