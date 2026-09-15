import { RemoteMachine, SessionHistory, ChatMessage, GlobalContextMemory } from '../types';

const STORAGE_KEYS = {
  MACHINES: 'rca_machines_v1',
  SESSIONS: 'rca_sessions_v1',
  ACTIVE_SESSION: 'rca_active_session_id',
  ACTIVE_MACHINE: 'rca_active_machine_id',
  MESSAGES_PREFIX: 'rca_messages_',
  GLOBAL_MEMORY: 'rca_global_memory_v1',
  SECURITY_SALT: 'rca_local_salt_v1',
};

// Default starter machines
export const DEFAULT_MACHINES: RemoteMachine[] = [
  {
    id: 'mach-opencode-01',
    name: 'OpenCode Workspace (DevPod-Alpha)',
    provider: 'opencode',
    host: 'pod-8924.opencode.dev',
    port: 2222,
    username: 'developer',
    authType: 'key',
    privateKeyEncrypted: '-----BEGIN OPENSSH PRIVATE KEY-----\n[ENCRYPTED_LOCAL_KEY_BLOB_RSA_4096]\n-----END OPENSSH PRIVATE KEY-----',
    status: 'online',
    latencyMs: 38,
    lastConnected: 'Just now',
    os: 'Ubuntu 24.04.1 LTS (Noble Numbat - Linux 6.8)',
    currentDir: '/workspace/opencode-core',
    activeProcesses: 4,
    specs: {
      cpuCores: 8,
      cpuUsagePercent: 24,
      ramGb: 32,
      ramUsagePercent: 41,
      diskGb: 128,
      diskUsagePercent: 35,
      uptime: '14d 6h 22m',
    },
    envVariables: {
      NODE_ENV: 'development',
      PORT: '8080',
      DATABASE_URL: 'postgres://localhost:5432/opencode_dev',
    },
    tags: ['OpenCode', 'Primary Dev', 'Node.js', 'Docker'],
  },
  {
    id: 'mach-aws-prod-02',
    name: 'AWS EC2 API Gateway (eu-west-1)',
    provider: 'aws',
    host: 'ec2-54-194-22-10.eu-west-1.compute.amazonaws.com',
    port: 22,
    username: 'ec2-user',
    authType: 'key',
    privateKeyEncrypted: '-----BEGIN RSA PRIVATE KEY-----\n[ENCRYPTED_LOCAL_KEY_AWS_PEM]\n-----END RSA PRIVATE KEY-----',
    status: 'online',
    latencyMs: 74,
    lastConnected: '2 hours ago',
    os: 'Amazon Linux 2023 (Linux 6.1)',
    currentDir: '/srv/api-gateway',
    activeProcesses: 12,
    specs: {
      cpuCores: 4,
      cpuUsagePercent: 62,
      ramGb: 16,
      ramUsagePercent: 78,
      diskGb: 80,
      diskUsagePercent: 58,
      uptime: '42d 18h 10m',
    },
    envVariables: {
      NODE_ENV: 'production',
      AWS_REGION: 'eu-west-1',
    },
    tags: ['AWS', 'Production', 'Kubernetes', 'FastAPI'],
  },
  {
    id: 'mach-hetzner-staging-03',
    name: 'Hetzner Dedicated Staging (CPX31)',
    provider: 'hetzner',
    host: '159.69.112.44',
    port: 2200,
    username: 'deploy',
    authType: 'password',
    passwordEncrypted: 'U2FsdGVkX1+StagingPassKeyHash#4829',
    status: 'offline',
    latencyMs: 0,
    lastConnected: 'Yesterday',
    os: 'Debian GNU/Linux 12 (Bookworm)',
    currentDir: '/opt/staging-services',
    activeProcesses: 0,
    specs: {
      cpuCores: 4,
      cpuUsagePercent: 0,
      ramGb: 8,
      ramUsagePercent: 12,
      diskGb: 160,
      diskUsagePercent: 44,
      uptime: 'Offline',
    },
    envVariables: {
      ENV: 'staging',
    },
    tags: ['Hetzner', 'Staging', 'PostgreSQL', 'Redis'],
  },
];

export const DEFAULT_GLOBAL_MEMORY: GlobalContextMemory = {
  activeProject: {
    name: 'opencode-core',
    path: '/workspace/opencode-core',
    stack: 'TypeScript / Node.js / Docker',
    lastMachineId: 'mach-opencode-01',
  },
  knownVariables: {
    APP_PORT: '8080',
    SERVICE_NAME: 'remote-runner',
    GIT_BRANCH: 'feature/ai-streaming',
  },
  recentCommands: [
    'git status -s',
    'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    'npm run build',
    'tail -n 25 /var/log/nginx/error.log',
  ],
  userPreferences: {
    autoExecuteSafe: false,
    confirmDangerous: true,
    streamSpeedMs: 35,
    themeMode: 'dark-editorial',
    hapticsEnabled: true,
    soundEffects: false,
  },
  notes: [
    'Always run "npm test" before triggering container build on DevPod-Alpha.',
    'Port 8080 is mapped to internal ingress proxy on OpenCode.',
  ],
};

