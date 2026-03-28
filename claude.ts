// src/lib/claude.ts
// Calls the Anthropic API directly from the React Native app.
// For production, move this to a backend proxy to protect your API key.

import { TextSignals, BaselineStats, BaselineDeltas, AnalysisResult, CheckInEntry } from './types';

// ⚠️ FOR HACKATHON ONLY: Store key in .env / constants file.
// In production, proxy all Claude calls through your own server.
import { ANTHROPIC_API_KEY } from './constants';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-opus-4-5';

// ─── Prompt builder ──────────────────────────────────────────────────────────

function buildPrompt(params: {
  todayText: string;
  signals: TextSignals;
  baseline: BaselineStats;
  deltas: BaselineDeltas;
  recentHistory: Pick<CheckInEntry, 'date' | 'signals'>[];
}): string {
  const { todayText, signals, baseline, deltas, recentHistory } = params;

  const historyLines = recentHistory
    .slice(-7)
    .map(
      (e) =>
        `- ${e.date.slice(0, 10)}: ${e.signals.wordCount} words, variety ${e.signals.uniqueWordRatio}`
    )
    .join('\n');

  return `You are a compassionate, thoughtful assistant helping a family gently track subtle language patterns in a loved one's daily written check-ins. You are NOT a clinician and must NOT provide any medical diagnosis, clinical assessment, or anything that resembles one.

Your only job: compare today's check-in and its language signals against this person's own personal baseline, then return a warm, plain-English family-friendly explanation.

---
TODAY'S CHECK-IN TEXT:
"${todayText}"

TODAY'S LANGUAGE SIGNALS:
- Word count: ${signals.wordCount} (their baseline average: ${baseline.avgWordCount})
- Sentence count: ${signals.sentenceCount} (baseline: ${baseline.avgSentenceCount})
- Avg words per sentence: ${signals.avgWordsPerSentence} (baseline: ${baseline.avgWordsPerSentence})
- Vocabulary variety ratio: ${signals.uniqueWordRatio} (baseline: ${baseline.avgUniqueWordRatio})
- Repeated phrases: ${signals.repeatedPhrases.length > 0 ? signals.repeatedPhrases.join(', ') : 'none detected'}
- Hesitation markers: ${signals.longPauseMarkers}

COMPARED TO THEIR BASELINE:
- Word count change: ${deltas.wordCountDelta > 0 ? '+' : ''}${deltas.wordCountDelta}%
- Vocabulary variety change: ${deltas.uniqueRatioDelta > 0 ? '+' : ''}${deltas.uniqueRatioDelta}
- Sentence length change: ${deltas.sentenceLengthDelta > 0 ? '+' : ''}${deltas.sentenceLengthDelta} words/sentence

BASELINE RELIABILITY: ${baseline.sampleCount} check-ins collected${baseline.sampleCount < 5 ? ' (still building — signals less meaningful at this stage)' : ''}

RECENT HISTORY (last ${recentHistory.length} days):
${historyLines || 'No previous history yet.'}

---
INSTRUCTIONS:

Respond ONLY with a valid JSON object in this exact shape — no preamble, no markdown fences:

{
  "summary": "1-2 sentence warm, calm plain-English summary of today vs baseline. Acknowledge positives when present.",
  "whatChanged": "Specifically what language signals differ today. Use everyday language. If nothing meaningful changed, say so warmly.",
  "whyItMatters": "Why these patterns might be worth noticing as a trend over time — not a symptom. 1-2 sentences max.",
  "cautionLevel": "low",
  "suggestedNextStep": "One practical, human, non-medical family action. E.g. 'Have a relaxed chat today' or 'If this pattern repeats for several days, mention it at their next routine doctor visit.'",
  "safetyNote": "Brief reminder: this is not a diagnosis. One day doesn't make a trend. Many things naturally affect how we write.",
  "flagForFamilyReview": false,
  "singleDayDisclaimer": "One sentence: one unusual day is completely normal and should not cause alarm."
}

RULES — follow every one:
1. cautionLevel must be exactly "low", "moderate", or "watch".
   - "watch" ONLY if: word count is down >40% AND uniqueWordRatio drops >0.15 AND repeated phrases detected. All three together.
   - "moderate" if one or two signals are noticeably outside baseline.
   - "low" otherwise (including when signals are better than baseline).
2. flagForFamilyReview = true only when cautionLevel is "watch".
3. NEVER use: "dementia", "Alzheimer's", "cognitive impairment", "cognitive decline", "symptom", "disorder", "disease", "diagnosis", "medical", or any clinical terminology.
4. Always acknowledge: fatigue, mood, time of day, and life events naturally affect how people write on any given day.
5. If baseline.sampleCount < 5, note that signals aren't yet meaningful — be extra cautious about drawing conclusions.
6. Return ONLY raw JSON. No backticks, no explanation outside the JSON object.`;
}

// ─── API caller ───────────────────────────────────────────────────────────────

export async function analyzeCheckIn(params: {
  todayText: string;
  signals: TextSignals;
  baseline: BaselineStats;
  deltas: BaselineDeltas;
  recentHistory: Pick<CheckInEntry, 'date' | 'signals'>[];
}): Promise<AnalysisResult> {
  const prompt = buildPrompt(params);

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  const data = await response.json();
  const rawText: string =
    data.content?.[0]?.type === 'text' ? data.content[0].text : '';

  // Extract JSON even if model adds surrounding whitespace
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse structured response from Claude.');
  }

  const result = JSON.parse(jsonMatch[0]) as AnalysisResult;

  // Validate caution level
  if (!['low', 'moderate', 'watch'].includes(result.cautionLevel)) {
    result.cautionLevel = 'low';
  }

  return result;
}
