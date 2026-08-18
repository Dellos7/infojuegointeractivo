import React, { useState } from 'react';
import {
  KeyRound,
  ArrowRight,
  Terminal,
  AlertCircle,
  User,
  Sparkles,
  Gamepad2,
  Cpu,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { TopicItem, GameProgress } from '../types';

interface WelcomeScreenProps {
  topics: TopicItem[];
  selectedTopic: TopicItem;
  onSelectTopicAndStart: (topic: TopicItem, playerName: string) => void;
  savedProgress: GameProgress | null;
  onOpenHistory: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  topics,
  selectedTopic,
  onSelectTopicAndStart,
  savedProgress,
  onOpenHistory,
}) => {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('educaplay_player_name') || savedProgress?.playerName || '';
  });
  const [inputCode, setInputCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim();
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanName) {
      setErrorMsg('Identificación requerida: Introduce tu nombre de jugador/a antes de iniciar.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!cleanCode) {
      setErrorMsg('Protocolo incompleto: Introduce la clave de acceso de la misión.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Find topic matching accessCode or ID
    const matched = topics.find((t) => {
      const code = (t.accessCode || t.id).trim().toUpperCase();
      return (
        code === cleanCode ||
        t.id.toUpperCase() === cleanCode ||
        t.id.replace(/-/g, '').toUpperCase() === cleanCode
      );
    });

    if (matched) {
      setErrorMsg(null);
      localStorage.setItem('educaplay_player_name', cleanName);
      onSelectTopicAndStart(matched, cleanName);
    } else {
      setErrorMsg(
        'Clave de acceso no reconocida. Verifica el código facilitado por tu profesor/a e inténtalo de nuevo.'
      );
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div
      id="welcome-screen"
      className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-xl mx-auto w-full select-none"
    >
      {/* Gaming Tech Terminal Card */}
      <div className="w-full hud-card rounded-[28px] overflow-hidden shadow-2xl glow-blue">
        {/* Terminal Header */}
        <div className="bg-[#0F172A] p-6 md:p-8 text-center border-b border-[#1E293B] relative">
          {/* Top Status Lights */}
          <div className="flex items-center justify-between mb-4 text-[10px] font-mono uppercase tracking-widest text-[#64748B]">
            <span className="flex items-center gap-1.5 text-[#10B981]">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              SISTEMA LISTO
            </span>
            <span className="text-[#38BDF8]">TERMINAL v4.2</span>
          </div>

          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1E293B] border border-[#3B82F6]/40 text-[#38BDF8] shadow-inner mb-3 glow-cyan">
            <Gamepad2 className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-tech font-bold text-white tracking-wide uppercase">
            Portal de Misión
          </h1>
          <p className="mt-2 text-xs md:text-sm text-[#94A3B8] max-w-md mx-auto font-normal leading-relaxed">
            Ingresa tu identificación y la clave de acceso para iniciar el decodificador de oraciones.
          </p>
        </div>

        {/* Access Form */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5 bg-[#0B0F19]/90">
          {/* 1. Player Name Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="student-name-input"
              className="text-[11px] uppercase tracking-[0.15em] font-tech font-bold text-[#38BDF8] flex items-center gap-1.5"
            >
              <User className="w-3.5 h-3.5 text-[#38BDF8]" />
              Identificación del Jugador / Alumno
            </label>
            <div className="relative">
              <input
                id="student-name-input"
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ej: Laura García Morales"
                autoFocus
                className="w-full text-base sm:text-lg font-medium px-4 py-3.5 rounded-xl bg-[#1E293B]/70 border-2 border-[#334155] text-white focus:outline-hidden focus:border-[#3B82F6] focus:bg-[#1E293B] transition-all placeholder:text-[#64748B] focus:glow-blue"
              />
            </div>
          </div>

          {/* 2. Access Code Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="activity-code-input"
              className="text-[11px] uppercase tracking-[0.15em] font-tech font-bold text-[#10B981] flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#10B981]" />
              Clave de Acceso a la Actividad
            </label>
            <div className={`relative ${isShaking ? 'animate-shake' : ''}`}>
              <input
                id="activity-code-input"
                type="text"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder=""
                className="w-full text-center text-xl sm:text-2xl font-mono font-bold uppercase tracking-widest px-4 py-3.5 rounded-xl bg-[#1E293B]/70 border-2 border-[#334155] text-[#38BDF8] focus:outline-hidden focus:border-[#10B981] focus:bg-[#1E293B] transition-all focus:glow-cyan"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-[#7F1D1D]/50 border border-[#EF4444] rounded-xl text-[#FCA5A5] text-xs font-semibold flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Launch Button */}
          <button
            type="submit"
            id="btn-submit-code"
            className="w-full py-4 bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#06B6D4] hover:from-[#1D4ED8] hover:to-[#0891B2] active:scale-98 text-white font-tech font-bold text-base tracking-widest uppercase rounded-xl shadow-lg glow-blue transition-all flex items-center justify-center gap-3 cursor-pointer mt-2"
          >
            <Zap className="w-5 h-5 fill-current" />
            <span>INICIAR MISIÓN</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {/* Terminal Footer */}
        <div className="px-6 py-4 bg-[#0F172A] border-t border-[#1E293B] flex items-center justify-between text-xs text-[#94A3B8]">
          <span className="flex items-center gap-1 font-mono text-[11px] text-[#64748B]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" /> MODO PROTEGIDO
          </span>
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-[#38BDF8] hover:text-white font-tech font-bold uppercase tracking-wider underline underline-offset-4 flex items-center gap-1 cursor-pointer transition-colors"
          >
            Ver Registro de Misiones
          </button>
        </div>
      </div>
    </div>
  );
};
