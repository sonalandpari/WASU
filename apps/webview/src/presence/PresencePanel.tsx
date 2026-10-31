import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { vsCodeBridge } from '../services/vscodeBridge';
import { Users, FileCode, X } from 'lucide-react';
import { UserAvatar } from '../components/common/UserAvatar';

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
    <aside className="w-64 bg-neu-bg border-l border-white/70 shadow-neu-flat flex flex-col h-full select-none shrink-0 z-10">
      <div className="px-3.5 py-3 border-b border-white/60 flex items-center justify-between bg-neu-bg">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">Team Presence</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2 py-0.5 rounded-full neu-surface-sm text-slate-700 font-mono font-bold">
            {onlineList.length} / {presence.length}
          </span>
          <button
            onClick={togglePresencePanel}
            className="p-1 rounded-lg neu-btn text-slate-400 hover:text-slate-700 transition-colors"
            title="Close Panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Active Members */}
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 px-1">
            Online ({onlineList.length})
          </div>
          <div className="space-y-2">
            {onlineList.map((member) => (
              <div
                key={member.id}
                className="p-2.5 rounded-xl neu-surface-sm transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative">
                      <UserAvatar name={member.name} avatar={member.avatar} size="sm" />
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {member.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {member.lastActive}
                  </span>
                </div>

                {member.activeFile && (
                  <button
                    onClick={() => handleOpenFile(member.activeFile!)}
                    className="w-full flex items-center gap-1.5 px-2 py-1 rounded-lg neu-input text-[10px] text-slate-600 hover:text-indigo-600 transition-colors mt-1.5 font-mono text-left truncate group/file"
                  >
                    <FileCode className="w-3 h-3 text-slate-400 shrink-0 group-hover/file:text-indigo-600" />
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
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 px-1">
              Offline ({offlineList.length})
            </div>
            <div className="space-y-1.5">
              {offlineList.map((member) => (
                <div
                  key={member.id}
                  className="p-2 rounded-xl border border-transparent hover:neu-surface-sm transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserAvatar name={member.name} avatar={member.avatar} size="sm" className="opacity-50 grayscale" />
                      <span className="text-xs text-slate-500 truncate">
                        {member.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
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
