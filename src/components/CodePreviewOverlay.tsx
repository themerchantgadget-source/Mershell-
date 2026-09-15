import React, { useState } from 'react';
import { CodePreviewData } from '../types';
import { X, Copy, Check, FileCode, Sparkles, Download, ArrowDownUp, ShieldCheck } from 'lucide-react';

interface CodePreviewOverlayProps {
  data: CodePreviewData;
  onClose: () => void;
  onAskAI?: (query: string) => void;
}

export const CodePreviewOverlay: React.FC<CodePreviewOverlayProps> = ({
  data,
  onClose,
  onAskAI,
}) => {
  const [copied, setCopied] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(data.explanation || null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([data.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = data.filePath?.split('/').pop() || 'remote-file.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRequestAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/ai/explain-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: data.code,
          language: data.language,
          filePath: data.filePath,
          query: 'Provide an editorial architectural review, safety verification, and optimization insights for this code.',
        }),
      });
      const result = await res.json();
      if (result.explanation) {
        setAiAnalysis(result.explanation);
      }
    } catch (err) {
      console.warn('AI analysis request error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const lines = data.code.split('\n');

  return (
    <div
      id="code-preview-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="code-preview-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-[#3E2816] bg-[#160E06] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#1C1208] border-b border-[#2D1C0E]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-1.5 rounded-lg bg-[#2D1C0E] text-[#D49A3D] shrink-0">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="code-preview-title" className="text-sm font-serif font-medium text-[#F5EFEB] truncate">
                {data.title || data.filePath || 'Remote Code Inspection'}
              </h3>
              <p className="text-[11px] font-mono text-[#8C7A6B] truncate">
                {data.filePath || 'buffer'} • {data.language.toUpperCase()} • {lines.length} lines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRequestAnalysis}
              disabled={analyzing}
              className="px-2.5 py-1 rounded-lg bg-[#2A1A0C] hover:bg-[#382312] text-[#D49A3D] text-xs font-serif flex items-center gap-1.5 border border-[#482D16] transition-colors"
              title="Request AI analysis"
            >
              <Sparkles className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{analyzing ? 'Analyzing...' : 'AI Critique'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg hover:bg-[#281A0D] text-[#A39180] hover:text-[#F5EFEB] transition-colors"
              title="Copy Code"
              aria-label="Copy snippet code"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-1.5 rounded-lg hover:bg-[#281A0D] text-[#A39180] hover:text-[#F5EFEB] transition-colors"
              title="Download File"
              aria-label="Download code snippet"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#281A0D] text-[#A39180] hover:text-[#F5EFEB] transition-colors ml-1"
              title="Close Preview"
              aria-label="Close code preview overlay"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Analysis Drawer (if present) */}
        {aiAnalysis && (
          <div className="px-4 py-2.5 bg-[#20150B] border-b border-[#341F0F] text-xs font-serif text-[#E0D4C5] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#D49A3D] shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <span className="font-semibold text-[#E6B86A] uppercase tracking-wider text-[10px] font-mono">
                Architectural Assessment
              </span>
              <p className="leading-relaxed text-[#D2C5B4]">{aiAnalysis}</p>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-[#7A695A] hover:text-[#A39180] text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Code Content with Line Numbers */}
        <div className="flex-1 overflow-auto bg-[#100903] p-4 text-xs font-mono select-text">
          <pre className="table w-full">
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              let isAddition = data.diff && line.startsWith('+');
              let isDeletion = data.diff && line.startsWith('-');
              let isHunk = data.diff && line.startsWith('@@');

              let lineBg = '';
              let textColor = 'text-[#D9CEBF]';

              if (isAddition) {
                lineBg = 'bg-emerald-950/30';
                textColor = 'text-emerald-300';
              } else if (isDeletion) {
                lineBg = 'bg-red-950/30';
                textColor = 'text-red-300';
              } else if (isHunk) {
                lineBg = 'bg-[#291B0E]/60';
                textColor = 'text-[#D49A3D] font-bold';
              }

              return (
                <div key={idx} className={`table-row leading-relaxed ${lineBg}`}>
                  <span className="table-cell pr-4 text-right select-none text-[#523C28] text-[11px] w-8">
                    {lineNum}
                  </span>
                  <span className={`table-cell whitespace-pre font-mono ${textColor}`}>
                    {line || ' '}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[#1A1107] border-t border-[#291A0D] flex items-center justify-between text-[11px] text-[#8C7A6B]">
          <span className="flex items-center gap-1 font-serif italic">
            <ArrowDownUp className="w-3 h-3 text-[#D49A3D]" />
            Inspecting remote virtual buffer
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#2D1C0E] hover:bg-[#3D2614] text-[#F5EFEB] font-mono transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
