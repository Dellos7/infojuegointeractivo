import React, { useState } from 'react';
import {
  KeyRound,
  ArrowRight,
  Layers,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { TopicItem, GameProgress } from '../types';

interface WelcomeScreenProps {
  topics: TopicItem[];
  selectedTopic: TopicItem;
  onSelectTopicAndStart: (topic: TopicItem) => void;
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
  const [inputCode, setInputCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();

    if (!cleanCode) {
      setErrorMsg('Por favor, escribe el código de la actividad.');
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
      onSelectTopicAndStart(matched);
    } else {
      setErrorMsg(
        'Código no válido. Por favor, revisa el código facilitado por tu profesor/a e inténtalo de nuevo.'
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
      {/* Main Access Code Card */}
      <div className="w-full bg-white rounded-[32px] shadow-sm border border-[#EBE7DF] overflow-hidden">
        {/* Header */}
        <div className="bg-[#F2F0EB] text-[#43423E] p-8 text-center border-b border-[#EBE7DF]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-[#EBE7DF] text-[#5A5A40] shadow-2xs mx-auto mb-3">
            <KeyRound className="w-7 h-7 text-[#A3B18A]" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#EBE7DF] text-[10px] font-bold text-[#5A5A40] uppercase tracking-[0.15em] mb-2 shadow-2xs">
            <Layers className="w-3 h-3 text-[#A3B18A]" /> Actividad Interactiva
          </span>
          <h1 className="text-2xl md:text-3xl font-serif italic text-[#5A5A40] tracking-tight font-serif-natural">
            Introduce el código del juego
          </h1>
          <p className="mt-2 text-xs md:text-sm text-[#8C8984] max-w-md mx-auto font-normal leading-relaxed">
            Ingresa el código proporcionado por tu profesor/a para comenzar a ordenar las oraciones.
          </p>
        </div>

        {/* Code Input Form */}
        <form onSubmit={handleSubmitCode} className="p-6 md:p-8 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="activity-code-input"
              className="text-[11px] uppercase tracking-[0.15em] font-bold text-[#5A5A40] block"
            >
              Código de la actividad
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
                placeholder="Escribe el código aquí..."
                autoFocus
                className="w-full text-center text-xl sm:text-2xl font-mono uppercase tracking-widest px-4 py-4 rounded-2xl bg-[#FAF9F6] border-2 border-[#E5E0D5] text-[#43423E] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all shadow-2xs"
              />
            </div>
            {errorMsg && (
              <div className="p-3 bg-[#FAF9F6] border border-[#E07A5F] rounded-xl text-[#E07A5F] text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            id="btn-submit-code"
            className="w-full py-4 bg-[#5A5A40] hover:bg-[#474732] active:scale-98 text-white font-bold text-sm tracking-wider uppercase rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>Entrar a la actividad</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer info & Links */}
        <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#EBE7DF] flex items-center justify-center text-xs text-[#8C8984]">
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-[#5A5A40] hover:text-[#43423E] font-bold uppercase tracking-wider underline underline-offset-4 flex items-center gap-1 cursor-pointer"
          >
            Consultar historial de frases resueltas
          </button>
        </div>
      </div>
    </div>
  );
};
