import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { vsCodeBridge } from '../services/vscodeBridge';
import { Users, FileCode, X } from 'lucide-react';

export const PresencePanel: React.FC = () => {
  const { presence, togglePresencePanel } = useAppStore();

  const handleOpenFile = (path: string) => {
    vsCodeBridge.postMessage({
      type: 'OPEN_FILE',
      payload: { path },
    });
  };

  const onlineList = presence.filter((p) => p.online);
  const offlineList = presence.filter((p) => !p.online);

  return (
    <aside className="w-64 bg-zinc-950/80 backdrop-blur border-l border-aurora-border flex flex-col h-full select-none shrink-0 z-10">
      <div className="px-3 py-2.5 border-b border-aurora-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-medium text-zinc-200">Team Presence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/[0.04] border border-white/[0.06] text-zinc-400 font-mono">
            {onlineList.length} / {presence.length}
          </span>
          <button
            onClick={togglePresencePanel}
            className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Active Members */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-2 px-1">
            Online ({onlineList.length})
          </div>
          <div className="space-y-1">
            {onlineList.map((member) => (
              <div
                key={member.id}
                className="p-2 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/70 border border-white/[0.04] hover:border-white/[0.08] transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <div className="w-5 h-5 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[9px] font-bold text-zinc-200">
                        {member.avatar || member.name[0]}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-zinc-950" />
                    </div>
                    <span className="text-xs font-medium text-zinc-200 truncate">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {member.lastActive}
                  </span>
                </div>

                {member.activeFile && (
                  <button
                    onClick={() => handleOpenFile(member.activeFile!)}
                    className="w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors mt-1 font-mono text-left truncate group/file"
                  >
                    <FileCode className="w-3 h-3 text-zinc-500 shrink-0 group-hover/file:text-zinc-300" />
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
            <div className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold mb-2 px-1">
              Offline ({offlineList.length})
            </div>
            <div className="space-y-1">
              {offlineList.map((member) => (
                <div
                  key={member.id}
                  className="p-2 rounded-lg bg-transparent hover:bg-zinc-900/20 border border-transparent hover:border-white/[0.04] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-zinc-800/60 border border-white/[0.04] flex items-center justify-center text-[9px] text-zinc-500">
                        {member.avatar || member.name[0]}
                      </div>
                      <span className="text-xs text-zinc-400 truncate">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-600 font-mono">
                      {member.lastActive}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
