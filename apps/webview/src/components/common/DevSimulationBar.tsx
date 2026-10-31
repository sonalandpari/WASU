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
    <div className="bg-aurora-sidebar/90 border-t border-aurora-border px-3 py-1.5 flex items-center justify-between text-xs select-none">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-aurora-primary font-semibold">
          <Sparkles className="w-3 h-3 text-aurora-primary animate-pulse" />
          Dev Simulator:
        </span>
        <button
          onClick={simulateFileSave}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-[11px] text-aurora-textSecondary hover:text-aurora-primary transition-colors"
        >
          <Save className="w-3 h-3" />
          <span>Save File</span>
        </button>

        <button
          onClick={simulateCommit}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-[11px] text-aurora-textSecondary hover:text-aurora-success transition-colors"
        >
          <GitCommit className="w-3 h-3" />
          <span>New Commit</span>
        </button>

        <button
          onClick={simulateTeammateActive}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-[11px] text-aurora-textSecondary hover:text-aurora-secondaryAccent transition-colors"
        >
          <Users className="w-3 h-3" />
          <span>Teammate Editor</span>
        </button>

        <button
          onClick={simulateArchUpdate}
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-[11px] text-aurora-textSecondary hover:text-aurora-warning transition-colors"
        >
          <Network className="w-3 h-3" />
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
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-[11px] text-aurora-textMuted hover:text-aurora-textPrimary transition-colors"
          title="Cycle network state"
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3 text-aurora-success" />
          ) : (
            <WifiOff className="w-3 h-3 text-aurora-error" />
          )}
          <span className="capitalize">{connectionStatus}</span>
        </button>
      </div>
    </div>
  );
};