export const INITIAL_SESSIONS: SessionHistory[] = [
  {
    id: 'sess-init-01',
    title: 'Cluster Health & Git Sync',
    machineId: 'mach-opencode-01',
    machineName: 'OpenCode Workspace (DevPod-Alpha)',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000,
    messageCount: 4,
    pinned: true,
    summary: 'Inspected git diffs, checked docker daemon status, and validated build outputs.',
    activeDir: '/workspace/opencode-core',
  },
  {
    id: 'sess-init-02',
    title: 'Nginx Ingress Log Investigation',
    machineId: 'mach-aws-prod-02',
    machineName: 'AWS EC2 API Gateway (eu-west-1)',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000 + 1800000,
    messageCount: 3,
    pinned: false,
    summary: 'Audited upstream 502 responses in Nginx access logs and checked worker memory.',
    activeDir: '/srv/api-gateway',
  },
];

export const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'sess-init-01': [
    {
      id: 'msg-01',
      sessionId: 'sess-init-01',
      machineId: 'mach-opencode-01',
      machineName: 'OpenCode Workspace (DevPod-Alpha)',
      timestamp: Date.now() - 3600000 * 2,
      role: 'user',
      content: 'Check the repository status and tell me what uncommitted changes we have.',
    },
    {
      id: 'msg-02',
      sessionId: 'sess-init-01',
      machineId: 'mach-opencode-01',
      machineName: 'OpenCode Workspace (DevPod-Alpha)',
      timestamp: Date.now() - 3600000 * 2 + 1500,
      role: 'assistant',
      content: 'I will query the git status and show modified files in the working directory.',
      commandBlock: {
        id: 'cmd-01',
        command: 'git status --short && git branch -v',
        rawExplanation: 'Queries git index for uncommitted modifications and current branch commit hash.',
        isDangerous: false,
        estimatedDuration: '< 1s',
        executionStatus: 'success',
        exitCode: 0,
        startedAt: Date.now() - 3600000 * 2 + 1600,
        completedAt: Date.now() - 3600000 * 2 + 2100,
        outputLines: [
          { id: 'l1', text: '## feature/ai-streaming...origin/feature/ai-streaming [ahead 1]', type: 'stdout', timestamp: Date.now() - 3600000 * 2 + 1700 },
          { id: 'l2', text: ' M src/terminal/streamer.ts', type: 'stdout', timestamp: Date.now() - 3600000 * 2 + 1800 },
          { id: 'l3', text: ' M src/api/routes.ts', type: 'stdout', timestamp: Date.now() - 3600000 * 2 + 1900 },
          { id: 'l4', text: '?? test/mock_stream.py', type: 'stdout', timestamp: Date.now() - 3600000 * 2 + 2000 },
        ],
      },
      codePreview: {
        id: 'code-01',
        title: 'src/terminal/streamer.ts (diff preview)',
        filePath: 'src/terminal/streamer.ts',
        language: 'typescript',
        diff: true,
        code: `@@ -18,7 +18,9 @@ export class TerminalStreamer {
   private buffer: string[] = [];
   
   public pipeChunk(data: Buffer) {
-    this.emit('data', data.toString('utf-8'));
+    const text = data.toString('utf-8');
+    this.buffer.push(text);
+    this.emit('chunk', { payload: text, timestamp: Date.now() });
   }
 }`,
        explanation: 'Shows chunk buffering added to the terminal socket streaming class.',
      },
      followUps: [
        'Run git diff on src/terminal/streamer.ts',
        'Run test suite to verify changes',
        'Commit changes with message',
      ],
    },
  ],
};

// Safe local storage helpers
export function getSavedMachines(): RemoteMachine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(DEFAULT_MACHINES));
      return DEFAULT_MACHINES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_MACHINES;
  }
}

export function saveMachines(machines: RemoteMachine[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
  } catch (err) {
    console.warn('Failed to save machines locally:', err);
  }
}

export function getSavedSessions(): SessionHistory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(INITIAL_SESSIONS));
      return INITIAL_SESSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SESSIONS;
  }
}

export function saveSessions(sessions: SessionHistory[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save sessions locally:', err);
  }
}

export function getSessionMessages(sessionId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MESSAGES_PREFIX + sessionId);
    if (!raw) {
      if (INITIAL_MESSAGES[sessionId]) {
        localStorage.setItem(
          STORAGE_KEYS.MESSAGES_PREFIX + sessionId,
          JSON.stringify(INITIAL_MESSAGES[sessionId])
        );
        return INITIAL_MESSAGES[sessionId];
      }
      return [];
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MESSAGES[sessionId] || [];
  }
}

export function saveSessionMessages(sessionId: string, messages: ChatMessage[]): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.MESSAGES_PREFIX + sessionId,
      JSON.stringify(messages)
    );
  } catch (err) {
    console.warn('Failed to save messages locally:', err);
  }
}

export function getGlobalMemory(): GlobalContextMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GLOBAL_MEMORY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_MEMORY, JSON.stringify(DEFAULT_GLOBAL_MEMORY));
      return DEFAULT_GLOBAL_MEMORY;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_GLOBAL_MEMORY;
  }
}

export function saveGlobalMemory(memory: GlobalContextMemory): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GLOBAL_MEMORY, JSON.stringify(memory));
  } catch (err) {
    console.warn('Failed to save global memory locally:', err);
  }
}
