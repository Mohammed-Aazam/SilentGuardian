// src/lib/signals.ts
// Pure TypeScript text analysis — zero external dependencies, zero network calls.

import { TextSignals, BaselineStats, BaselineDeltas } from './types';

/**
 * Tokenise text into clean word array.
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Split text into sentences.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

/**
 * Find repeated bigrams and trigrams (appearing 2+ times).
 */
function findRepeatedPhrases(words: string[]): string[] {
  const counts: Record<string, number> = {};
  for (let n = 2; n <= 3; n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      // Skip phrases that are all stop words
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'was', 'are', 'were', 'it', 'i']);
      const nonStop = words.slice(i, i + n).filter(w => !stopWords.has(w));
      if (nonStop.length === 0) continue;
      counts[phrase] = (counts[phrase] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

/**
 * Count hesitation/pause markers: ellipsis, em-dash, double-dash.
 */
function countPauseMarkers(text: string): number {
  return (text.match(/…|\.{3}|—|--|\bum\b|\buh\b|\byou know\b/gi) ?? []).length;
}

/**
 * Compute all text signals from a raw input string.
 */
export function computeSignals(text: string): TextSignals {
  const trimmed = text.trim();
  const words = tokenize(trimmed);
  const sentences = splitSentences(trimmed);

  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgWordsPerSentence = parseFloat((wordCount / sentenceCount).toFixed(1));

  const uniqueWords = new Set(words);
  const uniqueWordRatio =
    wordCount > 0 ? parseFloat((uniqueWords.size / wordCount).toFixed(2)) : 0;

  const repeatedPhrases = findRepeatedPhrases(words);
  const longPauseMarkers = countPauseMarkers(trimmed);

  return {
    wordCount,
    sentenceCount,
    avgWordsPerSentence,
    uniqueWordRatio,
    repeatedPhrases,
    longPauseMarkers,
    totalCharacters: trimmed.length,
  };
}

/**
 * Compare today's signals to the established baseline.
 */
export function compareToBaseline(
  current: TextSignals,
  baseline: BaselineStats
): BaselineDeltas {
  const safeAvgWords = Math.max(baseline.avgWordCount, 1);
  const wordCountDelta = parseFloat(
    (((current.wordCount - baseline.avgWordCount) / safeAvgWords) * 100).toFixed(1)
  );
  const uniqueRatioDelta = parseFloat(
    (current.uniqueWordRatio - baseline.avgUniqueWordRatio).toFixed(2)
  );
  const sentenceLengthDelta = parseFloat(
    (current.avgWordsPerSentence - baseline.avgWordsPerSentence).toFixed(1)
  );
  return { wordCountDelta, uniqueRatioDelta, sentenceLengthDelta };
}

/**
 * Compute and return a new BaselineStats from an array of text samples.
 */
export function computeBaseline(texts: string[]): BaselineStats {
  const allSignals = texts.map(computeSignals);
  const n = allSignals.length;
  return {
    avgWordCount: Math.round(allSignals.reduce((a, s) => a + s.wordCount, 0) / n),
    avgSentenceCount: Math.round(allSignals.reduce((a, s) => a + s.sentenceCount, 0) / n),
    avgUniqueWordRatio: parseFloat(
      (allSignals.reduce((a, s) => a + s.uniqueWordRatio, 0) / n).toFixed(2)
    ),
    avgWordsPerSentence: parseFloat(
      (allSignals.reduce((a, s) => a + s.avgWordsPerSentence, 0) / n).toFixed(1)
    ),
    sampleCount: n,
    createdAt: new Date().toISOString(),
  };
}
