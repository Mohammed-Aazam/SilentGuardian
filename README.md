# SilentGuardian — Mobile App

> A gentle, privacy-first language check-in tool that helps families notice subtle changes in a loved one's daily writing — compared against their own personal baseline.

---

## ⚠️ Important disclaimer

**SilentGuardian is not a medical device.** It does not diagnose, screen, or treat any condition. It is a family awareness tool only. Always consult a qualified clinician for any health concerns.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo (SDK 51) |
| Navigation | React Navigation v6 (Stack + Bottom Tabs) |
| Storage | AsyncStorage (on-device, no cloud) |
| AI reasoning | Claude API (claude-opus-4-5) |
| Signal computation | Pure TypeScript — zero ML libraries |
| Language | TypeScript |

---

## Project structure

```
SilentGuardian/
├── App.tsx                          # Root entry — auth routing
├── app.json                         # Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
└── src/
    ├── lib/
    │   ├── types.ts                 # Shared TypeScript interfaces
    │   ├── theme.ts                 # Colors, typography, spacing tokens
    │   ├── constants.ts             # API key placeholder, prompts, ethical copy
    │   ├── signals.ts               # computeSignals(), compareToBaseline()
    │   ├── storage.ts               # AsyncStorage read/write helpers
    │   └── claude.ts                # Claude API caller + prompt builder
    ├── navigation/
    │   ├── TabNavigator.tsx         # Bottom tab navigator (4 tabs)
    │   ├── HomeStack.tsx            # Home → CheckIn → Result
    │   └── OnboardingStack.tsx      # Welcome → Baseline
    └── screens/
        ├── WelcomeScreen.tsx        # First-run welcome + feature overview
        ├── BaselineScreen.tsx       # 5 baseline check-in collection
        ├── HomeScreen.tsx           # Dashboard with streak + CTA
        ├── CheckInScreen.tsx        # Daily text entry + submission
        ├── ResultScreen.tsx         # Full Claude analysis display
        ├── HistoryScreen.tsx        # Scrollable history list
        ├── AlertsScreen.tsx         # Family review flags
        └── AboutScreen.tsx          # Ethical safeguards + app info
```

---

## Setup

### 1. Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode + iOS Simulator, or Expo Go on a physical device
- Android: Android Studio + emulator, or Expo Go on a physical device

### 2. Install dependencies

```bash
cd SilentGuardian
npm install
```

### 3. Add your Claude API key

Open `src/lib/constants.ts` and replace the placeholder:

```ts
export const ANTHROPIC_API_KEY = 'sk-ant-YOUR_KEY_HERE';
```

Get your key at: https://platform.claude.com

> **For production:** Never ship an API key in a mobile app binary. Proxy all Claude calls through a backend server (e.g. a Next.js API route or Express endpoint) that holds the key server-side.

### 4. Run the app

```bash
# Start Expo development server
npm start

# Or target a specific platform
npm run ios
npm run android
```

Scan the QR code with the Expo Go app on your phone, or press `i` for iOS simulator / `a` for Android emulator.

---

## User flow

```
App launch
  └─ No baseline? → Onboarding (Welcome → 5 baseline check-ins → Save)
  └─ Has baseline? → Home tab

Home tab
  └─ No check-in today → [Start check-in] CTA
  └─ Check-in done → [View result] link

CheckIn screen
  └─ Enter response text (min 15 words)
  └─ Submit → computeSignals() [local, instant]
           → compareToBaseline() [local, instant]
           → Claude API call [network, ~2-4s]
           → Parse JSON result
           → Save to AsyncStorage
           → Navigate to Result screen

Result screen
  └─ Caution level badge (low / moderate / watch)
  └─ Summary (Claude, plain English)
  └─ Signal comparison cards (4 metrics vs baseline)
  └─ What changed / Why it matters / Next step
  └─ Family alert card (if flagged)
  └─ Safety note + disclaimer

History tab → List of all entries → Tap to view any result
Alerts tab  → Flagged entries for family review → Dismiss when reviewed
About tab   → Ethical safeguards + how it works
```

---

## Signal computation (no ML)

All text analysis runs locally in `src/lib/signals.ts`:

| Signal | How computed |
|---|---|
| Word count | Split on whitespace, filter empty |
| Sentence count | Split on `.!?`, filter short fragments |
| Avg words/sentence | word count ÷ sentence count |
| Unique word ratio | unique words ÷ total words |
| Repeated phrases | Bigrams + trigrams appearing 2+ times (stop-word filtered) |
| Pause markers | Regex match on `…`, `—`, `--`, `um`, `uh` |

---

## Caution level rules (enforced in Claude prompt)

| Level | Triggers |
|---|---|
| `low` | All signals near baseline, or signals improved |
| `moderate` | One or two signals noticeably outside baseline |
| `watch` | Word count down >40% AND vocabulary down >0.15 AND repeated phrases present (all three required) |

`watch` → `flagForFamilyReview: true` → entry appears in Alerts tab.

---

## Ethical commitments built into the app

1. Not a medical device — stated in 4 places in the UI
2. Personal baseline only — no population comparisons
3. One bad day is normal — single-day disclaimer on every result
4. Humans stay in control — no automatic actions
5. Data stays on device — AsyncStorage, no cloud sync
6. Delete everything anytime — full reset in History tab
7. Transparent signals — all computed numbers shown to user
8. Consent-aware — designed for use with the person's knowledge

---

## Production checklist (before shipping)

- [ ] Move API key to a backend proxy — never ship in app binary
- [ ] Add error boundary components
- [ ] Add Crashlytics or Sentry for error tracking
- [ ] Add proper loading states for slow connections
- [ ] Consider encryption for AsyncStorage data at rest
- [ ] Add export-to-PDF feature for sharing with doctors
- [ ] Add push notification reminders for daily check-ins
- [ ] App Store / Play Store compliance review for health-adjacent apps
