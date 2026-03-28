// src/screens/AboutScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';
import { ETHICAL_SAFEGUARDS, APP_VERSION } from '../lib/constants';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* App header */}
        <View style={styles.appHeader}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={28} color={Colors.textOnDark} />
          </View>
          <Text style={styles.appName}>SilentGuardian</Text>
          <Text style={styles.appVersion}>Version {APP_VERSION}</Text>
        </View>

        {/* Not a medical device — prominent */}
        <View style={styles.medicalCard}>
          <Ionicons name="medical-outline" size={20} color={Colors.watch} />
          <View style={{ flex: 1 }}>
            <Text style={styles.medicalTitle}>Not a medical device</Text>
            <Text style={styles.medicalBody}>
              SilentGuardian does not diagnose, screen, or treat any medical or
              cognitive condition. It is a family awareness tool only. Always
              consult a qualified clinician for health concerns.
            </Text>
          </View>
        </View>

        {/* How it works */}
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.card}>
          {HOW_IT_WORKS.map((step, i) => (
            <View key={i} style={[styles.howRow, i < HOW_IT_WORKS.length - 1 && styles.howRowBorder]}>
              <View style={styles.howNumber}>
                <Text style={styles.howNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.howText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Ethical safeguards */}
        <Text style={styles.sectionTitle}>Our ethical commitments</Text>
        <View style={styles.card}>
          {ETHICAL_SAFEGUARDS.map((item, i) => (
            <View
              key={item.title}
              style={[styles.safeguardRow, i < ETHICAL_SAFEGUARDS.length - 1 && styles.safeguardBorder]}
            >
              <Ionicons name="shield-checkmark-outline" size={16} color={Colors.brand} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={styles.safeguardTitle}>{item.title}</Text>
                <Text style={styles.safeguardBody}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Powered by Claude */}
        <View style={styles.poweredBy}>
          <Ionicons name="sparkles-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.poweredByText}>
            AI analysis powered by Claude (Anthropic). Language signal
            computation happens entirely on your device — no ML models
            downloaded.
          </Text>
        </View>

        {/* Links */}
        <View style={styles.linksCard}>
          <LinkRow
            icon="document-text-outline"
            label="Anthropic Privacy Policy"
            url="https://www.anthropic.com/privacy"
          />
          <LinkRow
            icon="shield-outline"
            label="Anthropic Usage Policy"
            url="https://www.anthropic.com/aup"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LinkRow({ icon, label, url }: { icon: string; label: string; url: string }) {
  return (
    <TouchableOpacity
      style={styles.linkRow}
      onPress={() => Linking.openURL(url)}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={16} color={Colors.brand} />
      <Text style={styles.linkText}>{label}</Text>
      <Ionicons name="open-outline" size={14} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const HOW_IT_WORKS = [
  'A family member enters a short daily response to a writing prompt.',
  'The app computes language signals locally on the device — word count, vocabulary variety, repeated phrases, and more.',
  'Those signals are compared against this person's own personal baseline.',
  'Claude generates a plain-English explanation of what changed and why it might matter.',
  'The family sees the result and decides what, if anything, to do next.',
];

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxxl },
  appHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  appName: {
    fontSize: Typography.sizes.xl,
    fontFamily: 'Georgia',
    color: Colors.textPrimary,
  },
  appVersion: { fontSize: Typography.sizes.sm, color: Colors.textMuted },
  medicalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.watchBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
    padding: Spacing.base,
    marginBottom: Spacing.xl,
  },
  medicalTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.watch,
    marginBottom: 4,
  },
  medicalBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.watch,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  sectionTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  howRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  howRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  howNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  howNumberText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.bold,
    color: Colors.brand,
  },
  howText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.base * 1.6,
  },
  safeguardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  safeguardBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  safeguardTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.medium,
    color: Colors.textPrimary,
  },
  safeguardBody: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  poweredBy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  poweredByText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.textMuted,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  linksCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  linkText: {
    flex: 1,
    fontSize: Typography.sizes.base,
    color: Colors.brand,
  },
});
