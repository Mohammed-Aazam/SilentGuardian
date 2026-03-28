// src/screens/ResultScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';
import { loadHistory } from '../lib/storage';
import { CheckInEntry, CautionLevel } from '../lib/types';

const CAUTION_CONFIG: Record<
  CautionLevel,
  { bg: string; border: string; icon: string; iconColor: string; label: string; textColor: string }
> = {
  low: {
    bg: Colors.lowBg,
    border: Colors.lowBorder,
    icon: 'checkmark-circle-outline',
    iconColor: Colors.low,
    label: 'Within normal range',
    textColor: Colors.low,
  },
  moderate: {
    bg: Colors.moderateBg,
    border: Colors.moderateBorder,
    icon: 'alert-circle-outline',
    iconColor: Colors.moderate,
    label: 'Mild variation noticed',
    textColor: Colors.moderate,
  },
  watch: {
    bg: Colors.watchBg,
    border: Colors.watchBorder,
    icon: 'eye-outline',
    iconColor: Colors.watch,
    label: 'Worth watching',
    textColor: Colors.watch,
  },
};

export default function ResultScreen({ route, navigation }: any) {
  const { entryId } = route.params;
  const [entry, setEntry] = useState<CheckInEntry | null>(null);

  useEffect(() => {
    loadHistory().then((h) => {
      const found = h.find((e) => e.id === entryId);
      setEntry(found ?? null);
    });
  }, [entryId]);

  if (!entry) {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { analysis, signals, deltas } = entry;
  const caution = CAUTION_CONFIG[analysis.cautionLevel];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Caution level badge */}
        <View style={[styles.cautionBadge, { backgroundColor: caution.bg, borderColor: caution.border }]}>
          <Ionicons name={caution.icon as any} size={20} color={caution.iconColor} />
          <Text style={[styles.cautionLabel, { color: caution.textColor }]}>
            {caution.label}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>{analysis.summary}</Text>
        </View>

        {/* Signal comparison row */}
        <Text style={styles.sectionTitle}>Language signals</Text>
        <View style={styles.signalGrid}>
          <SignalCard
            label="Word count"
            today={signals.wordCount}
            delta={deltas.wordCountDelta}
            unit="words"
            isPercent
          />
          <SignalCard
            label="Vocabulary"
            today={Math.round(signals.uniqueWordRatio * 100)}
            delta={Math.round(deltas.uniqueRatioDelta * 100)}
            unit="%"
          />
          <SignalCard
            label="Sentence length"
            today={signals.avgWordsPerSentence}
            delta={deltas.sentenceLengthDelta}
            unit="words/sen"
          />
          <SignalCard
            label="Pause markers"
            today={signals.longPauseMarkers}
            delta={0}
            unit=""
            noDelta
          />
        </View>

        {/* Repeated phrases */}
        {signals.repeatedPhrases.length > 0 && (
          <View style={styles.phrasesCard}>
            <Text style={styles.phrasesTitle}>Repeated phrases detected</Text>
            <View style={styles.phrasesList}>
              {signals.repeatedPhrases.map((p) => (
                <View key={p} style={styles.phraseChip}>
                  <Text style={styles.phraseChipText}>"{p}"</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Analysis sections */}
        <AnalysisSection
          icon="swap-horizontal-outline"
          title="What changed"
          content={analysis.whatChanged}
        />
        <AnalysisSection
          icon="trending-up-outline"
          title="Why it matters"
          content={analysis.whyItMatters}
        />
        <AnalysisSection
          icon="footsteps-outline"
          title="Suggested next step"
          content={analysis.suggestedNextStep}
          accent
        />

        {/* Family alert card */}
        {analysis.flagForFamilyReview && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.alertDot} />
              <Text style={styles.alertTitle}>Family review suggested</Text>
            </View>
            <Text style={styles.alertBody}>{analysis.suggestedNextStep}</Text>
            <Text style={styles.alertDisclaimer}>
              This is not a medical alert. Please do not treat this as a
              diagnosis or emergency indicator.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity style={styles.alertBtn}>
                <Ionicons name="checkmark" size={14} color={Colors.textOnDark} />
                <Text style={styles.alertBtnText}>Mark reviewed</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertBtnSecondary}>
                <Ionicons name="share-outline" size={14} color={Colors.watch} />
                <Text style={styles.alertBtnSecondaryText}>Share note</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Safety note */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.safetyText}>{analysis.safetyNote}</Text>
        </View>

        {/* Single day disclaimer */}
        <Text style={styles.disclaimer}>{analysis.singleDayDisclaimer}</Text>

        {/* Back to home */}
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SignalCard({
  label,
  today,
  delta,
  unit,
  isPercent,
  noDelta,
}: {
  label: string;
  today: number;
  delta: number;
  unit: string;
  isPercent?: boolean;
  noDelta?: boolean;
}) {
  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < (isPercent ? 5 : 0.5);
  const deltaColor = isNeutral
    ? Colors.textMuted
    : isPositive
    ? Colors.low
    : Colors.moderate;

  return (
    <View style={signalStyles.card}>
      <Text style={signalStyles.label}>{label}</Text>
      <Text style={signalStyles.value}>
        {today}
        <Text style={signalStyles.unit}> {unit}</Text>
      </Text>
      {!noDelta && (
        <View style={signalStyles.deltaRow}>
          <Ionicons
            name={isNeutral ? 'remove' : isPositive ? 'arrow-up' : 'arrow-down'}
            size={12}
            color={deltaColor}
          />
          <Text style={[signalStyles.delta, { color: deltaColor }]}>
            {isPercent
              ? `${Math.abs(delta)}%`
              : `${Math.abs(delta)} ${unit}`}
          </Text>
        </View>
      )}
    </View>
  );
}

function AnalysisSection({
  icon,
  title,
  content,
  accent,
}: {
  icon: string;
  title: string;
  content: string;
  accent?: boolean;
}) {
  return (
    <View style={[sectionStyles.card, accent && sectionStyles.accentCard]}>
      <View style={sectionStyles.header}>
        <Ionicons
          name={icon as any}
          size={16}
          color={accent ? Colors.brand : Colors.textMuted}
        />
        <Text style={[sectionStyles.title, accent && sectionStyles.accentTitle]}>
          {title}
        </Text>
      </View>
      <Text style={sectionStyles.body}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: Colors.textSecondary },
  cautionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    alignSelf: 'flex-start',
    marginBottom: Spacing.base,
  },
  cautionLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  summaryText: {
    fontSize: Typography.sizes.base,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
    lineHeight: Typography.sizes.base * 1.7,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  phrasesCard: {
    backgroundColor: Colors.moderateBg,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.moderateBorder,
  },
  phrasesTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.moderate,
    marginBottom: Spacing.sm,
  },
  phrasesList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  phraseChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.moderateBorder,
  },
  phraseChipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.moderate,
    fontStyle: 'italic',
  },
  alertCard: {
    backgroundColor: Colors.watchBg,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
    gap: Spacing.sm,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.watch,
  },
  alertTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.watch,
  },
  alertBody: {
    fontSize: Typography.sizes.base,
    color: Colors.watch,
    lineHeight: Typography.sizes.base * 1.6,
  },
  alertDisclaimer: {
    fontSize: Typography.sizes.xs,
    color: Colors.watchBorder,
    fontStyle: 'italic',
  },
  alertActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  alertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.watch,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  alertBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textOnDark,
    fontWeight: Typography.weights.medium,
  },
  alertBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
  },
  alertBtnSecondaryText: {
    fontSize: Typography.sizes.sm,
    color: Colors.watch,
    fontWeight: Typography.weights.medium,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  safetyText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    lineHeight: Typography.sizes.sm * 1.6,
    fontStyle: 'italic',
  },
  disclaimer: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: Typography.sizes.xs * 1.6,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.base,
  },
  homeBtn: {
    borderWidth: 1.5,
    borderColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: Typography.sizes.base,
    color: Colors.brand,
    fontWeight: Typography.weights.semibold,
  },
});

const signalStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '47.5%',
    gap: 4,
    ...Shadow.sm,
  },
  label: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: Typography.sizes.xl,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
  },
  unit: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    fontFamily: 'System',
  },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  delta: { fontSize: Typography.sizes.xs },
});

const sectionStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  accentCard: {
    backgroundColor: Colors.brandMuted,
    borderColor: Colors.lowBorder,
    marginBottom: Spacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accentTitle: { color: Colors.brand },
  body: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    lineHeight: Typography.sizes.base * 1.65,
  },
});
