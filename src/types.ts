export interface RemoteMachine {
  id: string;
  name: string;
  provider: 'opencode' | 'aws' | 'digitalocean' | 'hetzner' | 'custom';
  host: string;
  port: number;
  username: string;
  authType: 'key' | 'password';
  privateKeyEncrypted?: string;
  passwordEncrypted?: string;
  passphraseProtected?: boolean;
  status: 'online' | 'offline' | 'connecting' | 'error';
  latencyMs?: number;
  lastConnected?: string;
  os: string;
  currentDir: string;
  activeProcesses: number;
  specs: {
    cpuCores: number;
    cpuUsagePercent: number;
    ramGb: number;
    ramUsagePercent: number;
    diskGb: number;
    diskUsagePercent: number;
    uptime: string;
  };
  envVariables: Record<string, string>;
  tags: string[];
  autoConnect?: boolean;
}

export interface TerminalOutputLine {
  id: string;
  text: string;
  type: 'stdout' | 'stderr' | 'info' | 'prompt' | 'success';
  timestamp: number;
}

export interface CommandBlock {
  id: string;
  command: string;
  rawExplanation: string;
  isDangerous: boolean;
  estimatedDuration?: string;
  executionStatus: 'idle' | 'running' | 'success' | 'failed' | 'cancelled';
  exitCode?: number;
  startedAt?: number;
  completedAt?: number;
  outputLines: TerminalOutputLine[];
  requiresConfirmation?: boolean;
}

export interface CodePreviewData {
  id: string;
  title: string;
  filePath?: string;
  language: string;
  code: string;
  diff?: boolean;
  explanation?: string;
  readOnly?: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  machineId: string;
  machineName: string;
  timestamp: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  commandBlock?: CommandBlock;
  codePreview?: CodePreviewData;
  followUps?: string[];
  streaming?: boolean;
}

export interface SessionHistory {
  id: string;
  title: string;
  machineId: string;
  machineName: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  pinned: boolean;
  summary: string;
  activeDir?: string;
}

export interface GlobalContextMemory {
  activeProject?: {
    name: string;
    path: string;
    stack: string;
    lastMachineId: string;
  };
  knownVariables: Record<string, string>;
  recentCommands: string[];
  userPreferences: {
    autoExecuteSafe: boolean;
    confirmDangerous: boolean;
    streamSpeedMs: number;
    themeMode: 'dark-editorial';
    hapticsEnabled: boolean;
    soundEffects: boolean;
  };
  notes: string[];
}
