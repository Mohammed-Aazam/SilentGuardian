// src/lib/types.ts

export interface TextSignals {
  wordCount: number;
  sentenceCount: number;
  avgWordsPerSentence: number;
  uniqueWordRatio: number;
  repeatedPhrases: string[];
  longPauseMarkers: number;
  totalCharacters: number;
}

export interface BaselineStats {
  avgWordCount: number;
  avgSentenceCount: number;
  avgUniqueWordRatio: number;
  avgWordsPerSentence: number;
  sampleCount: number;
  createdAt: string;
}

export interface BaselineDeltas {
  wordCountDelta: number;
  uniqueRatioDelta: number;
  sentenceLengthDelta: number;
}

export type CautionLevel = 'low' | 'moderate' | 'watch';

export interface AnalysisResult {
  summary: string;
  whatChanged: string;
  whyItMatters: string;
  cautionLevel: CautionLevel;
  suggestedNextStep: string;
  safetyNote: string;
  flagForFamilyReview: boolean;
  singleDayDisclaimer: string;
}

export interface CheckInEntry {
  id: string;
  date: string;
  text: string;
  signals: TextSignals;
  deltas: BaselineDeltas;
  analysis: AnalysisResult;
}
