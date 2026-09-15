import React, { useState, useEffect, useRef } from 'react';
import {
  RemoteMachine,
  ChatMessage,
  SessionHistory,
  GlobalContextMemory,
  CodePreviewData,
} from './types';
import {
  getSavedMachines,
  saveMachines,
  getSavedSessions,
  saveSessions,
  getSessionMessages,
  saveSessionMessages,
  getGlobalMemory,
  saveGlobalMemory,
  DEFAULT_MACHINES,
  DEFAULT_GLOBAL_MEMORY,
  INITIAL_SESSIONS,
  INITIAL_MESSAGES,
} from './lib/storage';
import { Navbar } from './components/Navbar';
import { ChatTerminal } from './components/ChatTerminal';
import { ConnectionHub } from './components/ConnectionHub';
import { ProviderConfigModal } from './components/ProviderConfigModal';
import { CodePreviewOverlay } from './components/CodePreviewOverlay';
import { SessionHistoryDrawer } from './components/SessionHistoryDrawer';
import { GlobalMemoryModal } from './components/GlobalMemoryModal';

export default function App() {
  const [machines, setMachines] = useState<RemoteMachine[]>(() => getSavedMachines());
  const [activeMachineId, setActiveMachineId] = useState<string>(() => {
    const saved = getSavedMachines();
    return saved[0]?.id || 'mach-opencode-01';
  });

  const [sessions, setSessions] = useState<SessionHistory[]>(() => getSavedSessions());
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = getSavedSessions();
    return saved[0]?.id || 'sess-init-01';
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getSessionMessages(activeSessionId)
  );

  const [globalMemory, setGlobalMemory] = useState<GlobalContextMemory>(() => getGlobalMemory());
  const [currentView, setCurrentView] = useState<'chat' | 'hub'>('chat');

  // Modal states
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<RemoteMachine | null>(null);
  const [isCodePreviewOpen, setIsCodePreviewOpen] = useState(false);
  const [activeCodePreview, setActiveCodePreview] = useState<CodePreviewData | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Streaming & Interpreting state
  const [isInterpreting, setIsInterpreting] = useState(false);
  const activeStreamsRef = useRef<Record<string, EventSource | AbortController>>({});

  // Synchronize active machine
  const activeMachine =
    machines.find((m) => m.id === activeMachineId) || machines[0] || DEFAULT_MACHINES[0];

  // Save changes to storage
  useEffect(() => {
    saveMachines(machines);
  }, [machines]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    saveSessionMessages(activeSessionId, messages);
  }, [messages, activeSessionId]);

  useEffect(() => {
    saveGlobalMemory(globalMemory);
  }, [globalMemory]);

  // When active session changes, load its messages
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setActiveMachineId(session.machineId);
    }
    const msgs = getSessionMessages(sessionId);
    setMessages(msgs);
  };

  const handleCreateNewSession = () => {
    const newId = `sess-${Date.now()}`;
    const newSession: SessionHistory = {
      id: newId,
      title: `Session with ${activeMachine.name.split(' ')[0]}`,
      machineId: activeMachine.id,
      machineName: activeMachine.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 0,
      pinned: false,
      summary: 'New conversation initiated.',
      activeDir: activeMachine.currentDir,
    };
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setActiveSessionId(newId);
    setMessages([]);
    setCurrentView('chat');
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = sessions.filter((s) => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId && updated.length > 0) {
      handleSelectSession(updated[0].id);
    }
  };

  const handleTogglePinSession = (sessionId: string) => {
    const updated = sessions.map((s) =>
      s.id === sessionId ? { ...s, pinned: !s.pinned } : s
    );
    setSessions(updated);
  };

  // Start Multi-Host Broadcast Session
  const handleStartMultiSession = (machineIds: string[]) => {
    const selectedHosts = machines.filter((m) => machineIds.includes(m.id));
    const newId = `sess-multi-${Date.now()}`;
    const newSession: SessionHistory = {
      id: newId,
      title: `Consolidated Broadcast (${selectedHosts.length} Hosts)`,
      machineId: selectedHosts[0]?.id || activeMachine.id,
      machineName: `Broadcast: ${selectedHosts.map((h) => h.name.split(' ')[0]).join(', ')}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: 1,
      pinned: true,
      summary: `Concurrent multi-node cluster session monitoring ${selectedHosts.length} development environments.`,
      activeDir: '/workspace',
    };

    const initialMsg: ChatMessage = {
      id: `msg-sys-${Date.now()}`,
      sessionId: newId,
      machineId: activeMachine.id,
      machineName: newSession.machineName,
      timestamp: Date.now(),
      role: 'system',
      content: `Established concurrent broadcast channel across ${selectedHosts.length} machines:\n${selectedHosts
        .map((h) => `• ${h.name} (${h.host})`)
        .join('\n')}\nCommands submitted in this session will target the consolidated cluster context.`,
    };

    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setMessages([initialMsg]);
    setCurrentView('chat');
  };

  // Natural Language & Raw Command processing
  const handleSendMessage = async (text: string, isRawCommand = false) => {
    const userMsgId = `msg-user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sessionId: activeSessionId,
      machineId: activeMachine.id,
      machineName: activeMachine.name,
      timestamp: Date.now(),
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);

    // If user sent a raw shell command (starts with $ or raw mode selected)
    if (isRawCommand || text.startsWith('$')) {
      const rawCmd = text.startsWith('$') ? text.slice(1).trim() : text.trim();
      const assistantMsgId = `msg-asst-${Date.now() + 1}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sessionId: activeSessionId,
        machineId: activeMachine.id,
        machineName: activeMachine.name,
        timestamp: Date.now() + 50,
        role: 'assistant',
        content: `Executing raw shell command on ${activeMachine.name}.`,
        commandBlock: {
          id: `cmd-${Date.now()}`,
          command: rawCmd,
          rawExplanation: `Direct execution against ${activeMachine.username}@${activeMachine.host}`,
          isDangerous: /rm\s+-rf|dd\s+|mkfs|drop\s+database/i.test(rawCmd),
          executionStatus: 'idle',
          outputLines: [],
          requiresConfirmation: /rm\s+-rf|dd\s+|mkfs|drop\s+database/i.test(rawCmd),
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
      // Run immediately if not dangerous
      if (!assistantMsg.commandBlock?.isDangerous) {
        handleExecuteCommand(assistantMsgId, rawCmd);
      }
      return;
    }

    // AI Natural Language Interpretation via Express Server & Gemini API
    setIsInterpreting(true);
    try {
      const recentHistory = messages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
        command: m.commandBlock?.command,
      }));

      const res = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          activeMachine,
          recentHistory,
          globalMemory,
        }),
      });

      const responseJson = await res.json();
      const aiData = responseJson.data;

      const assistantMsgId = `msg-asst-${Date.now()}`;
      let codePreview: CodePreviewData | undefined;

      if (aiData.codePreviewInfo?.hasCode) {
        codePreview = {
          id: `code-${Date.now()}`,
          title: aiData.codePreviewInfo.suggestedTitle || `${aiData.command} preview`,
          language: aiData.codePreviewInfo.language || 'typescript',
          diff: aiData.codePreviewInfo.language === 'diff',
          code: `// Remote Code Preview\n// Buffer generated for command: ${aiData.command}\n// Inspected host: ${activeMachine.name}\n\nexport const remoteConfig = {\n  host: "${activeMachine.host}",\n  environment: "${activeMachine.provider}",\n  timestamp: "${new Date().toISOString()}"\n};`,
          explanation: aiData.explanation,
        };
      }

      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        sessionId: activeSessionId,
        machineId: activeMachine.id,
        machineName: activeMachine.name,
        timestamp: Date.now(),
        role: 'assistant',
        content: aiData.thought || 'Translated request into verified remote shell execution parameters:',
        commandBlock: {
          id: `cmd-${Date.now()}`,
          command: aiData.command,
          rawExplanation: aiData.explanation,
          isDangerous: Boolean(aiData.isDangerous),
          estimatedDuration: aiData.estimatedDuration || '~1-2s',
          executionStatus: 'idle',
          outputLines: [],
          requiresConfirmation: Boolean(aiData.isDangerous || aiData.requiresConfirmation),
        },
        codePreview,
        followUps: aiData.followUps || [],
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Update session title & summary if this was first user query
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSessionId && s.messageCount <= 1) {
            return {
              ...s,
              title: text.slice(0, 36) + (text.length > 36 ? '...' : ''),
              summary: aiData.explanation || text,
              updatedAt: Date.now(),
              messageCount: s.messageCount + 2,
            };
          }
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: Date.now(),
              messageCount: s.messageCount + 2,
            };
          }
          return s;
        })
      );

      // Auto-execute safe commands if user preference enabled
      if (globalMemory.userPreferences.autoExecuteSafe && !aiData.isDangerous) {
        handleExecuteCommand(assistantMsgId, aiData.command);
      }
    } catch (err: any) {
      console.warn('AI Interpretation failed:', err);
      // Fallback message
      const fallbackMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sessionId: activeSessionId,
        machineId: activeMachine.id,
        machineName: activeMachine.name,
        timestamp: Date.now(),
        role: 'assistant',
        content: `I will run the command directly on ${activeMachine.name}:`,
        commandBlock: {
          id: `cmd-${Date.now()}`,
          command: text,
          rawExplanation: 'Direct fallback execution.',
          isDangerous: false,
          executionStatus: 'idle',
          outputLines: [],
        },
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsInterpreting(false);
    }
  };

  // Execute terminal command with streaming output
  const handleExecuteCommand = (messageId: string, command: string) => {
    // Set status to running
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.commandBlock) {
          return {
            ...m,
            commandBlock: {
              ...m.commandBlock,
              executionStatus: 'running',
              startedAt: Date.now(),
              outputLines: [
                {
                  id: `l-init-${Date.now()}`,
                  text: `[rca-ssh] Authenticating session with ${activeMachine.username}@${activeMachine.host}:${activeMachine.port}...`,
                  type: 'info',
                  timestamp: Date.now(),
                },
              ],
            },
          };
        }
        return m;
      })
    );

    // Cancel any existing stream for this message
    if (activeStreamsRef.current[messageId]) {
      const existing = activeStreamsRef.current[messageId];
      if (existing instanceof EventSource) existing.close();
      delete activeStreamsRef.current[messageId];
    }

    // Connect to SSE streaming endpoint
    const url = `/api/terminal/stream?cmd=${encodeURIComponent(command)}&machineId=${encodeURIComponent(
      activeMachine.id
    )}`;
    const eventSource = new EventSource(url);
    activeStreamsRef.current[messageId] = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        if (payload.type === 'done') {
          eventSource.close();
          delete activeStreamsRef.current[messageId];

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === messageId && m.commandBlock) {
                return {
                  ...m,
                  commandBlock: {
                    ...m.commandBlock,
                    executionStatus: 'success',
                    exitCode: payload.exitCode ?? 0,
                    completedAt: Date.now(),
                  },
                };
              }
              return m;
            })
          );
          return;
        }

        // Add line to terminal output
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === messageId && m.commandBlock) {
              const newLine = {
                id: `line-${Date.now()}-${Math.random()}`,
                text: payload.text ?? '',
                type: payload.type || 'stdout',
                timestamp: payload.timestamp || Date.now(),
              };
              return {
                ...m,
                commandBlock: {
                  ...m.commandBlock,
                  outputLines: [...m.commandBlock.outputLines, newLine],
                },
              };
            }
            return m;
          })
        );
      } catch (err) {
        console.warn('Error parsing SSE stream message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE stream error or connection closed:', err);
      eventSource.close();
      delete activeStreamsRef.current[messageId];

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId && m.commandBlock && m.commandBlock.executionStatus === 'running') {
            return {
              ...m,
              commandBlock: {
                ...m.commandBlock,
                executionStatus: 'success',
                exitCode: 0,
                completedAt: Date.now(),
              },
            };
          }
          return m;
        })
      );
    };
  };

  const handleCancelCommand = (messageId: string) => {
    if (activeStreamsRef.current[messageId]) {
      const stream = activeStreamsRef.current[messageId];
      if (stream instanceof EventSource) stream.close();
      delete activeStreamsRef.current[messageId];
    }

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId && m.commandBlock) {
          return {
            ...m,
            commandBlock: {
              ...m.commandBlock,
              executionStatus: 'cancelled',
              outputLines: [
                ...m.commandBlock.outputLines,
                {
                  id: `l-abort-${Date.now()}`,
                  text: '^C [SIGINT signal sent by operator. Process terminated.]',
                  type: 'stderr',
                  timestamp: Date.now(),
                },
              ],
            },
          };
        }
        return m;
      })
    );
  };

  const handleSaveMachine = (newMachine: RemoteMachine) => {
    const existingIndex = machines.findIndex((m) => m.id === newMachine.id);
    if (existingIndex >= 0) {
      const updated = [...machines];
      updated[existingIndex] = newMachine;
      setMachines(updated);
    } else {
      setMachines([...machines, newMachine]);
      setActiveMachineId(newMachine.id);
    }
  };

  const handleDeleteMachine = (id: string) => {
    const updated = machines.filter((m) => m.id !== id);
    setMachines(updated);
    if (activeMachineId === id && updated.length > 0) {
      setActiveMachineId(updated[0].id);
    }
  };

  const handleRefreshStatuses = async () => {
    const updated = await Promise.all(
      machines.map(async (m) => {
        try {
          const res = await fetch('/api/machines/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ host: m.host, port: m.port }),
          });
          const data = await res.json();
          return {
            ...m,
            status: 'online' as const,
            latencyMs: data.latencyMs,
            lastConnected: 'Just now',
          };
        } catch {
          return m;
        }
      })
    );
    setMachines(updated);
  };

  const handleResetVault = () => {
    localStorage.clear();
    setMachines(DEFAULT_MACHINES);
    setActiveMachineId(DEFAULT_MACHINES[0].id);
    setSessions(INITIAL_SESSIONS);
    setActiveSessionId(INITIAL_SESSIONS[0].id);
    setMessages(INITIAL_MESSAGES[INITIAL_SESSIONS[0].id] || []);
    setGlobalMemory(DEFAULT_GLOBAL_MEMORY);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#1A1208] text-[#F5EFEB] overflow-hidden select-none font-serif">
      {/* Editorial Top Navigation */}
      <Navbar
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenMemory={() => setIsMemoryOpen(true)}
        onOpenNewMachine={() => {
          setEditingMachine(null);
          setIsConfigOpen(true);
        }}
        activeMachineName={activeMachine.name}
        onlineCount={machines.filter((m) => m.status === 'online').length}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentView === 'chat' ? (
          <ChatTerminal
            machine={activeMachine}
            allMachines={machines}
            messages={messages}
            globalMemory={globalMemory}
            onSendMessage={handleSendMessage}
            onExecuteCommand={handleExecuteCommand}
            onCancelCommand={handleCancelCommand}
            onSelectMachine={(id) => setActiveMachineId(id)}
            onOpenCodePreview={(preview) => {
              setActiveCodePreview(preview);
              setIsCodePreviewOpen(true);
            }}
            onOpenHistory={() => setIsHistoryOpen(true)}
            onOpenMemory={() => setIsMemoryOpen(true)}
            isInterpreting={isInterpreting}
          />
        ) : (
          <ConnectionHub
            machines={machines}
            activeMachineId={activeMachineId}
            onSelectMachine={(id) => {
              setActiveMachineId(id);
              setCurrentView('chat');
            }}
            onOpenConfig={(mach) => {
              setEditingMachine(mach || null);
              setIsConfigOpen(true);
            }}
            onRefreshStatuses={handleRefreshStatuses}
            onStartMultiSession={handleStartMultiSession}
          />
        )}
      </main>

      {/* Provider Configuration Modal */}
      <ProviderConfigModal
        isOpen={isConfigOpen}
        machine={editingMachine}
        onClose={() => setIsConfigOpen(false)}
        onSave={handleSaveMachine}
        onDelete={handleDeleteMachine}
      />

      {/* Code Preview Overlay */}
      {isCodePreviewOpen && activeCodePreview && (
        <CodePreviewOverlay
          data={activeCodePreview}
          onClose={() => setIsCodePreviewOpen(false)}
          onAskAI={(query) => {
            handleSendMessage(`Explain this code: ${query}`, false);
            setIsCodePreviewOpen(false);
          }}
        />
      )}

      {/* Session History Drawer */}
      <SessionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        machines={machines}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onCreateNewSession={handleCreateNewSession}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
      />

      {/* Global AI Memory & Vault Modal */}
      <GlobalMemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memory={globalMemory}
        machines={machines}
        onSaveMemory={(updated) => setGlobalMemory(updated)}
        onResetVault={handleResetVault}
      />
    </div>
  );
}
