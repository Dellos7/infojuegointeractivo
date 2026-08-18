import React from 'react';
import {
  History,
  Code,
  Sparkles,
  RefreshCw,
  Trophy,
  Clock,
  Cpu,
  Zap,
} from 'lucide-react';

interface NavbarProps {
  topicTitle: string;
  score: number;
  timeRemaining?: number;
  totalTime?: number;
  isTimerRunning?: boolean;
  currentPhraseNum?: number;
  totalPhrases?: number;
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
    <header id="tech-navbar" className="w-full bg-[#0F172A]/90 backdrop-blur-md border-b border-[#1E293B] select-none sticky top-0 z-40 shadow-lg">
      {/* Top HUD scanline */}
      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#3B82F6] to-transparent opacity-80" />

      {/* Main Bar */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Mission / Topic Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center text-[#38BDF8] shadow-inner">
            <Cpu className="w-5 h-5" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-[0.2em] text-[#38BDF8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
                MISIÓN ACTIVA
              </span>
              {showInGameControls && currentPhraseNum && totalPhrases && (
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[#10B981] bg-[#064E3B]/60 px-2 py-0.5 rounded-md border border-[#059669]/40">
                  FASE {currentPhraseNum}/{totalPhrases}
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-xl font-tech font-bold text-white tracking-wide truncate leading-tight flex items-center gap-2">
              {topicTitle || 'Decodificador de Frases'}
            </h1>
          </div>
        </div>

        {/* Right: Stats & HUD Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4 ml-auto">
          {/* XP / Points Display */}
          <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-[#1E293B]/80 border border-[#334155] glow-blue">
            <div className="w-7 h-7 rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA]">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-widest text-[#94A3B8] font-bold leading-none">
                PUNTOS XP
              </span>
              <span id="score-badge" className="text-base sm:text-xl font-mono font-bold text-white leading-tight">
                {score.toLocaleString()}
              </span>
            </div>
          </div>

          {/* In-game Timer Display */}
          {showInGameControls && timeRemaining !== undefined && (
            <div
              id="timer-badge"
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl border transition-all duration-300 ${
                isTimerLow
                  ? 'bg-[#7F1D1D]/90 border-[#EF4444] text-[#FCA5A5] glow-red animate-pulse'
                  : 'bg-[#1E293B] border-[#0284C7]/40 text-[#38BDF8] glow-cyan'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimerLow ? 'text-[#EF4444] animate-spin' : 'text-[#38BDF8]'}`} />
              <div className="flex flex-col items-start">
                <span className="text-[9px] uppercase tracking-widest opacity-80 leading-none">
                  CRONÓMETRO
                </span>
                <span className="text-base sm:text-xl font-mono font-bold leading-tight">
                  {timeRemaining}s
                </span>
              </div>
            </div>
          )}

          {/* Utility Action Buttons */}
          <div className="flex items-center gap-1.5 pl-1 sm:pl-2 border-l border-[#1E293B]">
            {showInGameControls && onRestartCurrent && (
              <button
                id="btn-restart-phrase"
                onClick={onRestartCurrent}
                title="Reiniciar esta frase"
                className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white border border-[#334155] active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              title="Registro de misiones completadas"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white border border-[#334155] active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="hidden sm:inline">Registro</span>
            </button>

            {onOpenJsonManager && (
              <button
                id="btn-open-json"
                onClick={onOpenJsonManager}
                title="Configuración de matrices JSON (Modo Administrador)"
                className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#F59E0B] border border-[#F59E0B]/30 active:scale-95 transition-all cursor-pointer glow-amber"
              >
                <Code className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cyber In-Game Timer Bar */}
      {showInGameControls && timeRemaining !== undefined && (
        <div className="w-full h-1 bg-[#090D16] overflow-hidden relative">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              isTimerLow
                ? 'bg-gradient-to-r from-[#EF4444] via-[#F87171] to-[#EF4444] glow-red'
                : 'bg-gradient-to-r from-[#06B6D4] via-[#3B82F6] to-[#10B981] glow-cyan'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}
    </header>
  );
};
