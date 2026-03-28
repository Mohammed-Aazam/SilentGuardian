// src/lib/storage.ts
// All AsyncStorage read/write operations. No external DB needed for MVP.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInEntry, BaselineStats } from './types';

const KEYS = {
  HISTORY: 'sg_history_v1',
  BASELINE: 'sg_baseline_v1',
  ALERTS: 'sg_alerts_v1',
  ONBOARDED: 'sg_onboarded_v1',
} as const;

// ─── History ────────────────────────────────────────────────────────────────

export async function loadHistory(): Promise<CheckInEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCheckIn(entry: CheckInEntry): Promise<void> {
  const history = await loadHistory();
  // Prevent duplicate same-day entries (keep latest)
  const filtered = history.filter(
    (h) => h.date.slice(0, 10) !== entry.date.slice(0, 10)
  );
  filtered.push(entry);
  // Keep last 90 days
  const trimmed = filtered.slice(-90);
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(trimmed));
}

export async function deleteHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.HISTORY);
}

// ─── Baseline ────────────────────────────────────────────────────────────────

export async function loadBaseline(): Promise<BaselineStats | null> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.BASELINE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveBaseline(baseline: BaselineStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.BASELINE, JSON.stringify(baseline));
}

export async function deleteBaseline(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.BASELINE);
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function loadAlerts(): Promise<CheckInEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ALERTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveAlert(entry: CheckInEntry): Promise<void> {
  const alerts = await loadAlerts();
  const existing = alerts.findIndex((a) => a.id === entry.id);
  if (existing === -1) {
    alerts.push(entry);
    await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
  }
}

export async function dismissAlert(id: string): Promise<void> {
  const alerts = await loadAlerts();
  const updated = alerts.filter((a) => a.id !== id);
  await AsyncStorage.setItem(KEYS.ALERTS, JSON.stringify(updated));
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export async function hasCompletedOnboarding(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function markOnboardingComplete(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

// ─── Full reset ───────────────────────────────────────────────────────────────

export async function resetAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
