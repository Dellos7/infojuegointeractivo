import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Check,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Award,
  Clock,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { PhraseItem, CompletedPhraseRecord } from '../types';
import { tokenizeSentence, shuffleTokens } from '../utils/storage';
import { soundFx } from '../utils/audio';

interface GameAreaProps {
  phrase: PhraseItem;
  phraseIndex: number;
  totalPhrases: number;
  topicId: string;
  topicTitle: string;
  onPhraseCompleted: (record: CompletedPhraseRecord) => void;
  onNextPhrase: () => void;
  isLastPhrase: boolean;
  timeRemaining: number;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  isTimerRunning: boolean;
  setIsTimerRunning: React.Dispatch<React.SetStateAction<boolean>>;
}

interface TileState {
  id: string;
  text: string;
  isPlaced: boolean;
  isError: boolean;
}

interface ScoreBreakdown {
  base: number;
  speedBonus: number;
  overtimePenalty: number;
  mistakePenalty: number;
  total: number;
  isOvertime: boolean;
}

export const GameArea: React.FC<GameAreaProps> = ({
  phrase,
  phraseIndex,
  totalPhrases,
  topicId,
  topicTitle,
  onPhraseCompleted,
  onNextPhrase,
  isLastPhrase,
  timeRemaining,
  setTimeRemaining,
  isTimerRunning,
  setIsTimerRunning,
}) => {
  // Target words in correct sequence
  const targetWords = useRef<string[]>([]);
  // Shuffled tiles in the bank
  const [tiles, setTiles] = useState<TileState[]>([]);
  // Indices/Words placed so far in order
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  // Mistakes made in this phrase
  const [mistakes, setMistakes] = useState<number>(0);
  // Whether this phrase is currently solved
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  // Score earned for this phrase
  const [scoreDetails, setScoreDetails] = useState<ScoreBreakdown | null>(null);
  // Start time for calculating duration
  const startTimeRef = useRef<number>(Date.now());
  const initialTimeLimit = useRef<number>(phrase.estimatedTime || 45);

  // Initialize phrase whenever phrase changes
  const initPhrase = useCallback(() => {
    const tokens = tokenizeSentence(phrase.fullSentence);
    targetWords.current = tokens;
    initialTimeLimit.current = phrase.estimatedTime || 45;

    // Create tiles
    const tileList: TileState[] = tokens.map((token, index) => ({
      id: `tile-${phrase.id}-${index}-${token}`,
      text: token,
      isPlaced: false,
      isError: false,
    }));

    // Shuffle the tiles
    const shuffled = shuffleTokens(tileList);
    setTiles(shuffled);
    setPlacedWords([]);
    setMistakes(0);
    setIsCompleted(false);
    setScoreDetails(null);
    setTimeRemaining(initialTimeLimit.current);
    setIsTimerRunning(true);
    startTimeRef.current = Date.now();
  }, [phrase, setTimeRemaining, setIsTimerRunning]);

  useEffect(() => {
    initPhrase();
  }, [initPhrase]);

  // Handle clicking a word tile
  const handleWordClick = (tile: TileState) => {
    if (tile.isPlaced || isCompleted) return;

    const nextTargetIndex = placedWords.length;
    const expectedWord = targetWords.current[nextTargetIndex];

    // Check if the clicked tile's text matches what is expected next
    if (tile.text === expectedWord) {
      // Correct!
      soundFx.playCorrect();

      // Mark this tile as placed
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, isPlaced: true, isError: false } : t))
      );

      const newPlaced = [...placedWords, tile.text];
      setPlacedWords(newPlaced);

      // Check if all words are now placed
      if (newPlaced.length === targetWords.current.length) {
        handleCompletion(newPlaced);
      }
    } else {
      // Incorrect!
      soundFx.playError();
      setMistakes((prev) => prev + 1);

      // Flash error on the clicked tile
      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, isError: true } : t))
      );

      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => (t.id === tile.id ? { ...t, isError: false } : t))
        );
      }, 450);
    }
  };

  // Completion logic with revised dynamic scoring
  const handleCompletion = (finalPlaced: string[]) => {
    setIsCompleted(true);
    setIsTimerRunning(false);
    soundFx.playPhraseComplete();

    // Trigger confetti
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#A3B18A', '#5A5A40', '#E07A5F', '#D4A373'],
    });

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
    const timeLimit = initialTimeLimit.current;
    const isWithinTime = timeRemaining > 0;

    let base = 0;
    let speedBonus = 0;
    let overtimePenalty = 0;
    let mistakePenalty = 0;
    let total = 0;

    if (isWithinTime) {
      // Completed in time: Base 100 points
      base = 100;
      // Proportional speed bonus up to +100 additional points for fastest completions
      const timeFraction = Math.max(0, Math.min(1, timeRemaining / timeLimit));
      speedBonus = Math.round(timeFraction * 100);
      // Penalize mistakes during active time
      mistakePenalty = mistakes * 10;
      // Total score clamped to minimum 35 pts
      total = Math.max(35, base + speedBonus - mistakePenalty);
    } else {
      // Completed after time expired: Much lower base points (35 pts)
      base = 35;
      speedBonus = 0;
      const extraSeconds = Math.max(0, elapsedSeconds - timeLimit);
      overtimePenalty = Math.min(20, Math.floor(extraSeconds / 2));
      mistakePenalty = mistakes * 5;
      // Minimum floor score for completing the phrase
      total = Math.max(10, base - overtimePenalty - mistakePenalty);
    }

    const breakdown: ScoreBreakdown = {
      base,
      speedBonus,
      overtimePenalty,
      mistakePenalty,
      total,
      isOvertime: !isWithinTime,
    };

    setScoreDetails(breakdown);

    const record: CompletedPhraseRecord = {
      phraseId: phrase.id,
      topicId: topicId,
      topicTitle: topicTitle,
      clue: phrase.clue,
      fullSentence: phrase.fullSentence,
      timeSpent: elapsedSeconds,
      timeLimit: timeLimit,
      mistakes: mistakes,
      scoreEarned: total,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    onPhraseCompleted(record);
  };

  return (
    <div id="educaplay-game-area" className="flex-1 flex flex-col w-full max-w-5xl mx-auto p-4 sm:p-8 select-none gap-6">
      {/* 1. Session Progress Header */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-[#5A5A40] mb-2 uppercase tracking-wider">
            Progreso de la sesión
          </span>
          <div className="flex gap-2">
            {Array.from({ length: totalPhrases }).map((_, idx) => {
              const isDone = idx < phraseIndex;
              const isCurrent = idx === phraseIndex;
              return (
                <div
                  key={`prog-pill-${idx}`}
                  className="w-8 h-2.5 rounded-full overflow-hidden transition-all bg-[#D4D2CD]"
                >
                  {isDone && <div className="h-full w-full bg-[#A3B18A]" />}
                  {isCurrent && (
                    <div
                      className="h-full bg-[#A3B18A] transition-all duration-300"
                      style={{
                        width: isCompleted
                          ? '100%'
                          : `${Math.min(100, (placedWords.length / (targetWords.current.length || 1)) * 100)}%`,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <span className="text-sm italic text-[#8C8984] font-serif font-serif-natural">
          Frase {phraseIndex + 1} de {totalPhrases}
        </span>
      </div>

      {/* 2. Enunciado / Pregunta */}
      <div
        id="phrase-clue-header"
        className="text-center py-2 px-4"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C8984] block mb-1">
          Enunciado de la frase
        </span>
        <h2 className="text-xl sm:text-3xl font-serif italic text-[#5A5A40] tracking-tight font-serif-natural">
          {phrase.clue}
        </h2>
      </div>

      {/* 3. Main Sentence Construction Box */}
      <div className="w-full flex-1 flex flex-col items-center justify-center gap-8">
        <div
          id="assembled-sentence-box"
          className="w-full max-w-4xl min-h-[140px] sm:min-h-[160px] bg-white rounded-[32px] border-2 border-dashed border-[#D4D2CD] p-6 sm:p-8 flex flex-wrap content-start gap-3 relative shadow-xs"
        >
          {/* Floating Pill Label */}
          <div className="absolute -top-3.5 left-6 px-4 py-0.5 bg-white border border-[#EBE7DF] rounded-full text-[10px] sm:text-[11px] font-bold text-[#A3B18A] uppercase tracking-tight shadow-2xs">
            {isCompleted ? '¡Frase completada!' : 'Construyendo frase...'}
          </div>

          {placedWords.length === 0 ? (
            <div className="flex items-center gap-3 w-full py-4">
              <div className="w-20 h-[50px] border border-[#EBE7DF] bg-[#FAF9F6] rounded-xl flex items-center justify-center opacity-40">
                <div className="w-8 h-[2px] bg-[#D4D2CD]" />
              </div>
              <p className="text-sm text-[#8C8984] italic">
                Haz clic en las palabras de abajo en el orden correcto para formar la oración...
              </p>
            </div>
          ) : (
            <>
              {placedWords.map((word, idx) => (
                <motion.div
                  key={`placed-${idx}-${word}`}
                  initial={{ scale: 0.85, opacity: 0, y: 8 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="px-5 py-3 bg-[#A3B18A] text-white rounded-xl shadow-xs font-medium text-base sm:text-lg select-none"
                >
                  {word}
                </motion.div>
              ))}

              {!isCompleted && (
                <div className="w-20 h-[50px] border border-[#EBE7DF] bg-[#FAF9F6] rounded-xl flex items-center justify-center opacity-40">
                  <div className="w-8 h-[2px] bg-[#D4D2CD]" />
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Word Bank */}
        <div
          id="word-bank"
          className="w-full max-w-3xl flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          {tiles.map((tile) => {
            if (tile.isPlaced) {
              return (
                <div
                  key={tile.id}
                  className="px-6 py-3.5 sm:py-4 bg-[#A3B18A] border border-[#A3B18A] rounded-2xl shadow-xs text-base sm:text-lg font-medium text-white opacity-60 cursor-default select-none"
                >
                  {tile.text}
                </div>
              );
            }

            return (
              <button
                type="button"
                key={tile.id}
                id={`tile-btn-${tile.id}`}
                onClick={() => handleWordClick(tile)}
                className={`px-6 py-3.5 sm:py-4 rounded-2xl shadow-xs text-base sm:text-lg font-medium transition-all duration-150 cursor-pointer select-none active:scale-95 hover:-translate-y-0.5 ${
                  tile.isError
                    ? 'bg-[#E07A5F] border border-[#E07A5F] text-white animate-shake'
                    : 'bg-white border border-[#E5E0D5] text-[#43423E] hover:border-[#5A5A40] hover:shadow-xs'
                }`}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom Action Footer */}
      <footer className="flex flex-wrap items-center justify-between mt-auto bg-[#F2F0EB] p-4 sm:p-6 rounded-[24px] border border-[#EBE7DF] gap-4">
        <div className="flex items-center gap-3">
          {!isCompleted && (
            <button
              id="btn-reset-phrase"
              onClick={initPhrase}
              title="Reiniciar intento de esta frase"
              className="flex items-center gap-2 text-xs font-bold text-[#8C8984] hover:text-[#5A5A40] uppercase tracking-wider bg-white px-3.5 py-2 rounded-xl border border-[#E5E0D5] shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar frase</span>
            </button>
          )}

          {mistakes > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#E07A5F] bg-white px-3 py-1.5 rounded-xl border border-[#E5E0D5]">
              <AlertCircle className="w-3.5 h-3.5" /> {mistakes} {mistakes === 1 ? 'error' : 'errores'}
            </span>
          )}

          {timeRemaining === 0 && !isCompleted && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-[#E07A5F] bg-white px-3 py-1.5 rounded-xl border border-[#E5E0D5]">
              <Clock className="w-3.5 h-3.5" /> Tiempo agotado (puntuación reducida)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {isCompleted && scoreDetails ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap items-center gap-3"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3 text-xs font-bold text-[#5A5A40] bg-white px-4 py-2 rounded-xl border border-[#E5E0D5]">
                <div className="flex items-center gap-1 text-[#5A5A40]">
                  <Award className="w-4 h-4 text-[#A3B18A]" />
                  <span>+{scoreDetails.total} pts</span>
                </div>
                {scoreDetails.speedBonus > 0 && (
                  <span className="text-[11px] text-[#A3B18A] flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3" /> Rapidez: +{scoreDetails.speedBonus}
                  </span>
                )}
                {scoreDetails.isOvertime && (
                  <span className="text-[11px] text-[#E07A5F] font-semibold">
                    Fuera de tiempo
                  </span>
                )}
                {scoreDetails.mistakePenalty > 0 && (
                  <span className="text-[11px] text-[#E07A5F] font-semibold">
                    Fallos: -{scoreDetails.mistakePenalty}
                  </span>
                )}
              </div>

              <button
                id="btn-next-phrase"
                onClick={onNextPhrase}
                className="px-8 py-3 bg-[#5A5A40] hover:bg-[#474732] text-white rounded-xl font-bold text-sm tracking-wide shadow-sm uppercase active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>{isLastPhrase ? 'Resultados finales' : 'Siguiente frase'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <span className="text-xs text-[#8C8984] italic">
              Forma la oración haciendo clic en las palabras
            </span>
          )}
        </div>
      </footer>
    </div>
  );
};
