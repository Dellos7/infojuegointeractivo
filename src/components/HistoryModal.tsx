import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, Award, AlertCircle, Trash2, BookOpen, Layers, Cpu, Zap, ShieldCheck } from 'lucide-react';
import { CompletedPhraseRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedRecords: CompletedPhraseRecord[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  completedRecords,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#0F172A] rounded-[24px] shadow-2xl border border-[#1E293B] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden glow-blue"
        >
          {/* Header */}
          <div className="bg-[#0B0F19] text-[#E2E8F0] px-6 py-4 flex items-center justify-between border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="bg-[#1E293B] p-2.5 rounded-xl border border-[#334155] text-[#38BDF8] shadow-inner">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-tech font-bold text-lg text-white uppercase tracking-wider">
                  Registro de Misiones Completadas
                </h3>
                <p className="text-xs font-mono text-[#94A3B8]">
                  Historial de decodificación almacenado en memoria local
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] active:scale-95 transition-all text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#0B0F19]/90">
            {completedRecords.length === 0 ? (
              <div className="text-center py-12 text-[#64748B]">
                <Layers className="w-12 h-12 text-[#334155] mx-auto mb-3" />
                <p className="font-tech font-bold text-white text-base">NO HAY REGISTROS REGISTRADOS</p>
                <p className="text-xs font-mono text-[#94A3B8] mt-1 max-w-md mx-auto">
                  Las oraciones que resuelvas correctamente se registrarán automáticamente en esta bitácora.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedRecords.map((item, index) => (
                  <div
                    key={`${item.phraseId}-${index}`}
                    className="p-4 rounded-xl border border-[#1E293B] bg-[#0F172A] hover:border-[#38BDF8]/50 transition-all space-y-2.5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 w-6 h-6 rounded-md bg-[#1E293B] border border-[#38BDF8]/40 text-[#38BDF8] font-mono font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-tech font-bold text-white text-sm truncate">
                          {item.clue}
                        </h4>
                      </div>
                      <span className="shrink-0 text-xs font-mono font-bold text-[#10B981] bg-[#064E3B]/60 px-2.5 py-1 rounded-md border border-[#059669]/40">
                        +{item.scoreEarned} XP
                      </span>
                    </div>

                    {/* Sentence Result */}
                    <div className="p-3 rounded-lg bg-[#1E293B] border border-[#334155] text-xs sm:text-sm font-mono text-[#E2E8F0] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>{item.fullSentence}</span>
                    </div>

                    {/* Meta stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#94A3B8] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#38BDF8]" /> {item.timeSpent}s empleados
                      </span>
                      {item.mistakes > 0 ? (
                        <span className="flex items-center gap-1 text-[#EF4444]">
                          <AlertCircle className="w-3.5 h-3.5" /> {item.mistakes} fallos
                        </span>
                      ) : (
                        <span className="text-[#10B981] font-semibold">¡100% Precisión!</span>
                      )}
                      <span className="text-[#64748B] ml-auto">{item.completedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#0B0F19] border-t border-[#1E293B] flex items-center justify-between">
            {completedRecords.length > 0 ? (
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas purgar la bitácora de misiones?')) {
                    onClearHistory();
                  }
                }}
                className="flex items-center gap-1.5 text-xs font-mono text-[#EF4444] hover:underline font-bold uppercase tracking-wider cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar Bitácora</span>
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-tech font-bold text-xs uppercase tracking-wider transition-all cursor-pointer glow-blue"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
