import React from 'react';
import { Volume2, VolumeX, History, Code, Sparkles, RefreshCw, Trophy, Clock } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface NavbarProps {
  topicTitle: string;
  score: number;
  timeRemaining?: number;
  totalTime?: number;
  isTimerRunning?: boolean;
  currentPhraseNum?: number;
  totalPhrases?: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHistory: () => void;
  onOpenJsonManager?: () => void;
  onRestartCurrent?: () => void;
  showInGameControls?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  topicTitle,
  score,
  timeRemaining,
  totalTime = 60,
  isTimerRunning = false,
  currentPhraseNum,
  totalPhrases,
  isMuted,
  onToggleMute,
  onOpenHistory,
  onOpenJsonManager,
  onRestartCurrent,
  showInGameControls = false,
}) => {
  const timerPercentage = totalTime > 0 && timeRemaining !== undefined
    ? Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100))
    : 100;

  const isTimerLow = timeRemaining !== undefined && timeRemaining <= 10;

  return (
    <header id="educaplay-navbar" className="w-full bg-white border-b border-[#EBE7DF] select-none shadow-xs">
      {/* Main Top Banner */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Topic Title & Game Badge */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C8984]">
              Temática del Juego
            </span>
            {showInGameControls && currentPhraseNum && totalPhrases && (
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#A3B18A] bg-[#FAF9F6] px-2 py-0.5 rounded-full border border-[#EBE7DF]">
                Frase {currentPhraseNum} de {totalPhrases}
              </span>
            )}
          </div>
          <h1 className="text-lg sm:text-2xl font-serif italic text-[#5A5A40] truncate leading-tight font-serif-natural">
            {topicTitle || 'Ordenar Palabras'}
          </h1>
        </div>

        {/* Right: Stats and Actions */}
        <div className="flex items-center gap-3 sm:gap-6 ml-auto">
          {/* Points Display */}
          <div className="flex flex-col items-center sm:items-end">
            <span className="text-[10px] uppercase tracking-widest text-[#8C8984] font-semibold">
              Puntuación
            </span>
            <span id="score-badge" className="text-lg sm:text-2xl font-bold text-[#5A5A40] leading-tight">
              {score.toLocaleString()} <span className="text-xs font-normal text-[#8C8984]">pts</span>
            </span>
          </div>

          {/* In-game Timer Display */}
          {showInGameControls && timeRemaining !== undefined && (
            <div
              id="timer-badge"
              className={`flex flex-col items-center px-4 sm:px-5 py-1 sm:py-1.5 rounded-2xl transition-all duration-300 ${
                isTimerLow
                  ? 'bg-[#E07A5F] text-white animate-pulse shadow-sm'
                  : 'bg-[#5A5A40] text-white shadow-xs'
              }`}
            >
              <span className="text-[9px] sm:text-[10px] uppercase tracking-widest opacity-80 leading-none">
                Tiempo
              </span>
              <span className="text-base sm:text-xl font-mono font-bold leading-tight flex items-center gap-1">
                {timeRemaining}s
              </span>
            </div>
          )}

          {/* Utility Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#EBE7DF]">
            {showInGameControls && onRestartCurrent && (
              <button
                id="btn-restart-phrase"
                onClick={onRestartCurrent}
                title="Reiniciar esta frase"
                className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              title="Consultar frases completadas"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#8C8984]" />
              <span className="hidden sm:inline">Historial</span>
            </button>

            {onOpenJsonManager && (
              <button
                id="btn-open-json"
                onClick={onOpenJsonManager}
                title="Ver/Editar JSON de frases (Modo Profesor)"
                className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] active:scale-95 transition-all cursor-pointer"
              >
                <Code className="w-4 h-4 text-[#8C8984]" />
              </button>
            )}

            <button
              id="btn-toggle-sound"
              onClick={onToggleMute}
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="p-2 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] active:scale-95 transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#E07A5F]" /> : <Volume2 className="w-4 h-4 text-[#8C8984]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Line for Timer */}
      {showInGameControls && timeRemaining !== undefined && (
        <div className="w-full h-1.5 bg-[#EBE7DF] overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isTimerLow ? 'bg-[#E07A5F]' : 'bg-[#A3B18A]'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}
    </header>
  );
};
