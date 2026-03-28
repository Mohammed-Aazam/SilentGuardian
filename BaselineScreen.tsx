// src/screens/BaselineScreen.tsx
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
import { computeBaseline } from '../lib/signals';
import { saveBaseline, markOnboardingComplete } from '../lib/storage';
import { BASELINE_REQUIRED_SAMPLES, DAILY_PROMPTS } from '../lib/constants';

export default function BaselineScreen({ navigation }: any) {
  const [responses, setResponses] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const currentStep = responses.length + 1;
  const totalSteps = BASELINE_REQUIRED_SAMPLES;
  const prompt = DAILY_PROMPTS[responses.length % DAILY_PROMPTS.length];
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
  const isReady = wordCount >= 15;

  const handleAdd = () => {
    if (!isReady) return;
    const updated = [...responses, currentText.trim()];
    setCurrentText('');

    if (updated.length >= totalSteps) {
      handleComplete(updated);
    } else {
      setResponses(updated);
    }
  };

  const handleComplete = async (finalResponses: string[]) => {
    setIsSaving(true);
    try {
      const baseline = computeBaseline(finalResponses);
      await saveBaseline(baseline);
      await markOnboardingComplete();
      // Navigate to main app
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Error', 'Could not save baseline. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress */}
          <View style={styles.progressRow}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.progressDot,
                  i < responses.length && styles.progressDotDone,
                  i === responses.length && styles.progressDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.stepLabel}>
            Check-in {currentStep} of {totalSteps}
          </Text>
          <Text style={styles.heading}>Building the baseline</Text>
          <Text style={styles.subheading}>
            We need {totalSteps} short writing samples to understand this
            person's typical language style. Ask them to respond naturally.
          </Text>

          {/* Prompt card */}
          <View style={styles.promptCard}>
            <Text style={styles.promptLabel}>Today's prompt</Text>
            <Text style={styles.promptText}>"{prompt}"</Text>
          </View>

          {/* Input */}
          <TextInput
            style={styles.input}
            value={currentText}
            onChangeText={setCurrentText}
            multiline
            numberOfLines={6}
            placeholder="Type their response here…"
            placeholderTextColor={Colors.textMuted}
            textAlignVertical="top"
          />

          <View style={styles.inputMeta}>
            <Text style={styles.wordCount}>{wordCount} words</Text>
            {!isReady && wordCount > 0 && (
              <Text style={styles.wordCountHint}>Need at least 15 words</Text>
            )}
          </View>

          {/* Already collected */}
          {responses.length > 0 && (
            <View style={styles.collected}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.low} />
              <Text style={styles.collectedText}>
                {responses.length} response{responses.length > 1 ? 's' : ''} collected
              </Text>
            </View>
          )}

          {/* CTA */}
          <TouchableOpacity
            style={[styles.cta, !isReady && styles.ctaDisabled]}
            onPress={handleAdd}
            disabled={!isReady || isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.textOnDark} />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  {currentStep < totalSteps ? 'Next check-in' : 'Finish setup'}
                </Text>
                <Ionicons
                  name={currentStep < totalSteps ? 'arrow-forward' : 'checkmark'}
                  size={18}
                  color={Colors.textOnDark}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  progressDotDone: { backgroundColor: Colors.brand },
  progressDotActive: { backgroundColor: Colors.brandLight },
  stepLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.brand,
    fontWeight: Typography.weights.semibold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  heading: {
    fontSize: Typography.sizes.xl,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subheading: {
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.base * 1.6,
    marginBottom: Spacing.xl,
  },
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
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.base,
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    minHeight: 120,
    lineHeight: Typography.sizes.base * 1.6,
  },
  inputMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  wordCount: {
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
  },
  wordCountHint: {
    fontSize: Typography.sizes.sm,
    color: Colors.moderate,
  },
  collected: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  collectedText: {
    fontSize: Typography.sizes.sm,
    color: Colors.low,
    fontWeight: Typography.weights.medium,
  },
  cta: {
    backgroundColor: Colors.brand,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  ctaDisabled: { opacity: 0.45 },
  ctaText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnDark,
  },
});
