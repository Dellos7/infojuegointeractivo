import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';
import {
  Trophy,
  RotateCcw,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Layers,
  BookOpen,
  Download,
  User,
  Calendar,
  Check,
  Zap,
  Cpu,
  ShieldCheck,
  Target,
  Sparkles,
} from 'lucide-react';
import { CompletedPhraseRecord, TopicItem } from '../types';

interface EndGameScreenProps {
  topic: TopicItem;
  playerName: string;
  totalScore: number;
  completedRecords: CompletedPhraseRecord[];
  onPlayAgain: () => void;
  onChangeTopic: () => void;
  onOpenHistory: () => void;
}

export const EndGameScreen: React.FC<EndGameScreenProps> = ({
  topic,
  playerName,
  totalScore,
  completedRecords,
  onPlayAgain,
  onChangeTopic,
  onOpenHistory,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Celebration fireworks
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors: ['#38BDF8', '#3B82F6', '#10B981', '#F59E0B'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors: ['#38BDF8', '#3B82F6', '#10B981', '#F59E0B'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const totalTimeSpent = completedRecords.reduce((acc, r) => acc + r.timeSpent, 0);
  const totalMistakes = completedRecords.reduce((acc, r) => acc + r.mistakes, 0);
  const totalPhrasesCount = topic.phrases.length;
  const completedCount = completedRecords.length;
  const accuracy = totalPhrasesCount > 0
    ? Math.max(0, Math.round(((totalPhrasesCount * 100) - (totalMistakes * 15)) / totalPhrasesCount))
    : 100;

  // Rank determination
  let rank = 'S';
  let rankColor = 'text-[#F59E0B] border-[#F59E0B] bg-[#78350F]/40';
  let rankLabel = 'RANGO S - MAESTRO DIGITAL';

  if (completedCount < totalPhrasesCount || accuracy < 70) {
    rank = 'C';
    rankColor = 'text-[#94A3B8] border-[#94A3B8] bg-[#1E293B]';
    rankLabel = 'RANGO C - INICIADO';
  } else if (accuracy < 85) {
    rank = 'B';
    rankColor = 'text-[#38BDF8] border-[#38BDF8] bg-[#0C4A6E]/40';
    rankLabel = 'RANGO B - ESPECIALISTA';
  } else if (accuracy < 95) {
    rank = 'A';
    rankColor = 'text-[#10B981] border-[#10B981] bg-[#064E3B]/40';
    rankLabel = 'RANGO A - EXPERTO';
  }

  const currentDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const phrasesReport = topic.phrases.map((phrase, idx) => {
    const record = completedRecords.find((r) => r.phraseId === phrase.id);
    return {
      index: idx + 1,
      phrase,
      record,
      isCompleted: !!record,
    };
  });

  const handleDownloadImage = async () => {
    if (!certificateRef.current || isDownloading) return;

    try {
      setIsDownloading(true);
      const dataUrl = await toPng(certificateRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0B0F19',
        skipFonts: true,
      });

      const cleanPlayerName = (playerName || 'jugador')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_');
      const cleanTopic = (topic.title || 'mision')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .substring(0, 20);

      const link = document.createElement('a');
      link.download = `informe_mision_${cleanPlayerName}_${cleanTopic}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error generating image summary:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div id="end-game-screen" className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full bg-[#0F172A] rounded-[28px] shadow-2xl border border-[#1E293B] overflow-hidden glow-blue"
      >
        {/* Certificate Container to Capture */}
        <div ref={certificateRef} className="p-6 md:p-8 bg-[#0B0F19] space-y-6 text-[#E2E8F0] border-b border-[#1E293B]">
          {/* Header Banner */}
          <div className="bg-[#0F172A] p-6 md:p-8 rounded-2xl text-center relative border border-[#1E293B] shadow-lg bg-tech-grid">
            <div className="flex justify-between items-center text-[10px] font-mono text-[#64748B] mb-2 uppercase">
              <span>SISTEMA DE EVALUACIÓN DIGITAL</span>
              <span>ID: MISIÓN-{topic.id.toUpperCase().substring(0, 8)}</span>
            </div>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E293B] border-2 border-[#38BDF8] text-[#38BDF8] shadow-lg mx-auto mb-2 glow-cyan">
              <Trophy className="w-8 h-8 fill-current text-[#F59E0B]" />
            </div>

            <h2 className="text-2xl md:text-3xl font-tech font-bold text-white tracking-wider uppercase">
              Misión Cumplida - Informe Oficial
            </h2>

            {/* Rank Badge */}
            <div className="mt-3 flex items-center justify-center">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold tracking-widest ${rankColor}`}>
                <Sparkles className="w-3.5 h-3.5" />
                {rankLabel}
              </span>
            </div>

            {/* Player & Topic Info */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-4 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E293B] text-[#38BDF8] font-bold border border-[#334155]">
                <User className="w-3.5 h-3.5" />
                <span>JUGADOR: {playerName || 'Agente'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E293B] text-white font-bold border border-[#334155]">
                <Cpu className="w-3.5 h-3.5 text-[#10B981]" />
                <span>MISIÓN: {topic.title}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1E293B] text-[#94A3B8] font-medium border border-[#334155]">
                <Calendar className="w-3.5 h-3.5" />
                <span>{currentDateFormatted}</span>
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-[#0F172A] rounded-2xl border border-[#1E293B] glow-blue">
              <span className="text-[10px] font-mono font-bold text-[#60A5FA] uppercase tracking-widest block">
                PUNTUACIÓN XP
              </span>
              <p className="text-2xl md:text-3xl font-mono font-bold text-white mt-1">{totalScore}</p>
              <span className="text-[11px] font-mono text-[#64748B]">puntos obtenidos</span>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-2xl border border-[#1E293B] glow-emerald">
              <span className="text-[10px] font-mono font-bold text-[#10B981] uppercase tracking-widest block">
                FRASES RESUELTAS
              </span>
              <p className="text-2xl md:text-3xl font-mono font-bold text-white mt-1">
                {completedCount} / {totalPhrasesCount}
              </p>
              <span className="text-[11px] font-mono text-[#64748B]">
                {completedCount === totalPhrasesCount ? 'Completadas (100%)' : 'Completadas'}
              </span>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-2xl border border-[#1E293B] glow-cyan">
              <span className="text-[10px] font-mono font-bold text-[#38BDF8] uppercase tracking-widest block">
                TIEMPO TOTAL
              </span>
              <p className="text-2xl md:text-3xl font-mono font-bold text-white mt-1">{totalTimeSpent}s</p>
              <span className="text-[11px] font-mono text-[#64748B]">duración de sesión</span>
            </div>

            <div className="p-4 bg-[#0F172A] rounded-2xl border border-[#1E293B]">
              <span className="text-[10px] font-mono font-bold text-[#F87171] uppercase tracking-widest block">
                PRECISIÓN / FALLOS
              </span>
              <p className="text-2xl md:text-3xl font-mono font-bold text-[#EF4444] mt-1">{totalMistakes}</p>
              <span className="text-[11px] font-mono text-[#64748B]">{accuracy}% precisión</span>
            </div>
          </div>

          {/* Phrases Breakdown List */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-wider flex items-center gap-2">
              <Target className="w-4 h-4 text-[#38BDF8]" /> Desglose detallado de la misión:
            </h3>

            <div className="space-y-2.5">
              {phrasesReport.map(({ index, phrase, record, isCompleted }) => (
                <div
                  key={`result-phrase-${phrase.id}-${index}`}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isCompleted
                      ? 'border-[#1E293B] bg-[#0F172A]'
                      : 'border-[#EF4444]/40 bg-[#7F1D1D]/20'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#94A3B8] gap-1 mb-1 font-mono">
                    <span className="font-bold text-white">
                      {index}. {phrase.clue}
                    </span>
                    {isCompleted && record ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#10B981] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> +{record.scoreEarned} XP
                        </span>
                        <span className="text-[11px] text-[#64748B]">({record.timeSpent}s)</span>
                        {record.mistakes > 0 && (
                          <span className="text-[11px] text-[#EF4444]">
                            {record.mistakes} {record.mistakes === 1 ? 'fallo' : 'fallos'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-[#EF4444] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> No completada
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#1E293B] border border-[#334155] text-xs sm:text-sm font-mono text-[#E2E8F0] flex items-start gap-2">
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                        <span className="text-[#E2E8F0] font-medium">{phrase.fullSentence}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-[#EF4444] shrink-0 mt-0.5" />
                        <span className="text-[#64748B] italic tracking-wide">
                          [ Frase no resuelta — Solución oculta ]
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="p-6 md:p-8 bg-[#0F172A] flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Download Image Button */}
          <button
            type="button"
            id="btn-download-summary"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#0284C7] to-[#06B6D4] hover:from-[#0369A1] hover:to-[#0891B2] active:scale-95 text-white font-tech font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg glow-cyan transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>¡INFORME DESCARGADO!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'GENERANDO ARCHIVO...' : 'DESCARGAR INFORME (PNG)'}</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="btn-play-again"
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] active:scale-95 text-white font-tech font-bold text-xs tracking-widest uppercase rounded-xl shadow-md glow-blue transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>REPETIR MISIÓN</span>
            </button>

            <button
              id="btn-change-topic"
              onClick={onChangeTopic}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#1E293B] hover:bg-[#334155] active:scale-95 text-[#38BDF8] hover:text-white font-tech font-bold text-xs tracking-widest uppercase rounded-xl border border-[#334155] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              <span>OTRA CLAVE</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
