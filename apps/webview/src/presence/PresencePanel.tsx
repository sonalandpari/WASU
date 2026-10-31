import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { vsCodeBridge } from '../services/vscodeBridge';
import { Users, FileCode, Circle, Clock } from 'lucide-react';

export const PresencePanel: React.FC = () => {
  const { presence } = useAppStore();

  const handleOpenFile = (path: string) => {
    vsCodeBridge.postMessage({
      type: 'OPEN_FILE',
      payload: { path },
    });
  };

  const onlineList = presence.filter((p) => p.online);
  const offlineList = presence.filter((p) => !p.online);

  return (
    <div className="w-64 bg-aurora-secondary border-l border-aurora-border flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-aurora-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-aurora-primary" />
          <span className="text-xs font-semibold text-aurora-textPrimary">Team Presence</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-aurora-card border border-aurora-border text-aurora-textMuted font-mono">
          {onlineList.length} / {presence.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Active Members */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-aurora-textMuted font-semibold mb-2">
            Online ({onlineList.length})
          </div>
          <div className="space-y-1.5">
            {onlineList.map((member) => (
              <div
                key={member.id}
                className="p-2 rounded-md bg-aurora-card/60 hover:bg-aurora-card border border-aurora-border/60 hover:border-aurora-border transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-aurora-secondary border border-aurora-border flex items-center justify-center text-[10px] font-bold text-aurora-primary">
                        {member.avatar || member.name[0]}
                      </div>
                      <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-aurora-success ring-1 ring-aurora-card" />
                    </div>
                    <span className="text-xs font-medium text-aurora-textPrimary truncate">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-aurora-textMuted font-mono">
                    {member.lastActive}
                  </span>
                </div>

                {member.activeFile && (
                  <button
                    onClick={() => handleOpenFile(member.activeFile!)}
                    className="w-full flex items-center gap-1.5 mt-1.5 px-1.5 py-1 rounded bg-aurora-secondary/70 hover:bg-aurora-secondary text-[11px] text-aurora-textSecondary hover:text-aurora-primary font-mono transition-colors text-left truncate group/file"
                    title={`Open ${member.activeFile} in VS Code`}
                  >
                    <FileCode className="w-3 h-3 text-aurora-textMuted group-hover/file:text-aurora-primary shrink-0" />
                    <span className="truncate">{member.activeFile}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Offline Members */}
        {offlineList.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-aurora-textMuted font-semibold mb-2">
              Offline ({offlineList.length})
            </div>
            <div className="space-y-1.5">
              {offlineList.map((member) => (
                <div
                  key={member.id}
                  className="p-2 rounded-md bg-aurora-card/30 border border-aurora-border/40 opacity-70"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-aurora-card border border-aurora-border flex items-center justify-center text-[10px] font-medium text-aurora-textMuted">
                        {member.avatar || member.name[0]}
                      </div>
                      <span className="text-xs text-aurora-textSecondary truncate">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-aurora-textMuted font-mono">
                      {member.lastActive}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
