// src/lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// HACKATHON MVP: Place your Anthropic API key here.
//
// FOR PRODUCTION:
// 1. Never ship an API key in mobile app source code.
// 2. Build a lightweight backend proxy (Node.js/Express or Next.js API route)
//    that holds the key server-side.
// 3. The mobile app calls YOUR server, which calls Claude.
//
// For the hackathon demo, a direct client-side call is acceptable.
// ─────────────────────────────────────────────────────────────────────────────

export const ANTHROPIC_API_KEY = 'sk-ant-YOUR_KEY_HERE';

export const APP_VERSION = '1.0.0';

export const BASELINE_REQUIRED_SAMPLES = 5;

export const DAILY_PROMPTS = [
  'Tell me about your morning so far.',
  'What is something you enjoyed recently?',
  'Describe how your day is going.',
  'What have you been thinking about today?',
  'Tell me about something that made you smile this week.',
  'How are you feeling today, and what have you been up to?',
  'What did you do this morning?',
];

export const ETHICAL_SAFEGUARDS = [
  {
    title: 'Not a medical device',
    body: 'SilentGuardian detects language patterns, not medical conditions. A clinician is always needed for any health evaluation.',
  },
  {
    title: 'Personal baseline only',
    body: "All comparisons are made against this person's own history — not population norms. One person's normal is completely different from another's.",
  },
  {
    title: 'One bad day is normal',
    body: 'A single unusual check-in should never cause alarm. Fatigue, mood, a busy morning, or simply having nothing to say all affect how we write.',
  },
  {
    title: 'Humans stay in control',
    body: 'No action is taken automatically. Every review flag is visible to the family and acted on by a person.',
  },
  {
    title: 'Your data stays on this device',
    body: 'All check-in history is stored locally on this phone. Nothing is kept by Anthropic after the analysis call completes.',
  },
  {
    title: 'Delete everything anytime',
    body: 'Your history and baseline can be cleared at any time from Settings. No data is retained after deletion.',
  },
];
