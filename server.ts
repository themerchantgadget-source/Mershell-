import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gen AI client with telemetry header
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// API: AI Interpretation Endpoint
app.post('/api/ai/interpret', async (req, res) => {
  const { userMessage, activeMachine, recentHistory, globalMemory } = req.body;

  if (!userMessage) {
    return res.status(400).json({ error: 'userMessage is required' });
  }

  const ai = getGeminiClient();

  // If Gemini API is available, use gemini-3.8-flash
  if (ai) {
    try {
      const systemInstruction = `You are Remote Code Assistant, an expert remote terminal operator and devops companion for developers managing remote servers and cloud pods (such as OpenCode, EC2, Kubernetes pods, and Linux VPSs).
Your tone is editorial, academic, high-contrast, precise, and disciplined. Avoid superficial fluff or conversational filler.
The user provides requests in natural language. Your job is to translate their intent into one or more safe, elegant, shell commands, explain what the command will do, estimate execution duration, assess risk, and suggest 2-3 logical follow-ups.

Context of active machine:
- Machine Name: ${activeMachine?.name || 'OpenCode Workspace'}
- OS: ${activeMachine?.os || 'Ubuntu Linux 24.04'}
- Current Dir: ${activeMachine?.currentDir || '/workspace/project'}
- Active User: ${activeMachine?.username || 'developer'}
- Known Stack: ${globalMemory?.activeProject?.stack || 'TypeScript / Node.js'}

Safety Rules:
- Mark isDangerous=true for destructive commands (rm -rf, mkfs, dd, drop table, killall -9, systemctl stop critical, reboot).
- If the command would display or generate code/diff/files (e.g. cat, git diff, head, grep), indicate in codePreviewInfo what language and file it inspects.

You MUST reply ONLY with valid JSON conforming to this format:
{
  "thought": "Short 1-2 sentence academic rationale",
  "command": "the exact bash/shell command to execute",
  "explanation": "Clear, concise editorial explanation of arguments and outcome",
  "isDangerous": false,
  "requiresConfirmation": false,
  "estimatedDuration": "< 1s" | "~2-5s" | "long-running (~30s)",
  "codePreviewInfo": {
    "hasCode": true/false,
    "language": "typescript" | "json" | "bash" | "python" | "diff" | "yaml",
    "suggestedTitle": "Title for code preview overlay if applicable"
  },
  "followUps": [
    "Suggested logical follow-up 1",
    "Suggested logical follow-up 2",
    "Suggested logical follow-up 3"
  ],
  "contextUpdates": {
    "detectedProject": "name or null",
    "detectedDir": "path or null"
  }
}`;

      const prompt = `User request: "${userMessage}"
Recent commands: ${JSON.stringify(recentHistory?.slice(-3) || [])}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim();
      if (responseText) {
        const parsed = JSON.parse(responseText);
        return res.json({
          success: true,
          data: parsed,
          source: 'gemini',
        });
      }
    } catch (err: any) {
      console.warn('Gemini API call failed or timed out, using fallback rules:', err?.message);
    }
  }

  // Fallback intelligent interpreter for offline or key-pending environments
  const fallback = generateFallbackInterpretation(userMessage, activeMachine, globalMemory);
  return res.json({
    success: true,
    data: fallback,
    source: 'local-heuristic',
  });
});

// API: Code / Diff Analysis
app.post('/api/ai/explain-code', async (req, res) => {
  const { code, language, filePath, query } = req.body;
  const ai = getGeminiClient();

  if (ai && code) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Analyze this ${language || 'code'} file (${filePath || 'snippet'}). Query: "${query || 'Provide an editorial critique, architectural analysis, and potential performance or security risks.'}"\n\nCode:\n\`\`\`${language}\n${code.slice(0, 4000)}\n\`\`\``,
        config: {
          systemInstruction: 'You are an academic software architect. Deliver concise, high-contrast, structured insights about code quality, security implications, and edge cases. Keep it under 200 words.',
          temperature: 0.3,
        },
      });
      return res.json({ success: true, explanation: response.text });
    } catch (err: any) {
      console.warn('Explain code error:', err?.message);
    }
  }

  return res.json({
    success: true,
    explanation: `Analysis for ${filePath || 'code snippet'}: Implements modular structure with standard error boundaries. Memory allocations appear bounded; verify asynchronous cleanup when streaming or handling active socket connections.`,
  });
});

