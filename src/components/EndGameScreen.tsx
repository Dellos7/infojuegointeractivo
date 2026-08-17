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
} from 'lucide-react';
import { CompletedPhraseRecord, TopicItem } from '../types';
import { soundFx } from '../utils/audio';

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
        colors: ['#A3B18A', '#5A5A40', '#E07A5F', '#D4A373'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#A3B18A', '#5A5A40', '#3b82f6'],
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
  const currentDateFormatted = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Map each phrase in the topic to either its record or uncompleted
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
      // Generate high-res image
      const dataUrl = await toPng(certificateRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FAF9F6',
      });

      const cleanPlayerName = (playerName || 'alumno')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_');
      const cleanTopic = (topic.title || 'actividad')
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, '_')
        .substring(0, 20);

      const link = document.createElement('a');
      link.download = `resumen_${cleanPlayerName}_${cleanTopic}.png`;
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
        className="w-full bg-white rounded-[32px] shadow-sm border border-[#EBE7DF] overflow-hidden"
      >
        {/* Certificate / Summary Container to Capture */}
        <div ref={certificateRef} className="p-6 md:p-10 bg-white space-y-6">
          {/* Header Banner */}
          <div className="bg-[#F2F0EB] text-[#43423E] p-6 md:p-8 rounded-3xl text-center relative border border-[#EBE7DF]">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#5A5A40] text-white shadow-xs mx-auto mb-2 border-2 border-white">
                <Trophy className="w-8 h-8 fill-current text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-serif italic text-[#5A5A40] tracking-tight font-serif-natural">
                Resumen de la Actividad
              </h2>

              {/* Student & Topic Badge */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 pt-1 text-xs sm:text-sm">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#5A5A40] font-bold border border-[#EBE7DF] shadow-2xs">
                  <User className="w-3.5 h-3.5 text-[#A3B18A]" />
                  <span>Alumno/a: {playerName || 'Estudiante'}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white text-[#5A5A40] font-bold border border-[#EBE7DF] shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-[#A3B18A]" />
                  <span>Actividad: {topic.title}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-[#8C8984] font-medium border border-[#EBE7DF] shadow-2xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentDateFormatted}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">
                Puntuación
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">{totalScore}</p>
              <span className="text-xs text-[#8C8984]">puntos obtenidos</span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">
                Frases
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">
                {completedCount} / {totalPhrasesCount}
              </p>
              <span className="text-xs text-[#8C8984]">
                {completedCount === totalPhrasesCount ? 'Completadas (100%)' : 'Resueltas'}
              </span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">
                Tiempo Total
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#5A5A40] mt-1">{totalTimeSpent}s</p>
              <span className="text-xs text-[#8C8984]">empleado</span>
            </div>

            <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#EBE7DF]">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-widest block">
                Errores
              </span>
              <p className="text-2xl md:text-3xl font-bold text-[#E07A5F] mt-1">{totalMistakes}</p>
              <span className="text-xs text-[#8C8984]">fallos en clics</span>
            </div>
          </div>

          {/* List of All Phrases (Completed & Not Completed) */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#A3B18A]" /> Detalle de frases de la actividad:
            </h3>

            <div className="space-y-2.5">
              {phrasesReport.map(({ index, phrase, record, isCompleted }) => (
                <div
                  key={`result-phrase-${phrase.id}-${index}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'border-[#EBE7DF] bg-[#FAF9F6]'
                      : 'border-[#E07A5F]/30 bg-[#FAF9F6]/50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between text-xs text-[#8C8984] gap-1 mb-1">
                    <span className="font-bold text-[#5A5A40]">
                      {index}. {phrase.clue}
                    </span>
                    {isCompleted && record ? (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#A3B18A] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> +{record.scoreEarned} pts
                        </span>
                        <span className="text-[11px] text-[#8C8984]">({record.timeSpent}s)</span>
                        {record.mistakes > 0 && (
                          <span className="text-[11px] text-[#E07A5F]">
                            {record.mistakes} {record.mistakes === 1 ? 'error' : 'errores'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="font-bold text-[#E07A5F] flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> No completada
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-[#EBE7DF] text-xs sm:text-sm font-medium text-[#43423E] flex items-start gap-2">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-[#A3B18A] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[#E07A5F] shrink-0 mt-0.5" />
                    )}
                    <span>{phrase.fullSentence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="p-6 md:p-8 bg-[#FAF9F6] border-t border-[#EBE7DF] flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Download Image Button */}
          <button
            type="button"
            id="btn-download-summary"
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#A3B18A] hover:bg-[#8f9f76] active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>¡Imagen Descargada!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generando imagen...' : 'Descargar Resumen en Imagen (PNG)'}</span>
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="btn-play-again"
              onClick={onPlayAgain}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#5A5A40] hover:bg-[#474732] active:scale-95 text-white font-bold text-xs tracking-wider uppercase rounded-2xl shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Jugar de nuevo</span>
            </button>

            <button
              id="btn-change-topic"
              onClick={onChangeTopic}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F2F0EB] active:scale-95 text-[#5A5A40] font-bold text-xs tracking-wider uppercase rounded-2xl border border-[#E5E0D5] transition-all flex items-center justify-center gap-2 cursor-pointer"
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
