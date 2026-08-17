import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, Clock, Award, AlertCircle, Trash2, BookOpen, Layers } from 'lucide-react';
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
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#43423E]/50 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-[32px] shadow-lg border border-[#EBE7DF] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#F2F0EB] text-[#43423E] px-6 py-4.5 flex items-center justify-between border-b border-[#EBE7DF]">
            <div className="flex items-center gap-2.5">
              <div className="bg-white p-2 rounded-xl border border-[#EBE7DF] text-[#5A5A40]">
                <BookOpen className="w-4 h-4 text-[#A3B18A]" />
              </div>
              <div>
                <h3 className="font-serif italic text-lg font-bold text-[#5A5A40] font-serif-natural">Frases Completadas</h3>
                <p className="text-xs text-[#8C8984]">Historial y progreso guardado en el navegador</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EBE7DF] active:scale-95 transition-all text-[#8C8984] hover:text-[#43423E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-4">
            {completedRecords.length === 0 ? (
              <div className="text-center py-12 text-[#8C8984]">
                <Layers className="w-12 h-12 text-[#D4D2CD] mx-auto mb-3" />
                <p className="font-bold text-[#5A5A40]">Aún no has completado ninguna frase</p>
                <p className="text-sm text-[#8C8984] mt-1">
                  Las oraciones que resuelvas correctamente aparecerán aquí para tu consulta en cualquier momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedRecords.map((item, index) => (
                  <div
                    key={`${item.phraseId}-${index}`}
                    className="p-4 rounded-2xl border border-[#EBE7DF] bg-[#FAF9F6] hover:bg-white hover:border-[#A3B18A] transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-[#5A5A40] text-white font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-[#5A5A40] text-sm truncate">
                          {item.clue}
                        </h4>
                      </div>
                      <span className="shrink-0 text-xs font-bold text-[#5A5A40] bg-white px-2.5 py-1 rounded-lg border border-[#EBE7DF]">
                        +{item.scoreEarned} pts
                      </span>
                    </div>

                    {/* Sentence Result */}
                    <div className="p-3 rounded-xl bg-white border border-[#EBE7DF] text-sm font-medium text-[#43423E] flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#A3B18A] shrink-0 mt-0.5" />
                      <span>{item.fullSentence}</span>
                    </div>

                    {/* Meta stats */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#8C8984] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#8C8984]" /> {item.timeSpent}s empleados
                      </span>
                      {item.mistakes > 0 ? (
                        <span className="flex items-center gap-1 text-[#E07A5F]">
                          <AlertCircle className="w-3.5 h-3.5" /> {item.mistakes} errores
                        </span>
                      ) : (
                        <span className="text-[#A3B18A] font-semibold">¡Sin errores!</span>
                      )}
                      <span className="text-[#8C8984] ml-auto">{item.completedAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#EBE7DF] flex items-center justify-between">
            {completedRecords.length > 0 ? (
              <button
                onClick={() => {
                  if (window.confirm('¿Seguro que deseas borrar el historial guardado?')) {
                    onClearHistory();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-[#E07A5F] hover:underline font-bold uppercase tracking-wider cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar historial</span>
              </button>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-[#5A5A40] hover:bg-[#474732] text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