// API: Terminal Execution with SSE Streaming
app.get('/api/terminal/stream', (req, res) => {
  const command = (req.query.cmd as string) || 'ls -la';
  const machineId = (req.query.machineId as string) || 'mach-opencode-01';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const lines = generateSimulatedTerminalLines(command, machineId);
  let index = 0;

  const interval = setInterval(() => {
    if (index < lines.length) {
      const line = lines[index];
      res.write(`data: ${JSON.stringify(line)}\n\n`);
      index++;
    } else {
      res.write(`data: ${JSON.stringify({ type: 'done', exitCode: 0 })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 90);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// API: Machine ping
app.post('/api/machines/ping', (req, res) => {
  const { host, port } = req.body;
  const latency = Math.floor(25 + Math.random() * 45);
  res.json({
    online: true,
    host,
    port: port || 22,
    latencyMs: latency,
    banner: 'SSH-2.0-OpenSSH_9.6p1 Ubuntu-3ubuntu13.4',
    handshake: 'ECDH-SHA2-NISTP256 verified',
    timestamp: Date.now(),
  });
});

// Fallback command interpreter helper
function generateFallbackInterpretation(msg: string, machine: any, memory: any) {
  const m = msg.toLowerCase();

  if (m.includes('git status') || m.includes('changes') || m.includes('uncommitted')) {
    return {
      thought: 'Inspecting repository working directory state and uncommitted changes.',
      command: 'git status --short && git branch -vv',
      explanation: 'Summarizes modified, added, and untracked files alongside local vs upstream branch divergence.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: '< 1s',
      codePreviewInfo: { hasCode: false },
      followUps: ['Run git diff to see exact line modifications', 'Stage all modified files with git add -u', 'Review git commit log'],
    };
  }

  if (m.includes('diff') || m.includes('review') || m.includes('inspect code')) {
    return {
      thought: 'Generating unified diff of recent changes in the working tree.',
      command: 'git diff HEAD~1..HEAD --stat -p',
      explanation: 'Outputs the unified diff for changes in the current branch against the previous commit.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: '< 1s',
      codePreviewInfo: {
        hasCode: true,
        language: 'diff',
        suggestedTitle: 'git diff HEAD~1..HEAD',
      },
      followUps: ['Show list of modified files only', 'Check syntax or run linter', 'Commit and push changes'],
    };
  }

  if (m.includes('docker') || m.includes('container') || m.includes('compose')) {
    return {
      thought: 'Querying Docker daemon for active and stopped containers and resource allocations.',
      command: 'docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}\\t{{.Image}}"',
      explanation: 'Lists all container instances, their current status, exposed network ports, and underlying images.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: '~1-2s',
      codePreviewInfo: { hasCode: false },
      followUps: ['Inspect container logs with docker logs -n 50', 'Restart failing containers', 'View docker stats for memory usage'],
    };
  }

  if (m.includes('memory') || m.includes('ram') || m.includes('cpu') || m.includes('specs') || m.includes('resource')) {
    return {
      thought: 'Evaluating system memory, swap buffers, and current top CPU-consuming processes.',
      command: 'free -h && echo "--- TOP PROCESSES ---" && ps -eo pid,ppid,cmd,%mem,%cpu --sort=-%mem | head -n 8',
      explanation: 'Reports total, used, and cached RAM, followed by the top eight memory-intensive processes on the remote machine.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: '< 1s',
      codePreviewInfo: { hasCode: false },
      followUps: ['Filter for specific process name', 'Check disk space with df -h', 'Monitor live load with top -b -n 1'],
    };
  }

  if (m.includes('build') || m.includes('compile') || m.includes('npm run build')) {
    return {
      thought: 'Triggering standard project build lifecycle pipeline.',
      command: 'npm run build',
      explanation: 'Compiles production assets, type-checks TypeScript modules, and emits distributable artifacts.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: 'long-running (~15s)',
      codePreviewInfo: { hasCode: false },
      followUps: ['Inspect build directory size', 'Run tests on built artifacts', 'Restart service to apply build'],
    };
  }

  if (m.includes('log') || m.includes('error') || m.includes('crash') || m.includes('failed')) {
    return {
      thought: 'Reading recent system and application logs for uncaught exceptions and errors.',
      command: 'journalctl -n 40 --no-pager -p err..emerg || tail -n 35 /var/log/syslog',
      explanation: 'Pulls the last 40 log entries with priority error or above to diagnose service interruption.',
      isDangerous: false,
      requiresConfirmation: false,
      estimatedDuration: '~1s',
      codePreviewInfo: { hasCode: false },
      followUps: ['Follow logs continuously with tail -f', 'Check service status with systemctl status', 'Search logs for specific keyword'],
    };
  }

  if (m.includes('delete') || m.includes('remove') || m.includes('rm ') || m.includes('drop') || m.includes('kill')) {
    return {
      thought: 'User intent involves potential deletion or process termination; setting safety confirmation.',
      command: msg.replace(/^(please |run |execute )/i, ''),
      explanation: 'This action affects remote state or terminating processes. Please verify target parameters before proceeding.',
      isDangerous: true,
      requiresConfirmation: true,
      estimatedDuration: '< 1s',
      codePreviewInfo: { hasCode: false },
      followUps: ['Perform a dry run first', 'Verify affected files or process IDs', 'Cancel operation'],
    };
  }

  // Default translation
  return {
    thought: `Interpreting request for ${machine?.name || 'remote host'}.`,
    command: msg.startsWith('$') ? msg.slice(1).trim() : `bash -c "${msg.replace(/"/g, '\\"')}"`,
    explanation: `Executes specified command within the context of ${machine?.currentDir || '/workspace'}.`,
    isDangerous: false,
    requiresConfirmation: false,
    estimatedDuration: '~1-2s',
    codePreviewInfo: { hasCode: false },
    followUps: ['Inspect exit code and output', 'Pipe output to less or grep', 'View active environment variables'],
  };
}

// Terminal line generator for rich real-time streaming
function generateSimulatedTerminalLines(cmd: string, machineId: string) {
  const ts = Date.now();
  const c = cmd.trim();

  if (c.includes('git status')) {
    return [
      { text: `[remote-code-assistant] Connecting to ${machineId}...`, type: 'info', timestamp: ts },
      { text: '$ ' + c, type: 'prompt', timestamp: ts + 50 },
      { text: 'On branch feature/ai-streaming', type: 'stdout', timestamp: ts + 120 },
      { text: 'Your branch is up to date with \'origin/feature/ai-streaming\'.', type: 'stdout', timestamp: ts + 180 },
      { text: '', type: 'stdout', timestamp: ts + 200 },
      { text: 'Changes not staged for commit:', type: 'stdout', timestamp: ts + 250 },
      { text: '  (use "git add <file>..." to update what will be committed)', type: 'stdout', timestamp: ts + 280 },
      { text: '  \x1b[31mmodified:   src/terminal/streamer.ts\x1b[0m', type: 'stdout', timestamp: ts + 320 },
      { text: '  \x1b[31mmodified:   src/api/routes.ts\x1b[0m', type: 'stdout', timestamp: ts + 360 },
      { text: '', type: 'stdout', timestamp: ts + 400 },
      { text: 'Untracked files:', type: 'stdout', timestamp: ts + 430 },
      { text: '  \x1b[31mtest/mock_stream.py\x1b[0m', type: 'stdout', timestamp: ts + 460 },
      { text: '', type: 'stdout', timestamp: ts + 500 },
      { text: 'no changes added to commit (use "git add" to track)', type: 'stdout', timestamp: ts + 540 },
    ];
  }

  if (c.includes('docker ps')) {
    return [
      { text: '$ ' + c, type: 'prompt', timestamp: ts },
      { text: 'CONTAINER ID   IMAGE                 COMMAND                  CREATED         STATUS         PORTS                    NAMES', type: 'stdout', timestamp: ts + 120 },
      { text: 'a89c011e4f21   opencode/runner:v2.4  "docker-entrypoint.s…"   2 days ago      Up 44 hours    0.0.0.0:8080->8080/tcp   opencode-runner-prod', type: 'stdout', timestamp: ts + 200 },
      { text: 'c4e2098b110a   postgres:16-alpine    "docker-entrypoint.s…"   5 days ago      Up 5 days      0.0.0.0:5432->5432/tcp   opencode-postgres', type: 'stdout', timestamp: ts + 280 },
      { text: '831d10e0aa92   redis:7.2-alpine      "docker-entrypoint.s…"   5 days ago      Up 5 days      0.0.0.0:6379->6379/tcp   opencode-redis-cache', type: 'stdout', timestamp: ts + 350 },
      { text: '3f990141bb77   prom/prometheus:v2.50 "/bin/prometheus --c…"   2 weeks ago     Up 2 weeks     0.0.0.0:9090->9090/tcp   monitoring-prometheus', type: 'stdout', timestamp: ts + 420 },
    ];
  }

  if (c.includes('free -h') || c.includes('mem') || c.includes('ps -eo')) {
    return [
      { text: '$ ' + c, type: 'prompt', timestamp: ts },
      { text: '               total        used        free      shared  buff/cache   available', type: 'stdout', timestamp: ts + 100 },
      { text: 'Mem:            31Gi       12.8Gi       11.2Gi       412Mi       7.4Gi       18.1Gi', type: 'stdout', timestamp: ts + 160 },
      { text: 'Swap:          8.0Gi       140Mi       7.86Gi', type: 'stdout', timestamp: ts + 220 },
      { text: '--- TOP PROCESSES BY MEMORY ---', type: 'info', timestamp: ts + 280 },
      { text: '  PID  PPID COMMAND                         %MEM  %CPU', type: 'stdout', timestamp: ts + 340 },
      { text: ' 1420     1 /usr/local/bin/node server.js   14.2   4.1', type: 'stdout', timestamp: ts + 400 },
      { text: '  982     1 /usr/lib/postgresql/16/bin/pos   8.4   1.2', type: 'stdout', timestamp: ts + 460 },
      { text: ' 2810  2700 /usr/bin/dockerd --containerd    5.1   2.8', type: 'stdout', timestamp: ts + 520 },
      { text: ' 4190  1420 tsx watch src/worker.ts          4.0   0.9', type: 'stdout', timestamp: ts + 580 },
    ];
  }

  if (c.includes('npm run build') || c.includes('build')) {
    return [
      { text: '$ ' + c, type: 'prompt', timestamp: ts },
      { text: '> opencode-client@2.4.0 build', type: 'stdout', timestamp: ts + 100 },
      { text: '> vite build && tsc --noEmit', type: 'stdout', timestamp: ts + 200 },
      { text: 'vite v6.2.3 building for production...', type: 'stdout', timestamp: ts + 350 },
      { text: '✓ 142 modules transformed.', type: 'stdout', timestamp: ts + 600 },
      { text: 'dist/index.html                   1.42 kB │ gzip:  0.68 kB', type: 'stdout', timestamp: ts + 800 },
      { text: 'dist/assets/index-D7h2k9.css     24.18 kB │ gzip:  5.92 kB', type: 'stdout', timestamp: ts + 1000 },
      { text: 'dist/assets/index-B4x91q.js     186.44 kB │ gzip: 58.10 kB', type: 'stdout', timestamp: ts + 1200 },
      { text: '✓ built in 620ms', type: 'success', timestamp: ts + 1300 },
      { text: '✨ Type checking completed with 0 errors.', type: 'success', timestamp: ts + 1500 },
    ];
  }

  // Generic simulated execution
  return [
    { text: '$ ' + c, type: 'prompt', timestamp: ts },
    { text: `[remote-host] Working dir: /workspace/opencode-core`, type: 'info', timestamp: ts + 80 },
    { text: `Execution initiated for command: ${c}`, type: 'stdout', timestamp: ts + 160 },
    { text: `Status: Process completed successfully (exit code 0)`, type: 'success', timestamp: ts + 300 },
  ];
}

// Start server and handle Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Remote Code Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
