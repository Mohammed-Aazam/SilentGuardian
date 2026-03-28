// src/screens/AlertsScreen.tsx
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
import { loadAlerts, dismissAlert } from '../lib/storage';
import { CheckInEntry } from '../lib/types';

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const [alerts, setAlerts] = useState<CheckInEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadAlerts().then(setAlerts);
    }, [])
  );

  const handleDismiss = (id: string) => {
    Alert.alert(
      'Mark as reviewed',
      'This will remove the flag. The check-in entry will still appear in History.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark reviewed',
          onPress: async () => {
            await dismissAlert(id);
            setAlerts((prev) => prev.filter((a) => a.id !== id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Family alerts</Text>
        <Text style={styles.headerSub}>
          {alerts.length === 0
            ? 'No active flags'
            : `${alerts.length} item${alerts.length > 1 ? 's' : ''} to review`}
        </Text>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Ionicons name="shield-checkmark-outline" size={16} color={Colors.brand} />
        <Text style={styles.disclaimerText}>
          These flags are conversation starters — not medical alerts. A single
          flag is not cause for alarm. Look for persistent patterns across
          multiple days before acting.
        </Text>
      </View>

      {alerts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No flags right now</Text>
          <Text style={styles.emptySub}>
            Flags appear here when multiple language signals fall significantly
            outside the personal baseline on the same day.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <View style={styles.alertDot} />
                <Text style={styles.alertDate}>
                  {new Date(item.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>

              <Text style={styles.alertSummary}>{item.analysis.summary}</Text>

              <View style={styles.changeBox}>
                <Text style={styles.changeTitle}>What was noticed</Text>
                <Text style={styles.changeText}>{item.analysis.whatChanged}</Text>
              </View>

              <View style={styles.stepBox}>
                <Ionicons name="footsteps-outline" size={14} color={Colors.brand} />
                <Text style={styles.stepText}>{item.analysis.suggestedNextStep}</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() =>
                    navigation.navigate('HomeTab', {
                      screen: 'Result',
                      params: { entryId: item.id },
                    })
                  }
                >
                  <Text style={styles.viewBtnText}>View full analysis</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dismissBtn}
                  onPress={() => handleDismiss(item.id)}
                >
                  <Ionicons name="checkmark" size={14} color={Colors.textOnDark} />
                  <Text style={styles.dismissText}>Mark reviewed</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardDisclaimer}>
                Not a medical alert. Always consult a clinician for health concerns.
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
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
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    margin: Spacing.base,
    backgroundColor: Colors.brandMuted,
    borderRadius: Radius.md,
    padding: Spacing.base,
  },
  disclaimerText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.brand,
    lineHeight: Typography.sizes.sm * 1.6,
  },
  list: { padding: Spacing.base, paddingBottom: Spacing.xxxl, gap: Spacing.base },
  alertCard: {
    backgroundColor: Colors.watchBg,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
    padding: Spacing.base,
    gap: Spacing.base,
    ...Shadow.sm,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.watch,
  },
  alertDate: {
    fontSize: Typography.sizes.base,
    fontWeight: Typography.weights.semibold,
    color: Colors.watch,
  },
  alertSummary: {
    fontSize: Typography.sizes.base,
    color: Colors.textPrimary,
    lineHeight: Typography.sizes.base * 1.6,
  },
  changeBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
    gap: 4,
  },
  changeTitle: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  changeText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  stepBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.brandMuted,
    borderRadius: Radius.sm,
    padding: Spacing.sm,
  },
  stepText: {
    flex: 1,
    fontSize: Typography.sizes.sm,
    color: Colors.brand,
    lineHeight: Typography.sizes.sm * 1.5,
  },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },
  viewBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.watchBorder,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  viewBtnText: {
    fontSize: Typography.sizes.sm,
    color: Colors.watch,
    fontWeight: Typography.weights.medium,
  },
  dismissBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.watch,
    borderRadius: Radius.sm,
    paddingVertical: Spacing.sm,
  },
  dismissText: {
    fontSize: Typography.sizes.sm,
    color: Colors.textOnDark,
    fontWeight: Typography.weights.medium,
  },
  cardDisclaimer: {
    fontSize: Typography.sizes.xs,
    color: Colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
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
});
