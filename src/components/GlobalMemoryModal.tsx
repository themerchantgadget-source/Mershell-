import React, { useState } from 'react';
import { GlobalContextMemory, RemoteMachine } from '../types';
import {
  X,
  Brain,
  Shield,
  Layers,
  Sliders,
  FileText,
  Plus,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface GlobalMemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: GlobalContextMemory;
  machines: RemoteMachine[];
  onSaveMemory: (newMemory: GlobalContextMemory) => void;
  onResetVault: () => void;
}

export const GlobalMemoryModal: React.FC<GlobalMemoryModalProps> = ({
  isOpen,
  onClose,
  memory,
  machines,
  onSaveMemory,
  onResetVault,
}) => {
  if (!isOpen) return null;

  const [activeProjectName, setActiveProjectName] = useState(memory.activeProject?.name || 'opencode-core');
  const [activeProjectPath, setActiveProjectPath] = useState(memory.activeProject?.path || '/workspace/opencode-core');
  const [activeProjectStack, setActiveProjectStack] = useState(memory.activeProject?.stack || 'TypeScript / Node.js / Docker');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<string[]>(memory.notes || []);
  const [autoExecuteSafe, setAutoExecuteSafe] = useState(memory.userPreferences.autoExecuteSafe);
  const [confirmDangerous, setConfirmDangerous] = useState(memory.userPreferences.confirmDangerous);
  const [streamSpeedMs, setStreamSpeedMs] = useState(memory.userPreferences.streamSpeedMs || 35);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      setNotes([...notes, newNote.trim()]);
      setNewNote('');
    }
  };

  const handleRemoveNote = (index: number) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const updated: GlobalContextMemory = {
      ...memory,
      activeProject: {
        name: activeProjectName.trim(),
        path: activeProjectPath.trim(),
        stack: activeProjectStack.trim(),
        lastMachineId: memory.activeProject?.lastMachineId || machines[0]?.id || '',
      },
      notes,
      userPreferences: {
        ...memory.userPreferences,
        autoExecuteSafe,
        confirmDangerous,
        streamSpeedMs,
      },
    };
    onSaveMemory(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div
      id="global-memory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-memory-title"
    >
      <div className="w-full max-w-xl my-6 rounded-2xl border border-[#3A2412] bg-[#160E06] shadow-2xl overflow-hidden flex flex-col text-[#F5EFEB]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#1E1308] border-b border-[#2C1A0C]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2E1A0C] text-[#D49A3D] border border-[#482A14]">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 id="global-memory-title" className="text-base font-serif font-medium text-[#F5EFEB]">
                Cross-Machine AI Memory & Vault
              </h2>
              <p className="text-xs text-[#8C7A6B] font-serif">
                Persisted intent, developer context, and zero-knowledge local security.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2A180B] text-[#8C7A6B] hover:text-[#F5EFEB] transition-colors"
            aria-label="Close memory modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security guarantee */}
        <div className="px-5 py-2.5 bg-[#221509] border-b border-[#341F0E] flex items-center gap-2.5 text-xs text-[#C7B5A0] font-serif">
          <Shield className="w-4 h-4 text-[#D49A3D] shrink-0" />
          <span>
            Strict Privacy Standard: Zero telemetry or keystroke telemetry sent to outside analytics.
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs font-serif overflow-y-auto max-h-[70vh]">
          {/* Active Project Context */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A39180]">
              <Layers className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Active Project Context (Global Scope)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-[#8C7A6B] mb-1">
                  Project / Repository Name
                </label>
                <input
                  type="text"
                  value={activeProjectName}
                  onChange={(e) => setActiveProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#120A03] border border-[#331F0F] text-[#F5EFEB] font-serif focus:outline-none focus:border-[#D49A3D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#8C7A6B] mb-1">
                  Technology Stack
                </label>
                <input
                  type="text"
                  value={activeProjectStack}
                  onChange={(e) => setActiveProjectStack(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#120A03] border border-[#331F0F] text-[#F5EFEB] font-serif focus:outline-none focus:border-[#D49A3D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-[#8C7A6B] mb-1">
                Root Directory Path
              </label>
              <input
                type="text"
                value={activeProjectPath}
                onChange={(e) => setActiveProjectPath(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#120A03] border border-[#331F0F] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
              />
            </div>
          </div>

          {/* Developer Continuity Notes */}
          <div className="space-y-2 pt-2 border-t border-[#29180C]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A39180]">
                <FileText className="w-3.5 h-3.5 text-[#D49A3D]" />
                Intent Memory Notes ({notes.length})
              </span>
              <span className="text-[11px] text-[#7A6959]">Referenced by AI during command translation</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                placeholder="e.g. Always verify docker socket permissions before container startup"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#120A03] border border-[#331F0F] text-xs font-serif text-[#F5EFEB] focus:outline-none focus:border-[#D49A3D]"
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="px-3 py-1.5 rounded-lg bg-[#2D1B0D] hover:bg-[#3D2513] text-[#D49A3D] font-mono text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
              {notes.map((note, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#1A1006] border border-[#2B190B] text-xs text-[#D9CEBF]"
                >
                  <span className="truncate flex-1">• {note}</span>
                  <button
                    onClick={() => handleRemoveNote(idx)}
                    className="text-[#6E5946] hover:text-red-400 p-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Execution & Safety Rules */}
          <div className="space-y-3 pt-2 border-t border-[#29180C]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A39180]">
              <Sliders className="w-3.5 h-3.5 text-[#D49A3D]" />
              <span>Safety & Execution Automation</span>
            </div>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#191006] border border-[#2B1A0D] cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-medium text-[#F5EFEB] block">
                  Mandatory Confirmation on Destructive Commands
                </span>
                <span className="text-[11px] text-[#8C7A6B] block">
                  Enforces confirmation prompt for rm -rf, drop table, killall, and partition updates.
                </span>
              </div>
              <input
                type="checkbox"
                checked={confirmDangerous}
                onChange={(e) => setConfirmDangerous(e.target.checked)}
                className="w-4 h-4 accent-[#D49A3D]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#191006] border border-[#2B1A0D] cursor-pointer">
              <div className="space-y-0.5">
                <span className="font-medium text-[#F5EFEB] block">
                  Auto-Execute Benign Diagnostic Commands
                </span>
                <span className="text-[11px] text-[#8C7A6B] block">
                  Immediately execute safe queries (git status, df -h, uptime) upon AI translation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoExecuteSafe}
                onChange={(e) => setAutoExecuteSafe(e.target.checked)}
                className="w-4 h-4 accent-[#D49A3D]"
              />
            </label>

            <div className="p-2.5 rounded-xl bg-[#191006] border border-[#2B1A0D] space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-[#F5EFEB]">Output Streaming Latency</span>
                <span className="font-mono text-[#D49A3D]">{streamSpeedMs}ms / line</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={streamSpeedMs}
                onChange={(e) => setStreamSpeedMs(Number(e.target.value))}
                className="w-full accent-[#D49A3D] bg-[#291A0D] h-1.5 rounded-lg"
              />
            </div>
          </div>

          {/* Reset Vault */}
          <div className="pt-2 border-t border-[#29180C] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                if (confirm('Reset local cache and restore default OpenCode templates?')) {
                  onResetVault();
                  onClose();
                }
              }}
              className="text-[#8C7A6B] hover:text-red-400 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local Vault to Defaults</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 bg-[#1E1308] border-t border-[#2C1A0C]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#221408] hover:bg-[#2D1B0D] text-[#A39180] text-xs font-mono transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-[#D49A3D] hover:bg-[#C2892C] text-[#1A1208] text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-md"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Update Memory</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
