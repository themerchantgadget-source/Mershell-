import React, { useState } from 'react';
import { CommandBlock } from '../types';
import { Play, RotateCw, AlertTriangle, CheckCircle2, ShieldAlert, Square, Copy, Check } from 'lucide-react';
import { TerminalOutputView } from './TerminalOutputView';

interface CommandCardProps {
  commandBlock: CommandBlock;
  onExecute: (command: string) => void;
  onCancel?: () => void;
}

export const CommandCard: React.FC<CommandCardProps> = ({
  commandBlock,
  onExecute,
  onCancel,
}) => {
  const [confirmed, setConfirmed] = useState(!commandBlock.requiresConfirmation);
  const [copied, setCopied] = useState(false);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(commandBlock.command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRunning = commandBlock.executionStatus === 'running';
  const isCompleted = commandBlock.executionStatus === 'success';
  const isFailed = commandBlock.executionStatus === 'failed';

  return (
    <div
      id={`command-card-${commandBlock.id}`}
      className="mt-3 rounded-xl border border-[#3A2614] bg-[#1E140A] p-3.5 sm:p-4 shadow-md text-sm transition-all"
    >
      {/* Header with intent and status */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium tracking-wide bg-[#2D1C0E] text-[#D49A3D] border border-[#482D16]">
            COMMAND
          </span>

          {commandBlock.estimatedDuration && (
            <span className="text-[11px] font-mono text-[#8C7A6B]">
              est: {commandBlock.estimatedDuration}
            </span>
          )}

          {commandBlock.isDangerous && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-red-950/80 text-red-300 border border-red-800/80">
              <ShieldAlert className="w-3 h-3 text-red-400" />
              DESTRUCTIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isCompleted && (
            <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
              <CheckCircle2 className="w-3 h-3" />
              Executed
            </span>
          )}
          {isFailed && (
            <span className="flex items-center gap-1 text-xs font-mono text-red-400 bg-red-950/40 px-2 py-0.5 rounded border border-red-900/50">
              <AlertTriangle className="w-3 h-3" />
              Failed
            </span>
          )}
        </div>
      </div>

      {/* Rationale explanation */}
      <p className="text-[#D9CEBF] font-serif text-sm leading-relaxed mb-3">
        {commandBlock.rawExplanation}
      </p>

      {/* Raw Command Container */}
      <div className="group relative rounded-lg border border-[#332010] bg-[#130B04] p-3 font-mono text-xs text-[#EAE2D7] overflow-x-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto select-all">
          <span className="text-[#D49A3D] font-bold select-none">$</span>
          <code className="whitespace-pre">{commandBlock.command}</code>
        </div>
        <button
          onClick={handleCopyCommand}
          className="p-1 rounded text-[#8C7A6B] hover:text-[#F5EFEB] hover:bg-[#281A0D] transition-colors shrink-0"
          title="Copy command"
          aria-label="Copy shell command"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Destructive Warning Confirmation Gate */}
      {commandBlock.isDangerous && !confirmed && !isCompleted && (
        <div className="mt-3 p-3 rounded-lg border border-red-900/60 bg-red-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-serif">
              Caution: This command modifies system state or deletes data. Confirm execution.
            </p>
          </div>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full sm:w-auto px-3 py-1 rounded bg-red-900/80 hover:bg-red-800 text-red-100 text-xs font-mono font-medium transition-colors border border-red-700"
          >
            I understand, enable run
          </button>
        </div>
      )}

      {/* Action Controls */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#2A1B0E]">
        <span className="text-[11px] text-[#7A695A] font-serif italic">
          Target host will receive command via authenticated SSH tunnel.
        </span>

        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-mono flex items-center gap-1.5 border border-red-800 transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Interrupt (SIGINT)</span>
            </button>
          ) : (
            <button
              disabled={commandBlock.isDangerous && !confirmed}
              onClick={() => onExecute(commandBlock.command)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                commandBlock.isDangerous && !confirmed
                  ? 'bg-[#2A1C0E] text-[#6E5F52] cursor-not-allowed border border-[#382513]'
                  : isCompleted
                  ? 'bg-[#2B1B0E] hover:bg-[#382312] text-[#E0D4C5] border border-[#4E3218]'
                  : 'bg-[#D49A3D] hover:bg-[#C2892C] text-[#1A1208] font-semibold active:scale-98'
              }`}
            >
              {isCompleted ? (
                <>
                  <RotateCw className="w-3 h-3" />
                  <span>Re-execute</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Execute on Remote</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Streaming Terminal Output */}
      {(isRunning || (commandBlock.outputLines && commandBlock.outputLines.length > 0)) && (
        <TerminalOutputView
          lines={commandBlock.outputLines || []}
          isRunning={isRunning}
          exitCode={commandBlock.exitCode}
          command={commandBlock.command}
        />
      )}
    </div>
  );
};
