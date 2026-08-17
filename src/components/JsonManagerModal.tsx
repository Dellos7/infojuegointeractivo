import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Code,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Download,
  FileText,
  SlidersHorizontal,
  Plus,
  Trash2,
  KeyRound,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  FolderPlus,
  Edit2,
} from 'lucide-react';
import { PhrasesDataset, TopicItem, PhraseItem } from '../types';
import { tokenizeSentence } from '../utils/storage';

interface JsonManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDataset: PhrasesDataset;
  onSaveDataset: (newDataset: PhrasesDataset) => void;
  onResetToDefault: () => void;
}

type EditorMode = 'simple' | 'json';

export const JsonManagerModal: React.FC<JsonManagerModalProps> = ({
  isOpen,
  onClose,
  currentDataset,
  onSaveDataset,
  onResetToDefault,
}) => {
  const [mode, setMode] = useState<EditorMode>('simple');
  const [datasetDraft, setDatasetDraft] = useState<PhrasesDataset>(() =>
    JSON.parse(JSON.stringify(currentDataset))
  );
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number>(0);
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(currentDataset, null, 2)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Sync state whenever modal opens or dataset changes externally
  useEffect(() => {
    if (isOpen) {
      const cloned = JSON.parse(JSON.stringify(currentDataset));
      setDatasetDraft(cloned);
      setSelectedTopicIndex(0);
      setJsonText(JSON.stringify(currentDataset, null, 2));
      setErrorMsg(null);
      setSuccessMsg(null);
      setCopied(false);
    }
  }, [isOpen, currentDataset]);

  if (!isOpen) return null;

  // Handle switching tabs
  const handleSwitchTab = (newMode: EditorMode) => {
    if (newMode === 'json') {
      // Convert current draft into formatted JSON string
      setJsonText(JSON.stringify(datasetDraft, null, 2));
      setErrorMsg(null);
      setMode('json');
    } else {
      // Parse JSON string back into draft
      try {
        const parsed = JSON.parse(jsonText);
        validateDatasetStructure(parsed);
        setDatasetDraft(parsed);
        if (selectedTopicIndex >= parsed.topics.length) {
          setSelectedTopicIndex(0);
        }
        setErrorMsg(null);
        setMode('simple');
      } catch (err: unknown) {
        if (err instanceof Error) {
          setErrorMsg(`Corrige los errores del JSON antes de pasar al editor visual: ${err.message}`);
        } else {
          setErrorMsg('Error de sintaxis en el JSON.');
        }
      }
    }
  };

  const validateDatasetStructure = (dataset: any): void => {
    if (!dataset || !Array.isArray(dataset.topics) || dataset.topics.length === 0) {
      throw new Error('El dataset debe incluir un array "topics" con al menos un tema.');
    }
    for (let i = 0; i < dataset.topics.length; i++) {
      const topic = dataset.topics[i];
      if (!topic.id || !topic.title) {
        throw new Error(`El tema #${i + 1} debe tener "id" y "title".`);
      }
      if (!topic.accessCode) {
        throw new Error(`El tema "${topic.title}" debe tener un "accessCode" asignado.`);
      }
      if (!Array.isArray(topic.phrases) || topic.phrases.length === 0) {
        throw new Error(`El tema "${topic.title}" debe tener al menos una frase configurada.`);
      }
      for (let j = 0; j < topic.phrases.length; j++) {
        const p = topic.phrases[j];
        if (!p.id || !p.clue?.trim() || !p.fullSentence?.trim() || typeof p.estimatedTime !== 'number') {
          throw new Error(`En el tema "${topic.title}", la frase #${j + 1} debe tener pregunta (clue), frase (fullSentence) y tiempo estimado en segundos.`);
        }
      }
    }
  };

  // Save current configuration
  const handleSave = () => {
    try {
      let finalData: PhrasesDataset;

      if (mode === 'json') {
        finalData = JSON.parse(jsonText);
        validateDatasetStructure(finalData);
      } else {
        finalData = datasetDraft;
        validateDatasetStructure(finalData);
      }

      onSaveDataset(finalData);
      setSuccessMsg('¡Configuración guardada y aplicada correctamente!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 700);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Error al guardar la configuración.');
      }
    }
  };

  // --- Visual Editor Helpers ---
  const currentTopic = datasetDraft.topics[selectedTopicIndex] || datasetDraft.topics[0];

  const updateCurrentTopic = (updatedFields: Partial<TopicItem>) => {
    setDatasetDraft((prev) => {
      const newTopics = [...prev.topics];
      newTopics[selectedTopicIndex] = {
        ...newTopics[selectedTopicIndex],
        ...updatedFields,
      };
      return { ...prev, topics: newTopics };
    });
    setErrorMsg(null);
  };

  const handleCreateTopic = () => {
    const newId = `tema-${Date.now()}`;
    const newTopic: TopicItem = {
      id: newId,
      accessCode: `CODIGO${datasetDraft.topics.length + 1}`,
      title: `Nueva Actividad ${datasetDraft.topics.length + 1}`,
      description: 'Descripción breve de la actividad para los estudiantes.',
      icon: 'BookOpen',
      phrases: [
        {
          id: `frase-${Date.now()}-1`,
          clue: '¿Cuál es la primera oración a ordenar?',
          fullSentence: 'Esta es la primera frase de ejemplo .',
          estimatedTime: 45,
        },
      ],
    };

    setDatasetDraft((prev) => ({
      ...prev,
      topics: [...prev.topics, newTopic],
    }));
    setSelectedTopicIndex(datasetDraft.topics.length);
    setErrorMsg(null);
  };

  const handleDeleteCurrentTopic = () => {
    if (datasetDraft.topics.length <= 1) {
      setErrorMsg('Debes mantener al menos una temática en el juego.');
      return;
    }

    if (
      window.confirm(
        `¿Seguro que deseas eliminar la temática "${currentTopic.title}" con todas sus frases?`
      )
    ) {
      setDatasetDraft((prev) => {
        const filtered = prev.topics.filter((_, idx) => idx !== selectedTopicIndex);
        return { ...prev, topics: filtered };
      });
      setSelectedTopicIndex(Math.max(0, selectedTopicIndex - 1));
      setErrorMsg(null);
    }
  };

  const handleAddPhrase = () => {
    const newPhrase: PhraseItem = {
      id: `frase-${Date.now()}-${(currentTopic.phrases?.length || 0) + 1}`,
      clue: '¿Pregunta o enunciado de la frase?',
      fullSentence: 'Escribe aquí la oración ordenada .',
      estimatedTime: 45,
    };

    updateCurrentTopic({
      phrases: [...(currentTopic.phrases || []), newPhrase],
    });
  };

  const handleUpdatePhrase = (
    phraseIndex: number,
    updatedFields: Partial<PhraseItem>
  ) => {
    const newPhrases = [...currentTopic.phrases];
    newPhrases[phraseIndex] = {
      ...newPhrases[phraseIndex],
      ...updatedFields,
    };
    updateCurrentTopic({ phrases: newPhrases });
  };

  const handleDeletePhrase = (phraseIndex: number) => {
    if (currentTopic.phrases.length <= 1) {
      setErrorMsg('Cada temática debe tener al menos una frase.');
      return;
    }
    const newPhrases = currentTopic.phrases.filter((_, idx) => idx !== phraseIndex);
    updateCurrentTopic({ phrases: newPhrases });
    setErrorMsg(null);
  };

  // --- Copy & Download ---
  const handleCopy = () => {
    const textToCopy =
      mode === 'json' ? jsonText : JSON.stringify(datasetDraft, null, 2);
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textToDownload =
      mode === 'json' ? jsonText : JSON.stringify(datasetDraft, null, 2);
    const blob = new Blob([textToDownload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'frases_juego_educaplay.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#43423E]/50 backdrop-blur-xs"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] shadow-xl border border-[#EBE7DF] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header with Title and Mode Switcher Tabs */}
          <div className="bg-[#F2F0EB] text-[#43423E] px-6 py-4 flex flex-wrap items-center justify-between border-b border-[#EBE7DF] gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-[#EBE7DF] text-[#5A5A40] shadow-2xs">
                <SlidersHorizontal className="w-5 h-5 text-[#A3B18A]" />
              </div>
              <div>
                <h3 className="font-serif italic text-lg sm:text-xl font-bold text-[#5A5A40] font-serif-natural">
                  Configurador de Actividades y Frases
                </h3>
                <p className="text-xs text-[#8C8984]">
                  Gestiona los tópicos, códigos de acceso y oraciones ordenadas
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-[#EBE7DF] shadow-2xs">
              <button
                type="button"
                onClick={() => handleSwitchTab('simple')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'simple'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#8C8984] hover:text-[#43423E]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Modo Simple (Formulario)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab('json')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'json'
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#8C8984] hover:text-[#43423E]'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Modo JSON Directo</span>
              </button>
            </div>

            <button
              onClick={onClose}
              title="Cerrar ventana"
              className="p-2 rounded-xl bg-white hover:bg-[#FAF9F6] border border-[#EBE7DF] active:scale-95 transition-all text-[#8C8984] hover:text-[#43423E] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#FAF9F6]">
            {/* Quick Actions (Copy / Download) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8C8984] bg-white p-3 rounded-2xl border border-[#EBE7DF]">
              <span className="flex items-center gap-1.5 font-bold text-[#5A5A40]">
                <FileText className="w-4 h-4 text-[#A3B18A]" />
                {mode === 'simple'
                  ? 'Edita visualmente los temas y frases. Se sincronizará automáticamente con el JSON.'
                  : 'Modifica directamente el texto JSON con la estructura completa.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5 text-[#A3B18A]" />
                  <span>{copied ? '¡Copiado!' : 'Copiar JSON'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#A3B18A]" />
                  <span>Descargar archivo</span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-white border border-[#E07A5F] rounded-2xl text-[#E07A5F] text-xs font-semibold flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-3.5 bg-white border border-[#A3B18A] rounded-2xl text-[#5A5A40] text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#A3B18A]" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* --- TAB 1: SIMPLE MODE (FORM & VISUAL BUILDER) --- */}
            {mode === 'simple' && currentTopic && (
              <div className="space-y-6">
                {/* 1. Topic Selector and Creation Bar */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE7DF] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-[#A3B18A]" />
                      Seleccionar Tópico / Actividad:
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCreateTopic}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF9F6] hover:bg-[#F2F0EB] text-[#5A5A40] border border-[#E5E0D5] font-bold text-xs uppercase tracking-wider cursor-pointer transition-all"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-[#A3B18A]" />
                        <span>+ Nuevo Tópico</span>
                      </button>
                      {datasetDraft.topics.length > 1 && (
                        <button
                          type="button"
                          onClick={handleDeleteCurrentTopic}
                          title="Eliminar este tópico"
                          className="p-1.5 rounded-xl bg-white hover:bg-[#FAF9F6] text-[#E07A5F] border border-[#EBE7DF] cursor-pointer transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Topic Pill selector */}
                  <div className="flex flex-wrap gap-2">
                    {datasetDraft.topics.map((topic, idx) => {
                      const isSelected = idx === selectedTopicIndex;
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => {
                            setSelectedTopicIndex(idx);
                            setErrorMsg(null);
                          }}
                          className={`px-4 py-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-2.5 ${
                            isSelected
                              ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs'
                              : 'bg-[#FAF9F6] border-[#EBE7DF] text-[#43423E] hover:border-[#5A5A40]'
                          }`}
                        >
                          <span className="font-semibold text-xs truncate max-w-[200px]">
                            {topic.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-[#EBE7DF] text-[#5A5A40]'
                            }`}
                          >
                            {topic.accessCode || topic.id}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Topic Metadata Inputs */}
                  <div className="pt-3 border-t border-[#EBE7DF] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider block mb-1">
                        Título de la Actividad
                      </label>
                      <input
                        type="text"
                        value={currentTopic.title}
                        onChange={(e) => updateCurrentTopic({ title: e.target.value })}
                        placeholder="Ej: Sistemas operativos y aplicaciones"
                        className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5] text-[#43423E] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <KeyRound className="w-3.5 h-3.5 text-[#A3B18A]" />
                        Código de Acceso para el Alumno
                      </label>
                      <input
                        type="text"
                        value={currentTopic.accessCode || ''}
                        onChange={(e) =>
                          updateCurrentTopic({
                            accessCode: e.target.value.toUpperCase().replace(/\s+/g, ''),
                          })
                        }
                        placeholder="Ej: SO101, SISTEMAS26"
                        className="w-full text-xs font-mono font-bold uppercase px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5] text-[#5A5A40] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider block mb-1">
                        Descripción o Instrucción General
                      </label>
                      <input
                        type="text"
                        value={currentTopic.description || ''}
                        onChange={(e) => updateCurrentTopic({ description: e.target.value })}
                        placeholder="Breve descripción del contenido de las frases..."
                        className="w-full text-xs px-3 py-2 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5] text-[#43423E] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Phrases List for Current Topic */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#5A5A40] uppercase tracking-wider flex items-center gap-1.5">
                      <Edit2 className="w-4 h-4 text-[#A3B18A]" />
                      Frases configuradas en este tema ({currentTopic.phrases.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddPhrase}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#5A5A40] hover:bg-[#474732] active:scale-95 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Frase</span>
                    </button>
                  </div>

                  {/* List of Phrases */}
                  <div className="space-y-3">
                    {currentTopic.phrases.map((phrase, pIdx) => {
                      const tokens = tokenizeSentence(phrase.fullSentence || '');
                      return (
                        <div
                          key={phrase.id || `phrase-row-${pIdx}`}
                          className="bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE7DF] shadow-2xs space-y-3 hover:border-[#D4D2CD] transition-all"
                        >
                          {/* Phrase Row Header */}
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF9F6] border border-[#EBE7DF] text-[11px] font-bold text-[#5A5A40]">
                              Frase #{pIdx + 1}
                            </span>
                            {currentTopic.phrases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleDeletePhrase(pIdx)}
                                title="Eliminar esta frase"
                                className="text-xs text-[#8C8984] hover:text-[#E07A5F] p-1 rounded-lg hover:bg-[#FAF9F6] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            )}
                          </div>

                          {/* Clue / Question Input */}
                          <div>
                            <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider block mb-1">
                              Enunciado / Pregunta / Pista (lo que leerá el alumno):
                            </label>
                            <input
                              type="text"
                              value={phrase.clue}
                              onChange={(e) =>
                                handleUpdatePhrase(pIdx, { clue: e.target.value })
                              }
                              placeholder="Ej: ¿Qué programa gestiona los recursos del hardware?"
                              className="w-full text-xs font-serif italic text-[#43423E] px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all font-serif-natural"
                            />
                          </div>

                          {/* Full Ordered Sentence Input */}
                          <div>
                            <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider block mb-1">
                              Oración completa ordenada (las palabras que deberá ordenar):
                            </label>
                            <input
                              type="text"
                              value={phrase.fullSentence}
                              onChange={(e) =>
                                handleUpdatePhrase(pIdx, { fullSentence: e.target.value })
                              }
                              placeholder="Ej: El sistema operativo administra la memoria del ordenador ."
                              className="w-full text-xs font-medium text-[#43423E] px-3 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#E5E0D5] focus:outline-hidden focus:border-[#5A5A40] focus:bg-white transition-all"
                            />
                            {/* Token Preview */}
                            {tokens.length > 0 && (
                              <div className="mt-2 flex flex-wrap items-center gap-1.5 pt-1">
                                <span className="text-[10px] uppercase font-bold text-[#8C8984] mr-1">
                                  Palabras ({tokens.length}):
                                </span>
                                {tokens.map((token, tIdx) => (
                                  <span
                                    key={`tok-${pIdx}-${tIdx}`}
                                    className="px-2 py-0.5 rounded-md bg-[#F2F0EB] text-[#5A5A40] text-[11px] font-medium border border-[#EBE7DF]"
                                  >
                                    {token}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Estimated Time in Seconds */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#FAF9F6]">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-[#A3B18A]" />
                              <label className="text-[11px] font-bold text-[#8C8984] uppercase tracking-wider">
                                Tiempo estimado (segundos):
                              </label>
                            </div>
                            <div className="flex items-center gap-2">
                              {[30, 45, 60, 90].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() =>
                                    handleUpdatePhrase(pIdx, { estimatedTime: preset })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                    phrase.estimatedTime === preset
                                      ? 'bg-[#5A5A40] text-white'
                                      : 'bg-[#FAF9F6] text-[#8C8984] hover:text-[#43423E] border border-[#EBE7DF]'
                                  }`}
                                >
                                  {preset}s
                                </button>
                              ))}
                              <input
                                type="number"
                                min={10}
                                max={300}
                                value={phrase.estimatedTime}
                                onChange={(e) =>
                                  handleUpdatePhrase(pIdx, {
                                    estimatedTime: Math.max(10, parseInt(e.target.value) || 45),
                                  })
                                }
                                className="w-16 text-center text-xs font-bold px-2 py-1 rounded-lg bg-[#FAF9F6] border border-[#E5E0D5] text-[#43423E]"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: RAW JSON CODE MODE --- */}
            {mode === 'json' && (
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    value={jsonText}
                    onChange={(e) => {
                      setJsonText(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    className="w-full h-96 font-mono text-xs p-4 bg-[#2D2C28] text-[#FAF9F6] rounded-2xl border border-[#43423E] focus:outline-hidden focus:ring-2 focus:ring-[#A3B18A] leading-relaxed resize-y"
                    spellCheck={false}
                  />
                </div>

                <div className="text-xs text-[#8C8984] bg-white p-4 rounded-2xl border border-[#EBE7DF]">
                  <p className="font-bold text-[#5A5A40] mb-1">
                    Estructura requerida por temática con código de acceso:
                  </p>
                  <code className="text-[#43423E] block whitespace-pre-wrap font-mono text-[11px]">{`{
  "topics": [
    {
      "id": "so-sistemas",
      "accessCode": "SO101",
      "title": "Sistemas operativos...",
      "description": "...",
      "phrases": [
        {
          "id": "1",
          "clue": "¿Pregunta o enunciado?",
          "fullSentence": "Oración completa ordenada .",
          "estimatedTime": 45
        }
      ]
    }
  ]
}`}</code>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[#FAF9F6] border-t border-[#EBE7DF] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    '¿Restablecer todas las frases y códigos al conjunto predeterminado inicial?'
                  )
                ) {
                  onResetToDefault();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-[#8C8984] hover:text-[#5A5A40] font-bold uppercase tracking-wider cursor-pointer transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restablecer predeterminados</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-[#8C8984] hover:text-[#43423E] font-bold text-xs uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#474732] active:scale-95 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Guardar y Aplicar Cambios</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
