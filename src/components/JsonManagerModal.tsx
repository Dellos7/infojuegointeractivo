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
  Cpu,
  Zap,
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

  const handleSwitchTab = (newMode: EditorMode) => {
    if (newMode === 'json') {
      setJsonText(JSON.stringify(datasetDraft, null, 2));
      setErrorMsg(null);
      setMode('json');
    } else {
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
          setErrorMsg(`Corrige los errores de sintaxis del JSON antes de cambiar: ${err.message}`);
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
      setSuccessMsg('¡Configuración guardada y aplicada con éxito!');
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
    a.download = 'frases_juego_educativo.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0F172A] rounded-[24px] shadow-2xl border border-[#1E293B] w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden glow-blue"
        >
          {/* Header */}
          <div className="bg-[#0B0F19] text-[#E2E8F0] px-6 py-4 flex flex-wrap items-center justify-between border-b border-[#1E293B] gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-[#1E293B] p-2.5 rounded-xl border border-[#334155] text-[#38BDF8]">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-tech font-bold text-lg sm:text-xl text-white uppercase tracking-wider">
                  Configurador de Misiones y Matrices JSON
                </h3>
                <p className="text-xs font-mono text-[#94A3B8]">
                  Modo Administrador - Gestión de temáticas, códigos y oraciones
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-[#1E293B] p-1 rounded-xl border border-[#334155]">
              <button
                type="button"
                onClick={() => handleSwitchTab('simple')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'simple'
                    ? 'bg-[#3B82F6] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Formulario Visual</span>
              </button>
              <button
                type="button"
                onClick={() => handleSwitchTab('json')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mode === 'json'
                    ? 'bg-[#3B82F6] text-white shadow-md'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Código JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              title="Cerrar"
              className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] active:scale-95 transition-all text-[#94A3B8] hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#0B0F19]/90 text-[#E2E8F0]">
            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-[#0F172A] p-3 rounded-xl border border-[#1E293B]">
              <span className="flex items-center gap-1.5 font-bold text-[#38BDF8]">
                <FileText className="w-4 h-4 text-[#38BDF8]" />
                {mode === 'simple'
                  ? 'Editor visual sincronizado automáticamente con la estructura JSON.'
                  : 'Modifica directamente el árbol JSON de las actividades.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] font-mono text-xs uppercase cursor-pointer transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-white border border-[#334155] font-mono text-xs uppercase cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar .json</span>
                </button>
              </div>
            </div>

            {/* Error / Success Notifications */}
            {errorMsg && (
              <div className="p-3 bg-[#7F1D1D]/70 border border-[#EF4444] rounded-xl text-[#FCA5A5] text-xs font-mono flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#EF4444]" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-[#064E3B]/70 border border-[#10B981] rounded-xl text-[#A7F3D0] text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* MODE 1: VISUAL SIMPLE EDITOR */}
            {mode === 'simple' && (
              <div className="space-y-6">
                {/* Topic Selector Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                      1. Selecciona o Añade una Actividad:
                    </label>
                    <button
                      type="button"
                      onClick={handleCreateTopic}
                      className="flex items-center gap-1 text-xs font-mono font-bold text-[#10B981] hover:text-[#34D399] cursor-pointer"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span>+ Crear Nueva Actividad</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {datasetDraft.topics.map((t, idx) => (
                      <button
                        key={t.id || `top-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedTopicIndex(idx);
                          setErrorMsg(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                          selectedTopicIndex === idx
                            ? 'bg-[#3B82F6] border-[#60A5FA] text-white shadow-md glow-blue'
                            : 'bg-[#0F172A] border-[#1E293B] text-[#94A3B8] hover:text-white hover:border-[#334155]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span>{t.title || `Actividad ${idx + 1}`}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded border border-white/10 opacity-80">
                          {t.accessCode || t.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Topic Details Card */}
                {currentTopic && (
                  <div className="p-4 sm:p-5 bg-[#0F172A] rounded-2xl border border-[#1E293B] space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E293B] pb-3">
                      <h4 className="font-tech font-bold text-white text-base uppercase flex items-center gap-2">
                        <Edit2 className="w-4 h-4 text-[#38BDF8]" />
                        Editando Actividad: {currentTopic.title}
                      </h4>
                      {datasetDraft.topics.length > 1 && (
                        <button
                          type="button"
                          onClick={handleDeleteCurrentTopic}
                          className="flex items-center gap-1 text-xs font-mono text-[#EF4444] hover:text-[#F87171] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar esta actividad</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#94A3B8] uppercase">
                          Título de la Actividad:
                        </label>
                        <input
                          type="text"
                          value={currentTopic.title}
                          onChange={(e) => updateCurrentTopic({ title: e.target.value })}
                          className="w-full text-sm font-medium px-3.5 py-2.5 rounded-xl bg-[#1E293B] border border-[#334155] text-white focus:outline-hidden focus:border-[#3B82F6]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-mono text-[#10B981] uppercase flex items-center gap-1">
                          <KeyRound className="w-3 h-3 text-[#10B981]" />
                          Clave de Acceso para el Alumno (Código):
                        </label>
                        <input
                          type="text"
                          value={currentTopic.accessCode || ''}
                          onChange={(e) => updateCurrentTopic({ accessCode: e.target.value.toUpperCase() })}
                          placeholder="EJ: SO101"
                          className="w-full text-sm font-mono font-bold uppercase tracking-wider px-3.5 py-2.5 rounded-xl bg-[#1E293B] border border-[#10B981]/50 text-[#38BDF8] focus:outline-hidden focus:border-[#10B981]"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-mono text-[#94A3B8] uppercase">
                          Descripción o Instrucciones:
                        </label>
                        <input
                          type="text"
                          value={currentTopic.description || ''}
                          onChange={(e) => updateCurrentTopic({ description: e.target.value })}
                          className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-[#1E293B] border border-[#334155] text-white focus:outline-hidden focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Phrases Section */}
                {currentTopic && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold uppercase tracking-wider text-[#38BDF8]">
                        2. Lista de Frases de la Actividad ({currentTopic.phrases?.length || 0}):
                      </label>
                      <button
                        type="button"
                        onClick={handleAddPhrase}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-[#334155] text-xs font-mono font-bold text-[#10B981] cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir Frase</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {currentTopic.phrases?.map((phrase, pIdx) => {
                        const wordTokens = tokenizeSentence(phrase.fullSentence || '');
                        return (
                          <div
                            key={phrase.id || `p-${pIdx}`}
                            className="p-4 rounded-xl border border-[#1E293B] bg-[#0F172A] space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-[#38BDF8] flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[10px]">
                                  {pIdx + 1}
                                </span>
                                Frase #{pIdx + 1}
                              </span>

                              {currentTopic.phrases.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhrase(pIdx)}
                                  className="text-xs font-mono text-[#EF4444] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar frase</span>
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[10px] font-mono uppercase text-[#94A3B8]">
                                  Enunciado / Pregunta:
                                </label>
                                <input
                                  type="text"
                                  value={phrase.clue}
                                  onChange={(e) =>
                                    handleUpdatePhrase(pIdx, { clue: e.target.value })
                                  }
                                  className="w-full text-xs sm:text-sm px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-hidden focus:border-[#3B82F6]"
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-mono uppercase text-[#94A3B8] flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#38BDF8]" />
                                  Tiempo (segundos):
                                </label>
                                <input
                                  type="number"
                                  min={10}
                                  max={300}
                                  value={phrase.estimatedTime || 45}
                                  onChange={(e) =>
                                    handleUpdatePhrase(pIdx, {
                                      estimatedTime: parseInt(e.target.value, 10) || 45,
                                    })
                                  }
                                  className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-white focus:outline-hidden focus:border-[#3B82F6]"
                                />
                              </div>

                              <div className="sm:col-span-3 space-y-1">
                                <label className="text-[10px] font-mono uppercase text-[#10B981]">
                                  Oración completa ordenada (las palabras que el alumno deberá ordenar):
                                </label>
                                <input
                                  type="text"
                                  value={phrase.fullSentence}
                                  onChange={(e) =>
                                    handleUpdatePhrase(pIdx, { fullSentence: e.target.value })
                                  }
                                  className="w-full text-xs sm:text-sm font-mono px-3 py-2 rounded-lg bg-[#1E293B] border border-[#334155] text-[#38BDF8] focus:outline-hidden focus:border-[#10B981]"
                                />
                              </div>
                            </div>

                            {/* Preview chips */}
                            <div className="pt-1">
                              <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
                                Vista previa de fichas generadas ({wordTokens.length}):
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {wordTokens.map((token, wIdx) => (
                                  <span
                                    key={`tok-${pIdx}-${wIdx}`}
                                    className="px-2 py-0.5 rounded bg-[#1E293B] border border-[#334155] text-[11px] font-mono text-[#E2E8F0]"
                                  >
                                    {token}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODE 2: DIRECT JSON CODE EDITOR */}
            {mode === 'json' && (
              <div className="space-y-2">
                <textarea
                  id="json-textarea-editor"
                  value={jsonText}
                  onChange={(e) => {
                    setJsonText(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  rows={18}
                  className="w-full p-4 font-mono text-xs sm:text-sm bg-[#0A0E17] border border-[#1E293B] rounded-2xl text-[#38BDF8] focus:outline-hidden focus:border-[#3B82F6] leading-relaxed shadow-inner"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-[#0B0F19] border-t border-[#1E293B] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    '¿Deseas restaurar todas las temáticas y frases al contenido por defecto?'
                  )
                ) {
                  onResetToDefault();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8] hover:text-white uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Restaurar Valores por Defecto</span>
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-[#94A3B8] hover:text-white font-mono text-xs uppercase tracking-wider cursor-pointer transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                id="btn-save-json-modal"
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] hover:from-[#1D4ED8] hover:to-[#2563EB] text-white font-tech font-bold text-xs uppercase tracking-widest cursor-pointer transition-all shadow-md glow-blue flex items-center gap-2"
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
