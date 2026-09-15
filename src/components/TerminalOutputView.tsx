import React, { useState } from 'react';
import { TerminalOutputLine } from '../types';
import { Copy, Check, Terminal, Maximize2, Minimize2 } from 'lucide-react';

interface TerminalOutputViewProps {
  lines: TerminalOutputLine[];
  isRunning?: boolean;
  exitCode?: number;
  command?: string;
}

export const TerminalOutputView: React.FC<TerminalOutputViewProps> = ({
  lines,
  isRunning = false,
  exitCode,
  command,
}) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    const rawText = lines.map((l) => l.text.replace(/\x1b\[[0-9;]*m/g, '')).join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic ANSI color strip/render helper
  const renderFormattedText = (text: string) => {
    // If text contains simple ANSI codes
    if (text.includes('\x1b[')) {
      const parts = text.split(/(\x1b\[[0-9;]*m)/g);
      let currentColor = '';
      return parts.map((part, i) => {
        if (part === '\x1b[31m') {
          currentColor = 'text-red-400';
          return null;
        }
        if (part === '\x1b[32m') {
          currentColor = 'text-emerald-400';
          return null;
        }
        if (part === '\x1b[33m') {
          currentColor = 'text-amber-300';
          return null;
        }
        if (part === '\x1b[36m') {
          currentColor = 'text-cyan-300';
          return null;
        }
        if (part === '\x1b[0m') {
          currentColor = '';
          return null;
        }
        return (
          <span key={i} className={currentColor || undefined}>
            {part}
          </span>
        );
      });
    }
    return text;
  };

  return (
    <div
      id="terminal-output-container"
      className="mt-3 rounded-lg border border-[#382513] bg-[#120B04] overflow-hidden shadow-inner text-xs font-mono"
    >
      {/* Terminal Titlebar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#1B1107] border-b border-[#2D1C0E] text-[#A39180]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#523318]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#523318]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#523318]" />
          </div>
          <span className="text-[11px] tracking-wider uppercase text-[#8C7A6B] ml-1 flex items-center gap-1">
            <Terminal className="w-3 h-3 text-[#D49A3D]" />
            Remote stdout
          </span>
        </div>

        <div className="flex items-center gap-2">
          {exitCode !== undefined && !isRunning && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold ${
                exitCode === 0
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  : 'bg-red-950/80 text-red-300 border border-red-800/60'
              }`}
            >
              Exit {exitCode}
            </span>
          )}

          {isRunning && (
            <span className="flex items-center gap-1 text-[11px] text-[#D49A3D] animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D49A3D]" />
              streaming...
            </span>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-[#2A1A0C] text-[#8C7A6B] hover:text-[#F5EFEB] transition-colors"
            title={expanded ? 'Compress view' : 'Expand view'}
            aria-label="Toggle terminal height"
          >
            {expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>

          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-[#2A1A0C] text-[#8C7A6B] hover:text-[#F5EFEB] transition-colors"
            title="Copy output"
            aria-label="Copy terminal output"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Terminal Stream Content */}
      <div
        className={`p-3 overflow-x-auto space-y-1 transition-all ${
          expanded ? 'max-h-[420px]' : 'max-h-[220px]'
        } overflow-y-auto select-text`}
      >
        {command && (
          <div className="text-[#8C7A6B] pb-1 border-b border-[#25170B] flex items-center gap-1.5">
            <span className="text-[#D49A3D]">$</span>
            <span className="text-[#E0D4C5] font-medium">{command}</span>
          </div>
        )}

        {lines.length === 0 && isRunning && (
          <div className="text-[#7A695A] italic py-2 flex items-center gap-2">
            <span className="terminal-cursor" />
            <span>Awaiting socket response from remote runtime...</span>
          </div>
        )}

        {lines.map((line, idx) => {
          let lineStyle = 'text-[#D9CEBF]';
          if (line.type === 'stderr') lineStyle = 'text-red-400 bg-red-950/20 px-1 rounded';
          if (line.type === 'info') lineStyle = 'text-[#D49A3D] font-serif italic';
          if (line.type === 'prompt') lineStyle = 'text-[#E6B86A] font-semibold';
          if (line.type === 'success') lineStyle = 'text-emerald-400';

          return (
            <div key={line.id || idx} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-[#4E3926] select-none text-[10px] w-5 text-right shrink-0 pt-0.5">
                {idx + 1}
              </span>
              <div className={`flex-1 break-all whitespace-pre-wrap ${lineStyle}`}>
                {renderFormattedText(line.text)}
              </div>
            </div>
          );
        })}

        {isRunning && (
          <div className="flex items-center gap-2 pt-1 text-[#D49A3D]">
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </div>
  );
};
