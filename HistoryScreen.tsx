// src/screens/HistoryScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';
import { loadHistory, deleteHistory, deleteBaseline, resetAllData } from '../lib/storage';
import { CheckInEntry, CautionLevel } from '../lib/types';

function cautionColor(level: CautionLevel) {
  if (level === 'watch') return Colors.watch;
  if (level === 'moderate') return Colors.moderate;
  return Colors.low;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [history, setHistory] = useState<CheckInEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory().then((h) => setHistory([...h].reverse()));
    }, [])
  );

  const handleReset = () => {
    Alert.alert(
      'Reset all data',
      'This will delete all check-ins, your baseline, and all alerts. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            setHistory([]);
            navigation.reset({ index: 0, routes: [{ name: 'HomeTab' }] });
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: CheckInEntry }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => navigation.navigate('HomeTab', { screen: 'Result', params: { entryId: item.id } })}
      activeOpacity={0.75}
    >
      <View style={[styles.colorBar, { backgroundColor: cautionColor(item.analysis.cautionLevel) }]} />
      <View style={styles.entryContent}>
        <View style={styles.entryTop}>
          <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
          <View style={[styles.cautionChip, { borderColor: cautionColor(item.analysis.cautionLevel) }]}>
            <Text style={[styles.cautionChipText, { color: cautionColor(item.analysis.cautionLevel) }]}>
              {item.analysis.cautionLevel}
            </Text>
          </View>
        </View>
        <Text style={styles.entrySummary} numberOfLines={2}>
          {item.analysis.summary}
        </Text>
        <View style={styles.entrySignals}>
          <SignalPill icon="text-outline" value={`${item.signals.wordCount}w`} />
          <SignalPill icon="library-outline" value={`${Math.round(item.signals.uniqueWordRatio * 100)}%`} />
          {item.signals.repeatedPhrases.length > 0 && (
            <SignalPill icon="repeat-outline" value={`${item.signals.repeatedPhrases.length} repeats`} warn />
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in history</Text>
        <Text style={styles.headerSub}>{history.length} entries</Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="document-text-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No check-ins yet</Text>
          <Text style={styles.emptySub}>
            Complete your first daily check-in to see history here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
              <Ionicons name="trash-outline" size={16} color={Colors.watch} />
              <Text style={styles.resetText}>Reset all data</Text>
            </TouchableOpacity>
          }
        />
      )}
    </SafeAreaView>
  );
}

function SignalPill({ icon, value, warn }: { icon: string; value: string; warn?: boolean }) {
  return (
    <View style={[pillStyles.pill, warn && pillStyles.pillWarn]}>
      <Ionicons name={icon as any} size={11} color={warn ? Colors.moderate : Colors.textMuted} />
      <Text style={[pillStyles.text, warn && pillStyles.textWarn]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
  },
  headerSub: { fontSize: Typography.sizes.sm, color: Colors.textMuted, marginTop: 2 },
  list: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.sm },
  entryCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  colorBar: { width: 4, alignSelf: 'stretch' },
  entryContent: { flex: 1, padding: Spacing.base, gap: Spacing.sm },
  entryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textPrimary,
  },
  cautionChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  cautionChipText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
  entrySummary: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  entrySignals: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.sizes.base * 1.6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingVertical: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
    borderRadius: Radius.md,
  },
  resetText: {
    fontSize: Typography.sizes.sm,
    color: Colors.watch,
    fontWeight: Typography.weights.medium,
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.full,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
  },
  pillWarn: { backgroundColor: Colors.moderateBg },
  text: { fontSize: Typography.sizes.xs, color: Colors.textMuted },
  textWarn: { color: Colors.moderate },
});
