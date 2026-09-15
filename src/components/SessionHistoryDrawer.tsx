import React, { useState } from 'react';
import { SessionHistory, RemoteMachine } from '../types';
import {
  X,
  Plus,
  Search,
  Pin,
  Clock,
  Trash2,
  Download,
  Calendar,
  ChevronRight,
  Server,
  FileText,
} from 'lucide-react';

interface SessionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SessionHistory[];
  machines: RemoteMachine[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onCreateNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePinSession: (sessionId: string) => void;
}

export const SessionHistoryDrawer: React.FC<SessionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  machines,
  activeSessionId,
  onSelectSession,
  onCreateNewSession,
  onDeleteSession,
  onTogglePinSession,
}) => {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMachineId, setFilterMachineId] = useState<string>('all');

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.machineName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMachine = filterMachineId === 'all' || s.machineId === filterMachineId;
    return matchesSearch && matchesMachine;
  });

  const pinnedSessions = filteredSessions.filter((s) => s.pinned);
  const unpinnedSessions = filteredSessions.filter((s) => !s.pinned);

  const handleExportAll = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `remote-sessions-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="session-history-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-history-title"
    >
      <div className="w-full max-w-md h-full bg-[#170E06] border-l border-[#362211] shadow-2xl flex flex-col text-[#F5EFEB]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-[#1E1308] border-b border-[#2C1A0C]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#2E1B0C] text-[#D49A3D]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 id="session-history-title" className="text-base font-serif font-medium text-[#F5EFEB]">
                Session History & Logs
              </h2>
              <p className="text-xs text-[#8C7A6B] font-serif">
                Organized interactions, terminal runs & context.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onCreateNewSession}
              className="p-2 rounded-lg bg-[#D49A3D] text-[#1A1208] hover:bg-[#C2892C] font-mono text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Start New Terminal Session"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Session</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#28180A] text-[#8C7A6B] hover:text-[#F5EFEB] transition-colors ml-1"
              aria-label="Close history drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-3 bg-[#1B1107] border-b border-[#2C1A0C] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations and logs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#110A03] border border-[#2B1A0D] text-xs font-serif text-[#F5EFEB] focus:outline-none focus:border-[#D49A3D]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
            <button
              onClick={() => setFilterMachineId('all')}
              className={`px-2 py-0.5 rounded-full shrink-0 border ${
                filterMachineId === 'all'
                  ? 'bg-[#3A220F] text-[#D49A3D] border-[#553315]'
                  : 'bg-[#150D05] text-[#8C7A6B] border-[#291A0D]'
              }`}
            >
              All Hosts ({sessions.length})
            </button>
            {machines.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterMachineId(m.id)}
                className={`px-2 py-0.5 rounded-full shrink-0 border truncate max-w-[140px] ${
                  filterMachineId === m.id
                    ? 'bg-[#3A220F] text-[#D49A3D] border-[#553315]'
                    : 'bg-[#150D05] text-[#8C7A6B] border-[#291A0D]'
                }`}
              >
                {m.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {pinnedSessions.length > 0 && (
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#D49A3D] font-semibold px-2 mb-1.5 block">
                Pinned Sessions
              </span>
              <div className="space-y-1.5">
                {pinnedSessions.map((s) => renderSessionCard(s))}
              </div>
            </div>
          )}

          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#8C7A6B] px-2 mb-1.5 block">
              Recent Interactions
            </span>
            {unpinnedSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="text-center py-10 text-xs text-[#7A6959] font-serif">
                No past sessions matching filter.
              </div>
            ) : (
              <div className="space-y-1.5">
                {unpinnedSessions.map((s) => renderSessionCard(s))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with backup export */}
        <div className="p-3 bg-[#1C1208] border-t border-[#2B1B0E] flex items-center justify-between text-xs font-serif text-[#8C7A6B]">
          <span className="text-[11px] font-mono">
            {sessions.length} recorded session(s)
          </span>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-1.5 text-xs text-[#D49A3D] hover:text-[#E6B86A] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Archive</span>
          </button>
        </div>
      </div>
    </div>
  );

  function renderSessionCard(session: SessionHistory) {
    const isCurrent = session.id === activeSessionId;
    const timeFormatted = new Date(session.updatedAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div
        key={session.id}
        onClick={() => {
          onSelectSession(session.id);
          onClose();
        }}
        className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
          isCurrent
            ? 'bg-[#26180C] border-[#D49A3D]'
            : 'bg-[#180F06] hover:bg-[#1E1308] border-[#2A190C]'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-mono text-[#D49A3D] bg-[#2C1B0D] px-1.5 py-0.2 rounded border border-[#3E2512] truncate">
                {session.machineName}
              </span>
              <span className="text-[10px] font-mono text-[#7A6959]">
                {timeFormatted}
              </span>
            </div>

            <h4 className="text-sm font-serif font-medium text-[#F5EFEB] truncate group-hover:text-[#E6B86A]">
              {session.title}
            </h4>
            <p className="text-xs font-serif text-[#9E8C7B] line-clamp-2 mt-1 leading-snug">
              {session.summary}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePinSession(session.id);
              }}
              className={`p-1 rounded transition-colors ${
                session.pinned ? 'text-[#D49A3D]' : 'text-[#5C4A3A] hover:text-[#A39180]'
              }`}
              title={session.pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className="w-3.5 h-3.5 fill-current" />
            </button>

            {sessions.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete session "${session.title}"?`)) {
                    onDeleteSession(session.id);
                  }
                }}
                className="p-1 rounded text-[#5C4A3A] hover:text-red-400 transition-colors"
                title="Delete Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
