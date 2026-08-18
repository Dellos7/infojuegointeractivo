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
  Cpu,
  Target,
  ShieldAlert,
  LogOut,
  Flag,
  X,
  AlertTriangle,
} from 'lucide-react';
import { PhraseItem, CompletedPhraseRecord } from '../types';
import { tokenizeSentence, shuffleTokens } from '../utils/storage';

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
  onExitWithoutSaving?: () => void;
  onEarlyFinish?: () => void;
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
  onExitWithoutSaving,
  onEarlyFinish,
}) => {
  const targetWords = useRef<string[]>([]);
  const [tiles, setTiles] = useState<TileState[]>([]);
  const [placedWords, setPlacedWords] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [scoreDetails, setScoreDetails] = useState<ScoreBreakdown | null>(null);
  const [confirmModal, setConfirmModal] = useState<'exit' | 'finish' | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const initialTimeLimit = useRef<number>(phrase.estimatedTime || 45);

  const initPhrase = useCallback(() => {
    const tokens = tokenizeSentence(phrase.fullSentence);
    targetWords.current = tokens;
    initialTimeLimit.current = phrase.estimatedTime || 45;

    const tileList: TileState[] = tokens.map((token, index) => ({
      id: `tile-${phrase.id}-${index}-${token}`,
      text: token,
      isPlaced: false,
      isError: false,
    }));

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

  // Handle tile click
  const handleTileClick = (tile: TileState) => {
    if (isCompleted || tile.isPlaced) return;

    const nextExpectedIndex = placedWords.length;
    const expectedWord = targetWords.current[nextExpectedIndex];

    if (tile.text === expectedWord) {
      const updatedPlaced = [...placedWords, tile.text];
      setPlacedWords(updatedPlaced);

      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, isPlaced: true, isError: false } : t))
      );

      if (updatedPlaced.length === targetWords.current.length) {
        handleSuccess(updatedPlaced);
      }
    } else {
      setMistakes((prev) => prev + 1);

      setTiles((prev) =>
        prev.map((t) => (t.id === tile.id ? { ...t, isError: true } : t))
      );

      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => (t.id === tile.id ? { ...t, isError: false } : t))
        );
      }, 500);
    }
  };

  const handleSuccess = (completedTokens: string[]) => {
    setIsCompleted(true);
    setIsTimerRunning(false);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#38BDF8', '#3B82F6', '#10B981', '#F59E0B'],
      });
    } catch {
      // Confetti fallback
    }

    const elapsedSeconds = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000)
    );

    const base = 100;
    const timeLimit = initialTimeLimit.current;
    const isOvertime = timeRemaining <= 0;
    let speedBonus = 0;
    let overtimePenalty = 0;

    if (!isOvertime && elapsedSeconds < timeLimit) {
      speedBonus = Math.min(50, Math.round((timeLimit - elapsedSeconds) * 2));
    } else if (isOvertime) {
      overtimePenalty = 20;
    }

    const mistakePenalty = mistakes * 10;
    const total = Math.max(10, base + speedBonus - overtimePenalty - mistakePenalty);

    const breakdown: ScoreBreakdown = {
      base,
      speedBonus,
      overtimePenalty,
      mistakePenalty,
      total,
      isOvertime,
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

  const targetCount = targetWords.current.length;
  const placedCount = placedWords.length;
  const progressPercent = targetCount > 0 ? (placedCount / targetCount) * 100 : 0;

  return (
    <div
      id="game-area-container"
      className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 py-2 select-none relative"
    >
      {/* 1. Header Mission & Progress Info */}
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] animate-ping" />
            <span className="text-xs font-mono font-bold tracking-widest text-[#38BDF8] uppercase">
              DECODIFICADOR ACTIVO • FASE {phraseIndex + 1}/{totalPhrases}
            </span>
          </div>

          <span className="text-xs font-mono text-[#94A3B8] font-bold">
            {placedCount} de {targetCount} segmentos
          </span>
        </div>

        {/* Phase progress mini bar */}
        <div className="w-full h-1.5 bg-[#1E293B] rounded-full overflow-hidden border border-[#334155]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#3B82F6] via-[#06B6D4] to-[#10B981]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 2. Cyber Clue / Challenge Prompt Card */}
      <div
        id="challenge-card"
        className="hud-card p-5 sm:p-7 rounded-[22px] mb-5 border border-[#1E293B] bg-[#0F172A] shadow-xl relative overflow-hidden glow-blue"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5 shadow-inner">
            <Target className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#38BDF8] block">
              ENUNCIADO / PISTA
            </span>
            <h2 className="text-lg sm:text-2xl font-tech font-bold text-white leading-snug">
              {phrase.clue}
            </h2>
          </div>
        </div>
      </div>

      {/* 3. Assembly Slots Area */}
      <div className="hud-card p-5 sm:p-7 rounded-[22px] mb-5 bg-[#0A0E17] border border-[#1E293B] shadow-2xl relative min-h-[140px] flex flex-col justify-center">
        <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
          <span>ZONA DE ENSAMBLAJE DE LA FRASE</span>
          {isCompleted && (
            <span className="text-[#10B981] font-bold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> SECUENCIA CORRECTA
            </span>
          )}
        </div>

        {/* Word Slots Container */}
        <div
          id="placed-words-container"
          className="flex flex-wrap gap-2.5 sm:gap-3 items-center min-h-[56px] p-3 rounded-xl bg-[#0F172A]/80 border border-[#1E293B]"
        >
          {targetWords.current.map((_, index) => {
            const isFilled = index < placedWords.length;
            const word = placedWords[index];
            const isNext = index === placedWords.length;

            return (
              <AnimatePresence key={`slot-${index}`} mode="wait">
                {isFilled ? (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0, y: -5 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1E3A8A] to-[#1D4ED8] text-white font-mono font-bold text-sm sm:text-base border border-[#60A5FA]/60 shadow-lg glow-blue"
                  >
                    {word}
                  </motion.span>
                ) : (
                  <span
                    className={`inline-block min-w-[50px] sm:min-w-[70px] h-10 sm:h-11 rounded-xl border-2 border-dashed transition-all duration-300 ${
                      isNext
                        ? 'border-[#38BDF8] bg-[#0284C7]/10 animate-pulse glow-cyan'
                        : 'border-[#1E293B] bg-[#0F172A]/40'
                    }`}
                  />
                )}
              </AnimatePresence>
            );
          })}
        </div>
      </div>

      {/* 4. Available Interactive Words Matrix */}
      <div className="hud-card p-5 sm:p-7 rounded-[22px] mb-5 bg-[#0F172A] border border-[#1E293B] shadow-xl">
        <div className="flex items-center justify-between mb-3 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
          <span>SELECCIONA LAS PALABRAS EN ORDEN</span>
          <span className="text-[#38BDF8]">
            {tiles.filter((t) => !t.isPlaced).length} restantes
          </span>
        </div>

        <div id="word-tiles-grid" className="flex flex-wrap gap-2.5 sm:gap-3 justify-center py-2">
          {tiles.map((tile) => {
            if (tile.isPlaced) return null;

            return (
              <button
                key={tile.id}
                onClick={() => handleTileClick(tile)}
                className={`tile-btn px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-mono font-bold text-sm sm:text-base cursor-pointer select-none transition-all active:scale-95 border ${
                  tile.isError
                    ? 'bg-[#7F1D1D] text-[#FCA5A5] border-[#EF4444] animate-shake glow-red'
                    : 'bg-[#1E293B] hover:bg-[#334155] text-white hover:text-[#38BDF8] border-[#334155] hover:border-[#38BDF8]/60 shadow-md'
                }`}
              >
                {tile.text}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Bottom HUD Command Bar */}
      <footer className="flex flex-wrap items-center justify-between mt-auto bg-[#0F172A] p-4 sm:p-5 rounded-2xl border border-[#1E293B] gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          {!isCompleted && (
            <button
              id="btn-reset-phrase"
              onClick={initPhrase}
              title="Reiniciar secuencia de esta frase"
              className="flex items-center gap-2 text-xs font-mono font-bold text-[#94A3B8] hover:text-white uppercase tracking-wider bg-[#1E293B] hover:bg-[#334155] px-3.5 py-2 rounded-xl border border-[#334155] transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>REINICIAR</span>
            </button>
          )}

          {onEarlyFinish && (
            <button
              id="btn-early-finish-footer"
              onClick={() => setConfirmModal('finish')}
              title="Finalizar partida con las frases actuales"
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#34D399] hover:text-white uppercase tracking-wider bg-[#064E3B]/70 hover:bg-[#047857] px-3.5 py-2 rounded-xl border border-[#059669]/60 transition-all cursor-pointer glow-emerald shadow-sm"
            >
              <Flag className="w-3.5 h-3.5 text-[#10B981]" />
              <span>FINALIZAR JUEGO</span>
            </button>
          )}

          {onExitWithoutSaving && (
            <button
              id="btn-exit-nosave-footer"
              onClick={() => setConfirmModal('exit')}
              title="Volver a la pantalla inicial sin guardar"
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#94A3B8] hover:text-[#EF4444] uppercase tracking-wider bg-[#1E293B] hover:bg-[#7F1D1D]/70 px-3.5 py-2 rounded-xl border border-[#334155] hover:border-[#EF4444]/60 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>SALIR AL INICIO</span>
            </button>
          )}

          {mistakes > 0 && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FCA5A5] bg-[#7F1D1D]/70 px-3 py-1.5 rounded-xl border border-[#EF4444]/60 glow-red">
              <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" /> {mistakes} {mistakes === 1 ? 'FALLO' : 'FALLOS'}
            </span>
          )}

          {timeRemaining === 0 && !isCompleted && (
            <span className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#FCA5A5] bg-[#7F1D1D] px-3 py-1.5 rounded-xl border border-[#EF4444] glow-red animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" /> TIEMPO AGOTADO (-XP)
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
              {/* Score Breakdown Pill */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 sm:gap-3 text-xs font-mono font-bold bg-[#1E293B] px-4 py-2 rounded-xl border border-[#334155] glow-blue">
                <div className="flex items-center gap-1 text-[#38BDF8]">
                  <Award className="w-4 h-4 text-[#F59E0B]" />
                  <span>+{scoreDetails.total} XP</span>
                </div>
                {scoreDetails.speedBonus > 0 && (
                  <span className="text-[#10B981] flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-current" /> VELOCIDAD: +{scoreDetails.speedBonus}
                  </span>
                )}
                {scoreDetails.isOvertime && (
                  <span className="text-[#EF4444]">
                    FUERA DE TIEMPO
                  </span>
                )}
                {scoreDetails.mistakePenalty > 0 && (
                  <span className="text-[#EF4444]">
                    PENALIZACIÓN: -{scoreDetails.mistakePenalty}
                  </span>
                )}
              </div>

              <button
                id="btn-next-phrase"
                onClick={onNextPhrase}
                className="px-6 sm:px-8 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white rounded-xl font-tech font-bold text-sm tracking-widest uppercase active:scale-95 transition-all flex items-center gap-2 cursor-pointer glow-emerald"
              >
                <span>{isLastPhrase ? 'INFORME FINAL' : 'SIGUIENTE FASE'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          ) : (
            <span className="text-xs font-mono text-[#64748B] italic">
              [ Completa la secuencia para avanzar ]
            </span>
          )}
        </div>
      </footer>

      {/* Confirmation Dialog Modal */}
      <AnimatePresence>
        {confirmModal && (
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setConfirmModal(null);
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0F172A] rounded-[24px] shadow-2xl border border-[#1E293B] w-full max-w-md overflow-hidden glow-blue"
            >
              {/* Modal Header */}
              <div className="bg-[#0B0F19] px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border ${
                      confirmModal === 'exit'
                        ? 'bg-[#7F1D1D]/50 border-[#EF4444]/60 text-[#EF4444]'
                        : 'bg-[#064E3B]/50 border-[#10B981]/60 text-[#10B981]'
                    }`}
                  >
                    {confirmModal === 'exit' ? (
                      <LogOut className="w-5 h-5" />
                    ) : (
                      <Flag className="w-5 h-5" />
                    )}
                  </div>
                  <h3 className="font-tech font-bold text-lg text-white uppercase tracking-wider">
                    {confirmModal === 'exit'
                      ? '¿Salir a la pantalla inicial?'
                      : '¿Finalizar juego ahora?'}
                  </h3>
                </div>
                <button
                  onClick={() => setConfirmModal(null)}
                  className="p-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 bg-[#0B0F19]/90 space-y-4">
                <p className="text-sm font-mono text-[#CBD5E1] leading-relaxed">
                  {confirmModal === 'exit'
                    ? 'Se cancelará la sesión actual y no se guardará el progreso de esta partida. Volverás a la terminal de acceso.'
                    : `Se cerrará la partida con las frases decodificadas hasta ahora (${phraseIndex + (isCompleted ? 1 : 0)} de ${totalPhrases}) y se generará el informe final de misión.`}
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirmModal === 'exit' && onExitWithoutSaving) {
                        setConfirmModal(null);
                        onExitWithoutSaving();
                      } else if (confirmModal === 'finish' && onEarlyFinish) {
                        setConfirmModal(null);
                        onEarlyFinish();
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl font-tech font-bold text-xs uppercase tracking-wider text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      confirmModal === 'exit'
                        ? 'bg-gradient-to-r from-[#DC2626] to-[#EF4444] hover:from-[#B91C1C] hover:to-[#DC2626] glow-red'
                        : 'bg-gradient-to-r from-[#059669] to-[#10B981] hover:from-[#047857] hover:to-[#059669] glow-emerald'
                    }`}
                  >
                    {confirmModal === 'exit' ? (
                      <>
                        <LogOut className="w-4 h-4" />
                        <span>Sí, Salir sin Guardar</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Sí, Finalizar y Ver Informe</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmModal(null)}
                    className="py-3 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-wider bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white border border-[#334155] cursor-pointer transition-all"
                  >
                    Seguir Jugando
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
