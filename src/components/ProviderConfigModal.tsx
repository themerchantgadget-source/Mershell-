import React, { useState } from 'react';
import { RemoteMachine } from '../types';
import { X, Server, Key, Lock, CheckCircle2, Shield, AlertCircle, RefreshCw, Cpu, HardDrive } from 'lucide-react';

interface ProviderConfigModalProps {
  machine?: RemoteMachine | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (machine: RemoteMachine) => void;
  onDelete?: (id: string) => void;
}

export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
  machine,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  if (!isOpen) return null;

  const [provider, setProvider] = useState<RemoteMachine['provider']>(machine?.provider || 'opencode');
  const [name, setName] = useState(machine?.name || 'OpenCode Workspace Pod');
  const [host, setHost] = useState(machine?.host || 'pod-4421.opencode.dev');
  const [port, setPort] = useState<number>(machine?.port || 2222);
  const [username, setUsername] = useState(machine?.username || 'developer');
  const [authType, setAuthType] = useState<'key' | 'password'>(machine?.authType || 'key');
  const [privateKey, setPrivateKey] = useState(machine?.privateKeyEncrypted || '');
  const [password, setPassword] = useState(machine?.passwordEncrypted || '');
  const [currentDir, setCurrentDir] = useState(machine?.currentDir || '/workspace/project');
  const [tagsInput, setTagsInput] = useState(machine?.tags?.join(', ') || 'OpenCode, Node.js');

  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<{ online: boolean; latencyMs: number; banner?: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleTestConnection = async () => {
    setPinging(true);
    setPingResult(null);
    setErrorMsg('');
    try {
      const res = await fetch('/api/machines/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port }),
      });
      const data = await res.json();
      setPingResult(data);
    } catch (err: any) {
      setErrorMsg('Failed to establish network handshake. Check host and port.');
    } finally {
      setPinging(false);
    }
  };

  const handleGenerateSampleKey = () => {
    const sample = `-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACDHf9iK2vQJ3p1s8s7W+r0K9QePqW7M1e4R8vY51A==
-----END OPENSSH PRIVATE KEY-----`;
    setPrivateKey(sample);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !host.trim()) {
      setErrorMsg('Machine name and host are required.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: RemoteMachine = {
      id: machine?.id || `mach-${Date.now()}`,
      name: name.trim(),
      provider,
      host: host.trim(),
      port: Number(port) || 22,
      username: username.trim() || 'root',
      authType,
      privateKeyEncrypted: authType === 'key' ? privateKey : undefined,
      passwordEncrypted: authType === 'password' ? password : undefined,
      status: 'online',
      latencyMs: pingResult?.latencyMs || 42,
      lastConnected: 'Just now',
      os: machine?.os || (provider === 'aws' ? 'Amazon Linux 2023' : 'Ubuntu 24.04 LTS'),
      currentDir: currentDir.trim() || '/workspace',
      activeProcesses: machine?.activeProcesses || 3,
      specs: machine?.specs || {
        cpuCores: 8,
        cpuUsagePercent: 28,
        ramGb: 32,
        ramUsagePercent: 44,
        diskGb: 120,
        diskUsagePercent: 30,
        uptime: '3d 14h',
      },
      envVariables: machine?.envVariables || {
        NODE_ENV: 'development',
      },
      tags: tags.length > 0 ? tags : [provider.toUpperCase()],
    };

    onSave(updated);
    onClose();
  };

  return (
    <div
      id="provider-config-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provider-config-title"
    >
      <div className="w-full max-w-xl my-8 rounded-2xl border border-[#3E2816] bg-[#170E06] shadow-2xl overflow-hidden flex flex-col text-[#F5EFEB]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#1F1308] border-b border-[#2D1B0D]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#2E1A0C] text-[#D49A3D] border border-[#482B14]">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 id="provider-config-title" className="text-base font-serif font-medium text-[#F5EFEB]">
                {machine ? 'Configure Remote Environment' : 'Add New Remote Machine'}
              </h2>
              <p className="text-xs text-[#9C8A79] font-serif">
                Configure SSH parameters for OpenCode, AWS, or custom cloud hosts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#2A190B] text-[#9C8A79] hover:text-[#F5EFEB] transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Banner */}
        <div className="px-5 py-2.5 bg-[#24160A] border-b border-[#36210F] flex items-center gap-2.5 text-xs text-[#C7B5A0]">
          <Shield className="w-4 h-4 text-[#D49A3D] shrink-0" />
          <span>
            Zero-Knowledge Local Storage: SSH keys and credentials remain exclusively in local browser vault.
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs font-serif overflow-y-auto max-h-[75vh]">
          {/* Provider Selection Tabs */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1.5">
              Provider Platform
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {[
                { id: 'opencode', label: 'OpenCode' },
                { id: 'aws', label: 'AWS EC2' },
                { id: 'digitalocean', label: 'DigitalOcean' },
                { id: 'hetzner', label: 'Hetzner' },
                { id: 'custom', label: 'Custom VPS' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setProvider(p.id as any);
                    if (p.id === 'opencode' && port === 22) setPort(2222);
                    if (p.id !== 'opencode' && port === 2222) setPort(22);
                  }}
                  className={`py-2 px-1 rounded-lg text-xs font-mono text-center border transition-all ${
                    provider === p.id
                      ? 'bg-[#3A220F] border-[#D49A3D] text-[#F5EFEB] font-semibold shadow-sm'
                      : 'bg-[#1D1107] border-[#2E1A0C] text-[#8C7A6B] hover:text-[#C7B5A0] hover:border-[#422610]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Machine Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
              Connection Label
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OpenCode Pod (Primary Dev)"
              className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-serif focus:outline-none focus:border-[#D49A3D]"
              required
            />
          </div>

          {/* Host & Port */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
                SSH Host / IP
              </label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="pod-XXXX.opencode.dev or 192.168.1.100"
                className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
                Port
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
                required
              />
            </div>
          </div>

          {/* Username & Working Dir */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer / ubuntu / root"
                className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
                Initial Working Dir
              </label>
              <input
                type="text"
                value={currentDir}
                onChange={(e) => setCurrentDir(e.target.value)}
                placeholder="/workspace"
                className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
              />
            </div>
          </div>

          {/* Authentication Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono uppercase tracking-wider text-[#A39180]">
                Authentication Method
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAuthType('key')}
                  className={`px-2.5 py-0.5 rounded text-xs font-mono ${
                    authType === 'key' ? 'bg-[#3A220F] text-[#D49A3D] font-medium' : 'text-[#8C7A6B]'
                  }`}
                >
                  SSH Key
                </button>
                <button
                  type="button"
                  onClick={() => setAuthType('password')}
                  className={`px-2.5 py-0.5 rounded text-xs font-mono ${
                    authType === 'password' ? 'bg-[#3A220F] text-[#D49A3D] font-medium' : 'text-[#8C7A6B]'
                  }`}
                >
                  Password
                </button>
              </div>
            </div>

            {authType === 'key' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-[#8C7A6B]">
                  <span>Paste OpenSSH / RSA Private Key:</span>
                  <button
                    type="button"
                    onClick={handleGenerateSampleKey}
                    className="text-[#D49A3D] hover:underline"
                  >
                    Insert Template Key
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                  className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#D9CEBF] font-mono text-[11px] focus:outline-none focus:border-[#D49A3D]"
                />
              </div>
            ) : (
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter SSH password"
                  className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-mono focus:outline-none focus:border-[#D49A3D]"
                />
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#A39180] mb-1">
              Environment Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="OpenCode, Node.js, Docker, Staging"
              className="w-full px-3 py-2 rounded-lg bg-[#120B04] border border-[#382312] text-[#F5EFEB] font-serif focus:outline-none focus:border-[#D49A3D]"
            />
          </div>

          {/* Connection Test & Feedback */}
          <div className="pt-2 border-t border-[#29180C] space-y-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={pinging}
                className="px-3 py-1.5 rounded-lg bg-[#27170A] hover:bg-[#36210E] text-[#D49A3D] text-xs font-mono flex items-center gap-1.5 border border-[#442713] transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pinging ? 'animate-spin' : ''}`} />
                <span>{pinging ? 'Verifying Handshake...' : 'Test Connection & Ping'}</span>
              </button>

              {pingResult && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Handshake Verified ({pingResult.latencyMs}ms)</span>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/40">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-[#29180C]">
            {machine && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remove machine "${machine.name}" from your vault?`)) {
                    onDelete(machine.id);
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 text-xs font-mono transition-colors"
              >
                Delete Host
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-[#221408] hover:bg-[#2D1B0D] text-[#A39180] text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-[#D49A3D] hover:bg-[#C2892C] text-[#1A1208] text-xs font-mono font-semibold transition-colors shadow-md"
              >
                {machine ? 'Save Changes' : 'Save Connection'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
