// src/screens/WelcomeScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadow } from '../lib/theme';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={40} color={Colors.textOnDark} />
          </View>
          <Text style={styles.appName}>SilentGuardian</Text>
          <Text style={styles.tagline}>
            Gentle language check-ins for the people you love
          </Text>
        </View>

        {/* Feature cards */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color={Colors.brand} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>
            SilentGuardian is not a medical device and does not diagnose any
            condition. It is a family awareness tool only.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => navigation.navigate('Baseline')}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Get started</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.textOnDark} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const FEATURES = [
  {
    icon: 'person-outline',
    title: 'Personal baseline',
    body: "We compare against this person's own writing — not anyone else's.",
  },
  {
    icon: 'trending-up-outline',
    title: 'Gentle trend tracking',
    body: 'One unusual day is normal. We look for patterns across many days.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Stays on your phone',
    body: 'All history lives on this device. Nothing is stored in the cloud.',
  },
  {
    icon: 'people-outline',
    title: 'Family stays in control',
    body: 'No automatic alerts or actions. Every decision is made by you.',
  },
];

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.brand,
  },
  scroll: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  logoArea: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.sizes.xxl,
    fontFamily: 'Georgia',
    fontWeight: '700',
    color: Colors.textOnDark,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sizes.base,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: Typography.sizes.base * Typography.lineHeights.relaxed,
    maxWidth: 260,
  },
  features: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: Radius.lg,
    padding: Spacing.base,
    gap: Spacing.base,
    marginBottom: Spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brandMuted,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.textOnDark,
    marginBottom: 2,
  },
  featureBody: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: Typography.sizes.sm * 1.6,
  },
  disclaimer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    alignItems: 'flex-start',
  },
  disclaimerText: {
    flex: 1,
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: Typography.sizes.xs * 1.6,
  },
  cta: {
    backgroundColor: Colors.textOnDark,
    borderRadius: Radius.full,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    ...Shadow.md,
  },
  ctaText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.brand,
  },
});
