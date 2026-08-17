import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Award, CheckCircle, Clock, AlertTriangle, Layers, BookOpen } from 'lucide-react';
import { CompletedPhraseRecord, TopicItem } from '../types';
import { soundFx } from '../utils/audio';

interface EndGameScreenProps {
  topic: TopicItem;
  totalScore: number;
  completedRecords: CompletedPhraseRecord[];
  onPlayAgain: () => void;
  onChangeTopic: () => void;
  onOpenHistory: () => void;
}

export const EndGameScreen: React.FC<EndGameScreenProps> = ({
  topic,
  totalScore,
  completedRecords,
  onPlayAgain,
  onChangeTopic,
  onOpenHistory,
}) => {
  useEffect(() => {
    soundFx.playGameFinish();

    // Celebration fireworks
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#669911', '#eab308', '#22c55e'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#669911', '#eab308', '#3b82f6'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalTimeSpent = completedRecords.reduce((acc, r) => acc + r.timeSpent, 0);
  const totalMistakes = completedRecords.reduce((acc, r) => acc + r.mistakes, 0);
  const maxPossibleScore = topic.phrases.length * 130;
  const accuracyPercent = Math.max(
    10,
    Math.min(100, Math.round((totalScore / maxPossibleScore) * 100))
  );

  return (
    <div id="end-game-screen" className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-white rounded-[32px] shadow-sm border border-[#EBE7DF] overflow-hidden"
      >
        {/* Banner */}
        <div className="bg-[#F2F0EB] text-[#43423E] p-6 md:p-8 text-center relative border-b border-[#EBE7DF]">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5A5A40] text-white shadow-xs mx-auto mb-2 border-2 border-white">
              <Trophy className="w-8 h-8 fill-current" />
            </div>
            <h2 className="text-2xl md:text-4xl font-serif italic text-[#5A5A40] tracking-tight font-serif-natural">
              ¡Enhorabuena! Has completado la actividad
            </h2>
            <p className="text-sm md:text-base text-[#8C8984]">
              Temática: {topic.title}
            </p>
          </div>
        </div>

        {/* Stats Summary Grid */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">Puntuación</span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">{totalScore}</p>
              <span className="text-xs text-[#8C8984]">puntos totales</span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">Frases</span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">
                {completedRecords.length} / {topic.phrases.length}
              </p>
              <span className="text-xs text-[#8C8984]">resueltas</span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">Tiempo total</span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">{totalTimeSpent}s</p>
              <span className="text-xs text-[#8C8984]">cronometrado</span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">Errores</span>
              <p className="text-2xl md:text-3xl font-bold text-[#E07A5F] mt-1">{totalMistakes}</p>
              <span className="text-xs text-[#8C8984]">fallos totales</span>
            </div>
          </div>

          {/* List of All Completed Phrases */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#5A5A40] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#A3B18A]" /> Frases resueltas en esta partida:
              </h3>
              <button
                onClick={onOpenHistory}
                className="text-xs font-bold text-[#5A5A40] hover:underline uppercase tracking-wider"
              >
                Ver historial detallado
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {completedRecords.map((rec, i) => (
                <div
                  key={`result-${rec.phraseId}-${i}`}
                  className="p-3.5 rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between text-xs text-[#8C8984]">
                    <span className="font-bold text-[#5A5A40]">
                      {i + 1}. {rec.clue}
                    </span>
                    <span className="font-bold text-[#A3B18A]">+{rec.scoreEarned} pts ({rec.timeSpent}s)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-[#EBE7DF] text-sm font-medium text-[#43423E] flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-[#A3B18A] shrink-0 mt-0.5" />
                    <span>{rec.fullSentence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-[#EBE7DF] flex flex-col sm:flex-row gap-3 items-center justify-center">
            <button
              id="btn-play-again"
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#5A5A40] hover:bg-[#474732] active:scale-95 text-white font-bold text-sm tracking-wider uppercase rounded-2xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar de nuevo</span>
            </button>

            <button
              id="btn-change-topic"
              onClick={onChangeTopic}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#FAF9F6] active:scale-95 text-[#5A5A40] font-bold text-sm tracking-wider uppercase rounded-2xl border border-[#E5E0D5] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#A3B18A]" />
              <span>Introducir otro código</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
