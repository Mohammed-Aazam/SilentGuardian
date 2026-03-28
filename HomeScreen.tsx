// src/screens/HomeScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';
import { loadHistory, loadBaseline } from '../lib/storage';
import { CheckInEntry, BaselineStats } from '../lib/types';

function getStreakCount(history: CheckInEntry[]): number {
  if (history.length === 0) return 0;
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  let streak = 0;
  let expectedDate = new Date();
  expectedDate.setHours(0, 0, 0, 0);
  for (const entry of sorted) {
    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (expectedDate.getTime() - entryDate.getTime()) / 86400000
    );
    if (diff === 0 || diff === 1) {
      streak++;
      expectedDate = entryDate;
    } else {
      break;
    }
  }
  return streak;
}

function hasTodayEntry(history: CheckInEntry[]): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return history.some((e) => e.date.slice(0, 10) === today);
}

export default function HomeScreen({ navigation }: any) {
  const [history, setHistory] = useState<CheckInEntry[]>([]);
  const [baseline, setBaseline] = useState<BaselineStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [h, b] = await Promise.all([loadHistory(), loadBaseline()]);
    setHistory(h);
    setBaseline(b);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const streak = getStreakCount(history);
  const todayDone = hasTodayEntry(history);
  const recentAlerts = history.filter((e) => e.analysis.flagForFamilyReview).length;
  const lastEntry = history.length > 0 ? history[history.length - 1] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingLabel}>Today</Text>
          <Text style={styles.greetingDate}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>

        {/* Disclaimer banner */}
        <View style={styles.disclaimerBanner}>
          <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            Not a medical tool. Patterns only, not diagnosis.
          </Text>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="flame-outline"
            value={String(streak)}
            label="day streak"
            color={streak > 6 ? Colors.brand : Colors.textSecondary}
          />
          <StatCard
            icon="document-text-outline"
            value={String(history.length)}
            label="total check-ins"
            color={Colors.textSecondary}
          />
          <StatCard
            icon="alert-circle-outline"
            value={String(recentAlerts)}
            label="review flags"
            color={recentAlerts > 0 ? Colors.watch : Colors.textSecondary}
          />
        </View>

        {/* Main CTA */}
        {!todayDone ? (
          <TouchableOpacity
            style={styles.ctaCard}
            onPress={() => navigation.navigate('CheckIn')}
            activeOpacity={0.88}
          >
            <View style={styles.ctaCardInner}>
              <View style={styles.ctaIconCircle}>
                <Ionicons name="create-outline" size={26} color={Colors.textOnDark} />
              </View>
              <View style={styles.ctaCardText}>
                <Text style={styles.ctaCardTitle}>Start today's check-in</Text>
                <Text style={styles.ctaCardSub}>
                  Takes about 2 minutes
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.doneCard}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.low} />
            <View style={{ flex: 1 }}>
              <Text style={styles.doneTitle}>Check-in complete</Text>
              <Text style={styles.doneSub}>Come back tomorrow</Text>
            </View>
            {lastEntry && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Result', { entryId: lastEntry.id })}
              >
                <Text style={styles.viewResult}>View</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Baseline summary */}
        {baseline && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Baseline</Text>
            <View style={styles.baselineCard}>
              <BaselineRow
                label="Avg word count"
                value={String(baseline.avgWordCount)}
              />
              <BaselineRow
                label="Avg sentence length"
                value={`${baseline.avgWordsPerSentence} words`}
              />
              <BaselineRow
                label="Vocabulary variety"
                value={`${Math.round(baseline.avgUniqueWordRatio * 100)}%`}
              />
              <BaselineRow
                label="Built from"
                value={`${baseline.sampleCount} check-ins`}
                last
              />
            </View>
          </View>
        )}

        {/* Recent entries */}
        {history.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {[...history]
              .reverse()
              .slice(0, 3)
              .map((entry) => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('Result', { entryId: entry.id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.recentLeft}>
                    <View
                      style={[
                        styles.cautionDot,
                        { backgroundColor: cautionColor(entry.analysis.cautionLevel) },
                      ]}
                    />
                    <View>
                      <Text style={styles.recentDate}>
                        {new Date(entry.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.recentSummary} numberOfLines={1}>
                        {entry.analysis.summary}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon as any} size={18} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function BaselineRow({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[baselineStyles.row, !last && baselineStyles.rowBorder]}>
      <Text style={baselineStyles.label}>{label}</Text>
      <Text style={baselineStyles.value}>{value}</Text>
    </View>
  );
}

function cautionColor(level: string): string {
  if (level === 'watch') return Colors.watch;
  if (level === 'moderate') return Colors.moderate;
  return Colors.low;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  greeting: { marginBottom: Spacing.base },
  greetingLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.brand,
    fontWeight: Typography.weights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  greetingDate: {
    fontSize: Typography.sizes.xl,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  disclaimerText: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  ctaCard: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    ...Shadow.md,
  },
  ctaCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ctaIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaCardText: { flex: 1 },
  ctaCardTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnDark,
    marginBottom: 2,
  },
  ctaCardSub: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  doneCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.lowBorder,
    ...Shadow.sm,
  },
  doneTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  doneSub: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  viewResult: {
    fontSize: Typography.sizes.sm,
    color: Colors.brand,
    fontWeight: Typography.weights.semibold,
  },
  section: { marginBottom: Spacing.xl },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  baselineCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  recentCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  cautionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  recentDate: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  recentSummary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    maxWidth: 240,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  value: {
    fontSize: Typography.sizes.lg,
    fontFamily: 'Georgia',
    fontWeight: '700',
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});

const baselineStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  label: { fontSize: Typography.sizes.sm, color: Colors.textSecondary },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
});
