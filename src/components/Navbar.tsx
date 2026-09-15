import React from 'react';
import { Terminal, Server, History, Brain, Plus, Shield } from 'lucide-react';

interface NavbarProps {
  currentView: 'chat' | 'hub';
  onSelectView: (view: 'chat' | 'hub') => void;
  onOpenHistory: () => void;
  onOpenMemory: () => void;
  onOpenNewMachine: () => void;
  activeMachineName?: string;
  onlineCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  onOpenHistory,
  onOpenMemory,
  onOpenNewMachine,
  activeMachineName,
  onlineCount,
}) => {
  return (
    <header className="px-3 sm:px-6 py-2.5 bg-[#140C04] border-b border-[#2B1B0E] flex items-center justify-between gap-3 shrink-0 z-20">
      {/* Brand Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#28180A] border border-[#482B14] flex items-center justify-center text-[#D49A3D] shadow-sm">
          <Terminal className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-sm sm:text-base text-[#F5EFEB] tracking-tight">
              Remote Code Assistant
            </span>
            <span className="hidden sm:inline px-1.5 py-0.2 rounded text-[10px] font-mono text-[#D49A3D] bg-[#2E1A0C] border border-[#482A14]">
              v2.4
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#7A6959] hidden sm:block">
            Autonomous Terminal & Remote Dev Manager
          </p>
        </div>
      </div>

      {/* Primary View Switcher */}
      <div className="flex items-center p-1 rounded-xl bg-[#1A1005] border border-[#2D1B0E] text-xs font-mono">
        <button
          onClick={() => onSelectView('chat')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
            currentView === 'chat'
              ? 'bg-[#35200F] text-[#D49A3D] font-medium shadow-sm'
              : 'text-[#8C7A6B] hover:text-[#C7B5A0]'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Chat Terminal</span>
        </button>

        <button
          onClick={() => onSelectView('hub')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
            currentView === 'hub'
              ? 'bg-[#35200F] text-[#D49A3D] font-medium shadow-sm'
              : 'text-[#8C7A6B] hover:text-[#C7B5A0]'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Connection Hub</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </button>
      </div>

      {/* Auxiliary Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onOpenMemory}
          className="p-2 rounded-xl bg-[#1C1207] hover:bg-[#28180A] text-[#8C7A6B] hover:text-[#D49A3D] border border-[#2E1B0E] transition-colors"
          title="Global Memory & Vault Security"
          aria-label="Open AI Memory and Security Vault"
        >
          <Brain className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenHistory}
          className="p-2 rounded-xl bg-[#1C1207] hover:bg-[#28180A] text-[#8C7A6B] hover:text-[#F5EFEB] border border-[#2E1B0E] transition-colors"
          title="Session History Logs"
          aria-label="Open Session History Logs"
        >
          <History className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenNewMachine}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#28180A] hover:bg-[#382210] text-[#D49A3D] hover:text-[#E6B86A] text-xs font-mono border border-[#442813] transition-colors"
          title="Add New Remote Machine"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Machine</span>
        </button>
      </div>
    </header>
  );
};
