// src/screens/CheckInScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';
import { computeSignals, compareToBaseline } from '../lib/signals';
import { analyzeCheckIn } from '../lib/claude';
import { loadBaseline, loadHistory, saveCheckIn, saveAlert } from '../lib/storage';
import { DAILY_PROMPTS } from '../lib/constants';
import { CheckInEntry } from '../lib/types';

function getTodaysPrompt(): string {
  const dayIndex = new Date().getDay();
  return DAILY_PROMPTS[dayIndex % DAILY_PROMPTS.length];
}

export default function CheckInScreen({ navigation }: any) {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [phase, setPhase] = useState<'input' | 'analyzing'>('input');

  const prompt = getTodaysPrompt();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const isReady = wordCount >= 15;

  const handleSubmit = async () => {
    if (!isReady) return;
    setIsAnalyzing(true);
    setPhase('analyzing');

    try {
      const [baseline, history] = await Promise.all([
        loadBaseline(),
        loadHistory(),
      ]);

      if (!baseline) {
        Alert.alert('No baseline', 'Please complete onboarding first.');
        navigation.goBack();
        return;
      }

      // 1. Compute signals locally — no network
      const signals = computeSignals(text);

      // 2. Compare to baseline
      const deltas = compareToBaseline(signals, baseline);

      // 3. Call Claude
      const analysis = await analyzeCheckIn({
        todayText: text,
        signals,
        baseline,
        deltas,
        recentHistory: history.slice(-7),
      });

      // 4. Build entry
      const entry: CheckInEntry = {
        id: `${Date.now()}`,
        date: new Date().toISOString(),
        text,
        signals,
        deltas,
        analysis,
      };

      // 5. Persist
      await saveCheckIn(entry);
      if (analysis.flagForFamilyReview) {
        await saveAlert(entry);
      }

      // 6. Navigate to result
      navigation.replace('Result', { entryId: entry.id });
    } catch (err: any) {
      Alert.alert(
        'Analysis failed',
        err?.message ?? 'Please check your connection and try again.',
        [{ text: 'OK', onPress: () => setPhase('input') }]
      );
      setIsAnalyzing(false);
      setPhase('input');
    }
  };

  if (phase === 'analyzing') {
    return (
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <View style={styles.analyzing}>
          <ActivityIndicator size="large" color={Colors.brand} />
          <Text style={styles.analyzingTitle}>Analyzing check-in…</Text>
          <Text style={styles.analyzingSubtitle}>
            Comparing against personal baseline
          </Text>
          <View style={styles.analyzingSteps}>
            {ANALYZING_STEPS.map((step) => (
              <View key={step} style={styles.analyzingStep}>
                <Ionicons name="checkmark-circle-outline" size={16} color={Colors.brand} />
                <Text style={styles.analyzingStepText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Prompt */}
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>Today's prompt</Text>
            <Text style={styles.promptText}>"{prompt}"</Text>
          </View>

          {/* Guidance */}
          <Text style={styles.guidance}>
            Ask your loved one this question and type their response below,
            or have them type it themselves.
          </Text>

          {/* Input */}
          <TextInput
            style={[styles.input, text.length > 0 && styles.inputActive]}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={8}
            placeholder="Write a natural response in their own words…"
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
            autoFocus
          />

          {/* Word count meter */}
          <View style={styles.meterRow}>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  {
                    width: `${Math.min((wordCount / 80) * 100, 100)}%`,
                    backgroundColor: isReady ? Colors.brand : Colors.borderStrong,
                  },
                ]}
              />
            </View>
            <Text style={[styles.wordCountText, isReady && styles.wordCountReady]}>
              {wordCount} {isReady ? '✓' : '/ 15 min'}
            </Text>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Tips for a good check-in</Text>
            {TIPS.map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !isReady && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={!isReady || isAnalyzing}
            activeOpacity={0.85}
          >
            <Text style={styles.submitText}>Analyze check-in</Text>
            <Ionicons name="sparkles-outline" size={18} color={Colors.textOnDark} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const ANALYZING_STEPS = [
  'Computing language signals',
  'Comparing to personal baseline',
  'Generating plain-English explanation',
];

const TIPS = [
  'Longer responses give more reliable signals',
  'Natural, unprompted language works best',
  'Same time of day each check-in reduces noise',
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  promptCard: {
    backgroundColor: Colors.brandMuted,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    borderLeftWidth: 3,
    borderLeftColor: Colors.brand,
  },
  promptLabel: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  promptText: {
    fontSize: Typography.sizes.base,
    fontStyle: 'italic',
    color: Colors.textPrimary,
    lineHeight: Typography.sizes.base * 1.5,
  },
  guidance: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.6,
    marginBottom: Spacing.base,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    minHeight: 160,
    lineHeight: Typography.sizes.base * 1.7,
  },
  inputActive: { borderColor: Colors.brandLight },
  meterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  wordCountText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    minWidth: 60,
    textAlign: 'right',
  },
  wordCountReady: { color: Colors.brand, fontWeight: Typography.weights.medium },
  tipsCard: {
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  tipsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.brandLight,
    marginTop: 5,
    flexShrink: 0,
  },
  tipText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  submitBtn: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  submitDisabled: { opacity: 0.4 },
  submitText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnDark,
  },
  analyzing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxxl,
    gap: Spacing.base,
  },
  analyzingTitle: {
    fontSize: Typography.sizes.lg,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
    marginTop: Spacing.base,
  },
  analyzingSubtitle: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  analyzingSteps: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    alignSelf: 'stretch',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyzingStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  analyzingStepText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
  },
});
