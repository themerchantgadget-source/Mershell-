import React, { useState } from 'react';
import { RemoteMachine } from '../types';
import {
  Server,
  Plus,
  Radio,
  Cpu,
  HardDrive,
  Clock,
  Terminal,
  Settings2,
  CheckSquare,
  Square,
  Search,
  Zap,
  Activity,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface ConnectionHubProps {
  machines: RemoteMachine[];
  activeMachineId: string;
  onSelectMachine: (machineId: string) => void;
  onOpenConfig: (machine?: RemoteMachine) => void;
  onRefreshStatuses: () => void;
  onStartMultiSession?: (machineIds: string[]) => void;
}

export const ConnectionHub: React.FC<ConnectionHubProps> = ({
  machines,
  activeMachineId,
  onSelectMachine,
  onOpenConfig,
  onRefreshStatuses,
  onStartMultiSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([activeMachineId]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredMachines = machines.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((x) => x !== id) : prev) : [...prev, id]
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefreshStatuses();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const getProviderBadge = (provider: RemoteMachine['provider']) => {
    switch (provider) {
      case 'opencode':
        return { label: 'OpenCode Pod', color: 'text-[#E6B86A] bg-[#2E1D0C] border-[#553315]' };
      case 'aws':
        return { label: 'AWS EC2', color: 'text-amber-300 bg-amber-950/40 border-amber-800/40' };
      case 'digitalocean':
        return { label: 'DigitalOcean', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-800/40' };
      case 'hetzner':
        return { label: 'Hetzner Cloud', color: 'text-rose-300 bg-rose-950/40 border-rose-800/40' };
      default:
        return { label: 'Custom VPS', color: 'text-[#C7B5A0] bg-[#2A1B0E] border-[#442813]' };
    }
  };

  return (
    <div id="connection-hub-screen" className="flex-1 flex flex-col p-4 sm:p-6 max-w-6xl mx-auto w-full">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2D1C0E]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono uppercase tracking-widest text-[#D49A3D]">
              Cluster Infrastructure
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#D49A3D]" />
            <span className="text-[11px] font-mono text-[#8C7A6B]">
              {machines.filter((m) => m.status === 'online').length} online
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-[#F5EFEB] tracking-tight">
            Connection Hub
          </h1>
          <p className="text-sm text-[#A39180] font-serif mt-0.5">
            Manage authenticated SSH development environments and initiate concurrent terminal sessions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-[#1E1308] hover:bg-[#2B1B0D] text-[#A39180] hover:text-[#F5EFEB] border border-[#34200F] transition-colors"
            title="Refresh connectivity status"
            aria-label="Refresh machine statuses"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#D49A3D]' : ''}`} />
          </button>

          <button
            onClick={() => onOpenConfig()}
            className="px-4 py-2.5 rounded-xl bg-[#D49A3D] hover:bg-[#C2892C] text-[#1A1208] text-xs font-mono font-semibold flex items-center gap-2 transition-all shadow-md active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Environment</span>
          </button>
        </div>
      </div>

      {/* Filter and Multi-Host Action Toolbar */}
      <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter environments by name, host, or tag..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#140C05] border border-[#2E1C0E] text-xs font-serif text-[#F5EFEB] focus:outline-none focus:border-[#D49A3D] placeholder:text-[#6E5E50]"
          />
        </div>

        {selectedIds.length > 1 && (
          <div className="flex items-center gap-3 bg-[#24170B] px-3.5 py-1.5 rounded-xl border border-[#482E16] animate-fade-in">
            <span className="text-xs font-mono text-[#D49A3D] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-current" />
              {selectedIds.length} Hosts Selected
            </span>
            {onStartMultiSession && (
              <button
                onClick={() => onStartMultiSession(selectedIds)}
                className="px-3 py-1 rounded-lg bg-[#D49A3D] text-[#1A1208] text-xs font-mono font-semibold hover:bg-[#E6B86A] transition-colors"
              >
                Broadcast Session
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid of Machines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
        {filteredMachines.map((mach) => {
          const isSelected = selectedIds.includes(mach.id);
          const isActive = mach.id === activeMachineId;
          const badge = getProviderBadge(mach.provider);
          const isOnline = mach.status === 'online';

          return (
            <div
              key={mach.id}
              id={`machine-card-${mach.id}`}
              onClick={() => onSelectMachine(mach.id)}
              className={`group relative rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-[#22160C] border-[#D49A3D] shadow-lg shadow-[#D49A3D]/5'
                  : 'bg-[#180F06] hover:bg-[#1E1308] border-[#2E1C0E] hover:border-[#422915]'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${badge.color}`}
                    >
                      {badge.label}
                    </span>

                    <span
                      className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono ${
                        isOnline
                          ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-900/60'
                          : 'text-[#8C7A6B] bg-[#221509] border border-[#34200F]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[#665445]'
                        }`}
                      />
                      {isOnline ? `Online (${mach.latencyMs || 42}ms)` : 'Offline'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleToggleSelect(mach.id, e)}
                      className="p-1 rounded text-[#8C7A6B] hover:text-[#D49A3D] transition-colors"
                      title={isSelected ? 'Deselect from broadcast' : 'Select for multi-host broadcast'}
                      aria-label="Toggle machine selection"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#D49A3D]" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenConfig(mach);
                      }}
                      className="p-1 rounded text-[#8C7A6B] hover:text-[#F5EFEB] transition-colors"
                      title="Edit SSH Configuration"
                      aria-label="Configure machine"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Machine Title & Host */}
                <h3 className="text-base font-serif font-medium text-[#F5EFEB] mb-1 group-hover:text-[#E6B86A] transition-colors">
                  {mach.name}
                </h3>
                <div className="font-mono text-xs text-[#8C7A6B] truncate flex items-center gap-1.5">
                  <span>{mach.username}@{mach.host}</span>
                  <span className="text-[#553F2B]">•</span>
                  <span>:{mach.port}</span>
                </div>

                {/* OS & Path */}
                <p className="text-xs font-serif text-[#A39180] mt-2 truncate">
                  {mach.os} • <span className="font-mono text-[11px] text-[#C7B5A0]">{mach.currentDir}</span>
                </p>
              </div>

              {/* Hardware Specs & Resource Gauges */}
              <div className="mt-4 pt-3 border-t border-[#291A0D] space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  {/* CPU */}
                  <div className="bg-[#120B04] p-2 rounded-lg border border-[#27180B]">
                    <div className="flex items-center justify-between text-[#8C7A6B] mb-1">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-[#D49A3D]" /> CPU
                      </span>
                      <span>{mach.specs.cpuUsagePercent}%</span>
                    </div>
                    <div className="w-full bg-[#241609] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#D49A3D] h-full rounded-full transition-all"
                        style={{ width: `${mach.specs.cpuUsagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* RAM */}
                  <div className="bg-[#120B04] p-2 rounded-lg border border-[#27180B]">
                    <div className="flex items-center justify-between text-[#8C7A6B] mb-1">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-[#D49A3D]" /> RAM
                      </span>
                      <span>{mach.specs.ramUsagePercent}%</span>
                    </div>
                    <div className="w-full bg-[#241609] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#E6B86A] h-full rounded-full transition-all"
                        style={{ width: `${mach.specs.ramUsagePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* DISK */}
                  <div className="bg-[#120B04] p-2 rounded-lg border border-[#27180B]">
                    <div className="flex items-center justify-between text-[#8C7A6B] mb-1">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3 text-[#D49A3D]" /> DISK
                      </span>
                      <span>{mach.specs.diskUsagePercent}%</span>
                    </div>
                    <div className="w-full bg-[#241609] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-[#A39180] h-full rounded-full transition-all"
                        style={{ width: `${mach.specs.diskUsagePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Tag Row */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {mach.tags.slice(0, 2).map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#20140A] text-[#8C7A6B] border border-[#2F1D0E] truncate"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono font-medium text-[#D49A3D] group-hover:translate-x-1 transition-transform">
                    <span>{isActive ? 'Active Terminal' : 'Connect'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
