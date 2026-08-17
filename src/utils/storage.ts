import { GameProgress, PhrasesDataset, TopicItem } from '../types';
import defaultPhrasesData from '../data/phrases.json';

const STORAGE_PROGRESS_KEY = 'educaplay_word_order_progress_v1';
const STORAGE_DATASET_KEY = 'educaplay_word_order_dataset_v1';

export function getInitialDataset(): PhrasesDataset {
  try {
    const custom = localStorage.getItem(STORAGE_DATASET_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (
        parsed &&
        Array.isArray(parsed.topics) &&
        parsed.topics.length > 0 &&
        parsed.topics.every(
          (t: TopicItem) =>
            t &&
            t.id &&
            t.title &&
            Array.isArray(t.phrases) &&
            t.phrases.length > 0 &&
            t.phrases.every((p) => p && p.fullSentence && p.clue)
        )
      ) {
        return parsed;
      } else {
        localStorage.removeItem(STORAGE_DATASET_KEY);
      }
    }
  } catch (err) {
    console.error('Error loading custom dataset from localStorage', err);
    try {
      localStorage.removeItem(STORAGE_DATASET_KEY);
    } catch {}
  }
  return defaultPhrasesData as PhrasesDataset;
}

export function saveCustomDataset(dataset: PhrasesDataset): boolean {
  try {
    localStorage.setItem(STORAGE_DATASET_KEY, JSON.stringify(dataset));
    return true;
  } catch (err) {
    console.error('Failed to save dataset to localStorage', err);
    return false;
  }
}

export function resetToDefaultDataset(): PhrasesDataset {
  try {
    localStorage.removeItem(STORAGE_DATASET_KEY);
  } catch (e) {
    console.error(e);
  }
  return defaultPhrasesData as PhrasesDataset;
}

export function getSavedProgress(): GameProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_PROGRESS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameProgress;
  } catch (err) {
    console.error('Error reading game progress', err);
    return null;
  }
}

export function saveProgress(progress: GameProgress): void {
  try {
    localStorage.setItem(STORAGE_PROGRESS_KEY, JSON.stringify(progress));
  } catch (err) {
    console.error('Error saving progress', err);
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(STORAGE_PROGRESS_KEY);
  } catch (err) {
    console.error('Error clearing progress', err);
  }
}

/**
 * Tokenize a full sentence into words/tokens.
 * Preserves words and trailing punctuation blocks if spaced.
 */
export function tokenizeSentence(sentence: string): string[] {
  // Trim and split by whitespace
  const trimmed = sentence.trim();
  if (!trimmed) return [];
  return trimmed.split(/\s+/);
}

/**
 * Shuffle array using Fisher-Yates algorithm, ensuring it's not strictly in original order if length > 1
 */
export function shuffleTokens<T>(array: T[]): T[] {
  const result = [...array];
  if (result.length <= 1) return result;

  let attempts = 0;
  let isIdentical = true;

  while (isIdentical && attempts < 5) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    // Check if shuffled matches original
    isIdentical = result.every((val, idx) => val === array[idx]);
    attempts++;
  }

  return result;
}
