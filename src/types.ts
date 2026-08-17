export interface PhraseItem {
  id: string;
  clue: string;
  fullSentence: string;
  estimatedTime: number; // in seconds
  difficulty?: 'Fácil' | 'Medio' | 'Difícil';
}

export interface TopicItem {
  id: string;
  accessCode?: string;
  title: string;
  description: string;
  icon?: string;
  phrases: PhraseItem[];
}

export interface PhrasesDataset {
  topics: TopicItem[];
}

export interface WordToken {
  id: string;
  text: string;
  targetIndex: number;
  isPlaced: boolean;
  status: 'idle' | 'correct' | 'error' | 'hint';
}

export interface CompletedPhraseRecord {
  phraseId: string;
  topicId: string;
  topicTitle: string;
  clue: string;
  fullSentence: string;
  timeSpent: number;
  timeLimit: number;
  mistakes: number;
  scoreEarned: number;
  completedAt: string;
}

export interface GameProgress {
  topicId: string;
  currentPhraseIndex: number;
  totalScore: number;
  completedRecords: CompletedPhraseRecord[];
  updatedAt: string;
}

export type GameScreen = 'welcome' | 'playing' | 'phrase_completed' | 'game_finished';
