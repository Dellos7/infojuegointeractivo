/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameArea } from './components/GameArea';
import { EndGameScreen } from './components/EndGameScreen';
import { HistoryModal } from './components/HistoryModal';
import { JsonManagerModal } from './components/JsonManagerModal';
import {
  PhrasesDataset,
  TopicItem,
  PhraseItem,
  CompletedPhraseRecord,
  GameProgress,
  GameScreen,
} from './types';
import {
  getInitialDataset,
  saveCustomDataset,
  resetToDefaultDataset,
  getSavedProgress,
  saveProgress,
  clearProgress,
} from './utils/storage';
import { APP_CONFIG } from './config';

export default function App() {
  // Dataset state
  const [dataset, setDataset] = useState<PhrasesDataset>(() => getInitialDataset());
  const [selectedTopic, setSelectedTopic] = useState<TopicItem>(() => dataset.topics[0]);

  // Player state
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('educaplay_player_name') || getSavedProgress()?.playerName || '';
  });

  // Game state
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('welcome');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [completedRecords, setCompletedRecords] = useState<CompletedPhraseRecord[]>([]);
  const [savedProgress, setSavedProgress] = useState<GameProgress | null>(() => getSavedProgress());

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(45);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Modals state
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isJsonManagerOpen, setIsJsonManagerOpen] = useState<boolean>(false);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // URL / Route check for Admin / JSON configuration route using APP_CONFIG.ADMIN_SECRET_KEY
  useEffect(() => {
    const checkAdminRoute = () => {
      const secret = (APP_CONFIG.ADMIN_SECRET_KEY || 'adminjuegointeractivo').toLowerCase().trim();
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();

      const isAdmin =
        path.includes(`/${secret}`) ||
        hash.includes(secret) ||
        search.includes(secret);

      if (isAdmin) {
        setIsAdminMode(true);
        setIsJsonManagerOpen(true);
      }
    };

    checkAdminRoute();
    window.addEventListener('popstate', checkAdminRoute);
    window.addEventListener('hashchange', checkAdminRoute);

    return () => {
      window.removeEventListener('popstate', checkAdminRoute);
      window.removeEventListener('hashchange', checkAdminRoute);
    };
  }, []);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerRunning && currentScreen === 'playing') {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Time is up!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, currentScreen]);

  // Keep savedProgress updated when records or score change
  const persistCurrentProgress = useCallback(
    (newRecords: CompletedPhraseRecord[], newScore: number, phraseIdx: number) => {
      const progress: GameProgress = {
        topicId: selectedTopic.id,
        playerName,
        currentPhraseIndex: phraseIdx,
        totalScore: newScore,
        completedRecords: newRecords,
        updatedAt: new Date().toISOString(),
      };
      saveProgress(progress);
      setSavedProgress(progress);
    },
    [selectedTopic.id, playerName]
  );

  // Start game with a verified topic and student name from access code
  const handleStartGameWithTopic = (topic: TopicItem, name?: string) => {
    const activePlayerName = name || playerName;
    if (name) {
      setPlayerName(name);
    }
    setSelectedTopic(topic);
    setCurrentPhraseIndex(0);
    setTotalScore(0);
    setCompletedRecords([]);
    const firstPhrase = topic.phrases[0];
    setTimeRemaining(firstPhrase?.estimatedTime || 45);
    setIsTimerRunning(true);
    setCurrentScreen('playing');

    const progress: GameProgress = {
      topicId: topic.id,
      playerName: activePlayerName,
      currentPhraseIndex: 0,
      totalScore: 0,
      completedRecords: [],
      updatedAt: new Date().toISOString(),
    };
    saveProgress(progress);
    setSavedProgress(progress);
  };

  // Start new game
  const handleStartGame = () => {
    handleStartGameWithTopic(selectedTopic, playerName);
  };

  // Resume saved game
  const handleResumeGame = () => {
    if (!savedProgress || savedProgress.topicId !== selectedTopic.id) {
      handleStartGame();
      return;
    }

    if (savedProgress.playerName) {
      setPlayerName(savedProgress.playerName);
    }

    const nextIndex = Math.min(
      savedProgress.currentPhraseIndex,
      selectedTopic.phrases.length - 1
    );
    setCurrentPhraseIndex(nextIndex);
    setTotalScore(savedProgress.totalScore);
    setCompletedRecords(savedProgress.completedRecords);

    const currentPhrase = selectedTopic.phrases[nextIndex];
    setTimeRemaining(currentPhrase?.estimatedTime || 45);
    setIsTimerRunning(true);
    setCurrentScreen('playing');
  };

  // Called when user finishes solving one phrase
  const handlePhraseCompleted = (record: CompletedPhraseRecord) => {
    const recordWithPlayer: CompletedPhraseRecord = {
      ...record,
      playerName: playerName || undefined,
    };
    const newRecords = [...completedRecords, recordWithPlayer];
    const newScore = totalScore + record.scoreEarned;

    setCompletedRecords(newRecords);
    setTotalScore(newScore);

    // Save progress to localStorage immediately
    persistCurrentProgress(newRecords, newScore, currentPhraseIndex);
  };

  // Move to next phrase or complete game
  const handleNextPhrase = () => {
    if (currentPhraseIndex < selectedTopic.phrases.length - 1) {
      const nextIndex = currentPhraseIndex + 1;
      setCurrentPhraseIndex(nextIndex);
      const nextPhrase = selectedTopic.phrases[nextIndex];
      setTimeRemaining(nextPhrase?.estimatedTime || 45);
      setIsTimerRunning(true);
      setCurrentScreen('playing');

      persistCurrentProgress(completedRecords, totalScore, nextIndex);
    } else {
      // Finished all phrases!
      setIsTimerRunning(false);
      setCurrentScreen('game_finished');
      persistCurrentProgress(completedRecords, totalScore, selectedTopic.phrases.length);
    }
  };

  // Exit to welcome screen without saving active game
  const handleExitWithoutSaving = () => {
    setIsTimerRunning(false);
    clearProgress();
    setSavedProgress(null);
    setCompletedRecords([]);
    setTotalScore(0);
    setCurrentPhraseIndex(0);
    setCurrentScreen('welcome');
  };

  // Finish game immediately with currently solved phrases
  const handleEarlyFinish = () => {
    setIsTimerRunning(false);
    setCurrentScreen('game_finished');
    persistCurrentProgress(completedRecords, totalScore, selectedTopic.phrases.length);
  };

  // Clear history
  const handleClearHistory = () => {
    clearProgress();
    setSavedProgress(null);
    setCompletedRecords([]);
    setTotalScore(0);
    setCurrentPhraseIndex(0);
  };

  // Update custom dataset from JSON Manager
  const handleSaveDataset = (newDataset: PhrasesDataset) => {
    saveCustomDataset(newDataset);
    setDataset(newDataset);
    // If current selected topic still exists, keep it, otherwise pick first
    const match = newDataset.topics.find((t) => t.id === selectedTopic.id);
    setSelectedTopic(match || newDataset.topics[0]);
    handleClearHistory();
    setCurrentScreen('welcome');
  };

  // Reset to default dataset
  const handleResetToDefault = () => {
    const defaultData = resetToDefaultDataset();
    setDataset(defaultData);
    setSelectedTopic(defaultData.topics[0]);
    handleClearHistory();
    setCurrentScreen('welcome');
  };

  const currentPhrase: PhraseItem | undefined = selectedTopic.phrases[currentPhraseIndex];
  const isLastPhrase = currentPhraseIndex === selectedTopic.phrases.length - 1;

  return (
    <div className="min-h-screen bg-[#0B0F19] bg-tech-dots text-[#E2E8F0] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white relative overflow-x-hidden">
      {/* Ambient Cyber Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-[#3B82F6]/10 via-[#06B6D4]/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Cyber Gaming Navigation Bar */}
      <Navbar
        topicTitle={currentScreen === 'welcome' ? 'Terminal de Acceso' : selectedTopic.title}
        score={totalScore}
        timeRemaining={currentScreen === 'playing' ? timeRemaining : undefined}
        totalTime={currentPhrase?.estimatedTime || 45}
        isTimerRunning={isTimerRunning}
        currentPhraseNum={currentPhraseIndex + 1}
        totalPhrases={selectedTopic.phrases.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenJsonManager={isAdminMode ? () => setIsJsonManagerOpen(true) : undefined}
        showInGameControls={currentScreen === 'playing'}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center py-4">
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            topics={dataset.topics}
            selectedTopic={selectedTopic}
            onSelectTopicAndStart={handleStartGameWithTopic}
            savedProgress={savedProgress}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}

        {currentScreen === 'playing' && currentPhrase && (
          <GameArea
            phrase={currentPhrase}
            phraseIndex={currentPhraseIndex}
            totalPhrases={selectedTopic.phrases.length}
            topicId={selectedTopic.id}
            topicTitle={selectedTopic.title}
            onPhraseCompleted={handlePhraseCompleted}
            onNextPhrase={handleNextPhrase}
            isLastPhrase={isLastPhrase}
            timeRemaining={timeRemaining}
            setTimeRemaining={setTimeRemaining}
            isTimerRunning={isTimerRunning}
            setIsTimerRunning={setIsTimerRunning}
            onExitWithoutSaving={handleExitWithoutSaving}
            onEarlyFinish={handleEarlyFinish}
          />
        )}

        {currentScreen === 'game_finished' && (
          <EndGameScreen
            topic={selectedTopic}
            playerName={playerName}
            totalScore={totalScore}
            completedRecords={completedRecords}
            onPlayAgain={handleStartGame}
            onChangeTopic={() => setCurrentScreen('welcome')}
            onOpenHistory={() => setIsHistoryOpen(true)}
          />
        )}
      </main>

      {/* History Modal (Accessible at all times) */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        completedRecords={
          completedRecords.length > 0
            ? completedRecords
            : savedProgress?.completedRecords || []
        }
        onClearHistory={handleClearHistory}
      />

      {/* JSON Dataset Editor / Viewer Modal */}
      <JsonManagerModal
        isOpen={isJsonManagerOpen}
        onClose={() => setIsJsonManagerOpen(false)}
        currentDataset={dataset}
        onSaveDataset={handleSaveDataset}
        onResetToDefault={handleResetToDefault}
      />
    </div>
  );
}
