import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import {
  Play,
  RotateCcw,
  Sparkles,
  Wifi,
  WifiOff,
  GitCommit,
  Save,
  Network,
  Users,
  AlertCircle,
} from 'lucide-react';

export const DevSimulationBar: React.FC = () => {
  const {
    addEvent,
    connectionStatus,
    setConnectionStatus,
    updateUserPresence,
    presence,
    graph,
    setGraph,
    toggleDevSimulator,
  } = useAppStore();

  const simulateFileSave = () => {
    addEvent({
      id: `evt-${Date.now()}`,
      projectId: 'contextflow-demo',
      type: 'FILE_SAVED',
      userId: 'user-ali',
      userName: 'Ali (UI Lead)',
      userAvatar: 'A',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'Saved apps/webview/src/App.tsx',
      metadata: { file: 'apps/webview/src/App.tsx' },
    });
  };

  const simulateCommit = () => {
    const randomHash = Math.random().toString(16).substring(2, 9);
    addEvent({
      id: `evt-${Date.now()}`,
      projectId: 'contextflow-demo',
      type: 'COMMIT_CREATED',
      userId: 'user-zalulu',
      userName: 'Master Zalulu',
      userAvatar: 'Z',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: 'feat(presence): optimize socket heartbeat interval',
      metadata: {
        commitHash: randomHash,
        diffSummary: { added: 12, deleted: 4 },
      },
    });
  };

  const simulateTeammateActive = () => {
    const files = [
      'backend/src/server.ts',
      'scanner/src/astParser.ts',
      'extension/src/extension.ts',
      'packages/shared/src/types.ts',
    ];
    const targetFile = files[Math.floor(Math.random() * files.length)];
    const targetMember = presence.find((p) => p.id === 'user-arch') || presence[1];

    updateUserPresence({
      ...targetMember,
      online: true,
      activeFile: targetFile,
      lastActive: 'Just now',
    });

    addEvent({
      id: `evt-${Date.now()}`,
      projectId: 'contextflow-demo',
      type: 'MEMBER_ACTIVE_FILE_CHANGED',
      userId: targetMember.id,
      userName: targetMember.name,
      userAvatar: targetMember.avatar,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: `Active editor changed to ${targetFile}`,
      metadata: { file: targetFile },
    });
  };

  const simulateArchUpdate = () => {
    if (graph) {
      const g = graph as any;
      const updatedNodes = (g.nodes || []).map((node: any) =>
        node.id === 'node-app'
          ? { ...node, data: { ...node.data, modified: !(node.data || {}).modified } }
          : node
      );
      setGraph({
        ...g,
        nodes: updatedNodes,
        summary: {
          ...(g.summary || {}),
          lastUpdated: 'Just now',
        },
      });

      addEvent({
        id: `evt-${Date.now()}`,
        projectId: 'contextflow-demo',
        type: 'ARCHITECTURE_UPDATED',
        userId: 'user-arch',
        userName: 'Graph Lead',
        userAvatar: 'G',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        description: 'Incremental AST graph updated: modified node-app dependencies',
      });
    }
  };

  return (
    <div className="bg-neu-bg border-t border-white/70 px-3.5 py-2 flex items-center justify-between text-xs select-none z-30 shadow-neu-flat-sm text-slate-800">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-indigo-600 font-bold neu-surface-sm px-2 py-0.5 rounded-lg">
          <Sparkles className="w-3 h-3 text-indigo-600" />
          Simulator:
        </span>
        <button
          onClick={simulateFileSave}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neu-btn text-[11px] text-slate-700 hover:text-slate-900 transition-all cursor-pointer font-medium"
        >
          <Save className="w-3 h-3 text-slate-500" />
          <span>Save File</span>
        </button>

        <button
          onClick={simulateCommit}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neu-btn text-[11px] text-emerald-700 hover:text-emerald-800 transition-all cursor-pointer font-medium"
        >
          <GitCommit className="w-3 h-3 text-emerald-600" />
          <span>New Commit</span>
        </button>

        <button
          onClick={simulateTeammateActive}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neu-btn text-[11px] text-indigo-700 hover:text-indigo-800 transition-all cursor-pointer font-medium"
        >
          <Users className="w-3 h-3 text-indigo-600" />
          <span>Teammate Active</span>
        </button>

        <button
          onClick={simulateArchUpdate}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neu-btn text-[11px] text-purple-700 hover:text-purple-800 transition-all cursor-pointer font-medium"
        >
          <Network className="w-3 h-3 text-purple-600" />
          <span>Toggle Pulse</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() =>
            setConnectionStatus(
              connectionStatus === 'connected'
                ? 'disconnected'
                : connectionStatus === 'disconnected'
                ? 'reconnecting'
                : 'connected'
            )
          }
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl neu-btn text-[11px] text-slate-600 hover:text-slate-900 transition-all cursor-pointer font-medium"
          title="Cycle network state"
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3 text-emerald-600" />
          ) : (
            <WifiOff className="w-3 h-3 text-rose-600" />
          )}
          <span className="capitalize">{connectionStatus}</span>
        </button>

        <button
          onClick={toggleDevSimulator}
          className="p-1.5 rounded-lg neu-btn text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          title="Hide Simulator Bar"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
