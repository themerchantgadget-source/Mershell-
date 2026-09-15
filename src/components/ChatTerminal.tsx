import React, { useState, useRef, useEffect } from 'react';
import {
  RemoteMachine,
  ChatMessage,
  CodePreviewData,
  GlobalContextMemory,
} from '../types';
import { CommandCard } from './CommandCard';
import {
  Terminal,
  Send,
  Sparkles,
  Server,
  FileCode,
  History,
  Shield,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Maximize2,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface ChatTerminalProps {
  machine: RemoteMachine;
  allMachines: RemoteMachine[];
  messages: ChatMessage[];
  globalMemory: GlobalContextMemory;
  onSendMessage: (text: string, isRawCommand?: boolean) => void;
  onExecuteCommand: (messageId: string, command: string) => void;
  onCancelCommand: (messageId: string) => void;
  onSelectMachine: (machineId: string) => void;
  onOpenCodePreview: (preview: CodePreviewData) => void;
  onOpenHistory: () => void;
  onOpenMemory: () => void;
  isInterpreting?: boolean;
}

export const ChatTerminal: React.FC<ChatTerminalProps> = ({
  machine,
  allMachines,
  messages,
  globalMemory,
  onSendMessage,
  onExecuteCommand,
  onCancelCommand,
  onSelectMachine,
  onOpenCodePreview,
  onOpenHistory,
  onOpenMemory,
  isInterpreting = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRawMode, setIsRawMode] = useState(false);
  const [machineDropdownOpen, setMachineDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isInterpreting]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isInterpreting) return;
    onSendMessage(inputText.trim(), isRawMode);
    setInputText('');
  };

  const handleFollowUpClick = (followUp: string) => {
    onSendMessage(followUp, false);
  };

  const quickPills = [
    { label: 'Git status', cmd: 'Check git status and modified files' },
    { label: 'Docker containers', cmd: 'List running and stopped docker containers' },
    { label: 'Memory & CPU', cmd: 'Check memory and top CPU consuming processes' },
    { label: 'Recent error logs', cmd: 'Examine recent system error logs in journalctl' },
    { label: 'Build project', cmd: 'Run project production build' },
  ];

  return (
    <div id="chat-terminal-workspace" className="flex-1 flex flex-col h-full bg-[#1A1208] text-[#F5EFEB] overflow-hidden">
      {/* Top Mobile-First Terminal Header */}
      <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 bg-[#1C1208] border-b border-[#2E1C0E] flex items-center justify-between gap-3 shrink-0 z-10">
        {/* Machine Selector & Status */}
        <div className="relative flex items-center gap-2 min-w-0">
          <div
            onClick={() => setMachineDropdownOpen(!machineDropdownOpen)}
            className="flex items-center gap-2 p-1 sm:p-1.5 rounded-xl hover:bg-[#28180A] cursor-pointer transition-colors border border-transparent hover:border-[#382312]"
            role="button"
            aria-expanded={machineDropdownOpen}
            aria-label="Switch remote machine"
          >
            <div className="relative">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block animate-pulse" />
            </div>

            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-serif font-medium text-[#F5EFEB] truncate">
                  {machine.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C7A6B] shrink-0" />
              </div>
              <p className="text-[11px] font-mono text-[#8C7A6B] truncate">
                {machine.username}@{machine.host} • {machine.latencyMs || 38}ms
              </p>
            </div>
          </div>

          {/* Machine Dropdown */}
          {machineDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1.5 w-72 rounded-xl bg-[#1A1107] border border-[#3A2412] shadow-2xl py-1.5 z-50 text-xs font-serif"
              onMouseLeave={() => setMachineDropdownOpen(false)}
            >
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8C7A6B] border-b border-[#2A180B]">
                Switch Active SSH Session
              </div>
              {allMachines.map((m) => (
                <div
                  key={m.id}
                  onClick={() => {
                    onSelectMachine(m.id);
                    setMachineDropdownOpen(false);
                  }}
                  className={`px-3 py-2 flex items-center justify-between hover:bg-[#281A0D] cursor-pointer transition-colors ${
                    m.id === machine.id ? 'bg-[#2E1C0E] text-[#D49A3D]' : 'text-[#E0D4C5]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{m.name}</div>
                    <div className="text-[10px] font-mono text-[#8C7A6B] truncate">
                      {m.host} • {m.provider.toUpperCase()}
                    </div>
                  </div>
                  {m.id === machine.id && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D49A3D] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onOpenMemory}
            className="p-2 rounded-xl bg-[#22150A] hover:bg-[#2F1D0E] text-[#D49A3D] border border-[#382312] transition-colors flex items-center gap-1 text-xs font-mono"
            title="Global AI Memory & Project Context"
            aria-label="Open global context memory"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden md:inline">AI Memory</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-[#22150A] hover:bg-[#2F1D0E] text-[#A39180] hover:text-[#F5EFEB] border border-[#382312] transition-colors flex items-center gap-1 text-xs font-mono"
            title="Session History Logs"
            aria-label="Open session history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logs</span>
          </button>
        </div>
      </div>

      {/* Main Message Stream */}
      <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 space-y-4">
        {/* Welcome Empty State if no messages */}
        {messages.length === 0 && (
          <div className="max-w-xl mx-auto text-center py-10 sm:py-16 space-y-4 animate-fade-in">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#28180A] border border-[#442813] flex items-center justify-center text-[#D49A3D] shadow-lg">
              <Terminal className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-[#F5EFEB]">
                Remote Terminal Assistant
              </h2>
              <p className="text-xs sm:text-sm font-serif text-[#9E8C7B] mt-1 max-w-md mx-auto leading-relaxed">
                Describe desired actions in natural language. The AI translates them into shell commands, verifies safety parameters, and streams output directly from {machine.name}.
              </p>
            </div>

            {/* Starter Suggestion Chips */}
            <div className="pt-4 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
              {quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(pill.cmd, false)}
                  className="px-3 py-1.5 rounded-full bg-[#20140A] hover:bg-[#2E1D0E] text-xs font-serif text-[#C7B5A0] hover:text-[#F5EFEB] border border-[#34200E] transition-all hover:border-[#D49A3D]"
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Items */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <div
              key={msg.id}
              id={`message-${msg.id}`}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl ${
                isUser ? 'ml-auto' : 'mr-auto'
              } w-full animate-fade-in`}
            >
              {/* Role Header */}
              <div className="flex items-center gap-2 px-1 mb-1 text-[11px] font-mono text-[#8C7A6B]">
                {isUser ? (
                  <span>Operator ({machine.username})</span>
                ) : (
                  <span className="flex items-center gap-1 text-[#D49A3D]">
                    <Sparkles className="w-3 h-3" />
                    Assistant Interpretation
                  </span>
                )}
                <span>•</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Message Bubble / Card */}
              <div
                className={`w-full rounded-2xl p-4 text-sm leading-relaxed border transition-all ${
                  isUser
                    ? 'bg-[#291A0C] border-[#442A14] text-[#F5EFEB] font-serif shadow-sm'
                    : 'bg-[#180E05] border-[#2E1B0C] text-[#E0D4C5] font-serif shadow-md'
                }`}
              >
                {/* Natural Discourse Text */}
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {/* Command Block Component */}
                {msg.commandBlock && (
                  <CommandCard
                    commandBlock={msg.commandBlock}
                    onExecute={(cmd) => onExecuteCommand(msg.id, cmd)}
                    onCancel={() => onCancelCommand(msg.id)}
                  />
                )}

                {/* Code Preview Trigger Button (if code payload attached) */}
                {msg.codePreview && (
                  <div className="mt-3 p-2.5 rounded-xl bg-[#1F1409] border border-[#36210E] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileCode className="w-4 h-4 text-[#D49A3D] shrink-0" />
                      <div className="min-w-0">
                        <span className="text-xs font-mono text-[#F5EFEB] font-medium block truncate">
                          {msg.codePreview.title || msg.codePreview.filePath || 'Code Block'}
                        </span>
                        <span className="text-[10px] font-mono text-[#8C7A6B]">
                          {msg.codePreview.language.toUpperCase()} • Click to view syntax-highlighted buffer
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenCodePreview(msg.codePreview!)}
                      className="px-2.5 py-1 rounded-lg bg-[#2E1C0E] hover:bg-[#3E2512] text-[#D49A3D] text-xs font-mono font-medium flex items-center gap-1 transition-colors shrink-0"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Inspect Code</span>
                    </button>
                  </div>
                )}

                {/* Suggested Follow-Ups */}
                {msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#29180B] flex flex-wrap gap-1.5">
                    {msg.followUps.map((fu, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleFollowUpClick(fu)}
                        className="px-2.5 py-1 rounded-lg bg-[#22150A] hover:bg-[#321F0F] text-[#D9CEBF] hover:text-[#F5EFEB] text-xs font-serif border border-[#382312] transition-colors flex items-center gap-1"
                      >
                        <span>{fu}</span>
                        <ArrowRight className="w-3 h-3 text-[#D49A3D]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Live Interpreting Indicator */}
        {isInterpreting && (
          <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-[#1A1006] border border-[#2D1B0D] text-xs font-serif text-[#D49A3D] max-w-md animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>AI analyzing intent and formulating shell execution parameters...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Persistent Bottom Input Bar */}
      <div className="p-3 sm:p-4 bg-[#180E05] border-t border-[#2E1B0C] shrink-0 space-y-2">
        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setIsRawMode(!isRawMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 shrink-0 border transition-all ${
              isRawMode
                ? 'bg-[#3A220F] text-[#D49A3D] border-[#D49A3D]'
                : 'bg-[#1D1107] text-[#8C7A6B] border-[#2D1B0D]'
            }`}
          >
            <span>{isRawMode ? 'Raw Shell ($)' : 'AI Natural Language'}</span>
          </button>

          {quickPills.slice(0, 4).map((p, idx) => (
            <button
              key={idx}
              onClick={() => onSendMessage(p.cmd, false)}
              className="px-2.5 py-1 rounded-lg bg-[#1F1308] hover:bg-[#2C1B0D] text-[#8C7A6B] hover:text-[#D9CEBF] text-xs font-serif border border-[#2A180B] whitespace-nowrap shrink-0 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-3.5 font-mono text-xs text-[#D49A3D] select-none font-bold">
              {isRawMode ? '$' : 'AI >'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isRawMode
                  ? 'Enter raw bash command to stream on remote...'
                  : 'Ask in natural language (e.g. "Check why memory is high and list big files")...'
              }
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#110A03] border border-[#331F0F] text-sm font-serif text-[#F5EFEB] placeholder:text-[#6E5D4F] focus:outline-none focus:border-[#D49A3D] transition-colors shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isInterpreting}
            className={`p-3 rounded-xl transition-all shadow-md shrink-0 ${
              inputText.trim() && !isInterpreting
                ? 'bg-[#D49A3D] hover:bg-[#C2892C] text-[#1A1208] active:scale-95'
                : 'bg-[#221509] text-[#554232] cursor-not-allowed border border-[#2E1C0E]'
            }`}
            aria-label="Send query"
          >
            <Send className="w-4 h-4 fill-current" />
          </button>
        </form>

        {/* Working directory status bar */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[#6E5D4F] px-1">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-[#D49A3D]">host:</span>
            <span className="text-[#A39180] truncate">{machine.name}</span>
            <span>•</span>
            <span className="text-[#D49A3D]">cwd:</span>
            <span className="text-[#A39180] truncate">{machine.currentDir}</span>
          </div>
          <span className="hidden sm:inline">Secure SSH Tunnel</span>
        </div>
      </div>
    </div>
  );
};
