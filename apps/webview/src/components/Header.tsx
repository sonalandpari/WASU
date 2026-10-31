import React from 'react';
import { useAppStore, ActiveTab } from '../store/useAppStore';
import {
  Activity,
  Network,
  MessageSquareCode,
  FileBarChart,
  Settings,
  GitBranch,
  Users,
  FlaskConical,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    projectName,
    currentBranch,
    connectionStatus,
    presence,
    activeTab,
    setActiveTab,
    events,
    discussions,
    showPresencePanel,
    togglePresencePanel,
    showDevSimulator,
    toggleDevSimulator,
  } = useAppStore();

  const onlineMembers = presence.filter((p) => p.online);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'activity', label: 'Activity', icon: Activity, badge: events.length },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'discussions', label: 'Discussions', icon: MessageSquareCode, badge: discussions.length },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <header className="h-11 bg-aurora-secondary/90 backdrop-blur border-b border-aurora-border px-3 flex items-center justify-between select-none z-20 shrink-0">
      {/* Brand & Git Info */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-zinc-800 border border-white/15 flex items-center justify-center shadow-xs">
            <span className="text-[10px] font-bold text-zinc-100">R</span>
          </div>
          <span className="font-semibold text-xs tracking-tight text-zinc-200">
            {projectName}
          </span>
        </div>

        <div className="h-3 w-px bg-white/10" />

        {/* Git Branch Pill */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.03] border border-white/[0.08] text-[11px] text-zinc-400 font-mono">
          <GitBranch className="w-3 h-3 text-zinc-400" />
          <span className="truncate max-w-[100px]">{currentBranch}</span>
        </div>
      </div>

      {/* Center: Segmented Navigation Bar */}
      <nav className="flex items-center p-0.5 rounded-lg bg-zinc-950/60 border border-white/[0.06] max-w-md">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                isActive
                  ? 'bg-zinc-800 text-zinc-100 font-medium shadow-xs border border-white/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-zinc-700 text-zinc-200'
                      : 'bg-white/5 text-zinc-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right Tools: Presence, Status, Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle Presence Button with Avatar Stack */}
        <button
          onClick={togglePresencePanel}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
            showPresencePanel
              ? 'bg-zinc-800 text-zinc-200 border-white/15'
              : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-zinc-200'
          }`}
          title="Toggle Team Presence Panel"
        >
          <Users className="w-3.5 h-3.5" />
          <div className="flex items-center -space-x-1">
            {onlineMembers.slice(0, 3).map((m) => (
              <div
                key={m.id}
                className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-200"
              >
                {m.avatar || m.name[0]}
              </div>
            ))}
          </div>
          <span className="text-[10px] font-mono text-zinc-400">{onlineMembers.length}</span>
        </button>

        {/* Minimal Live Status Dot */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.02] border border-white/[0.06] text-[11px] text-zinc-400"
          title={`Backend status: ${connectionStatus}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]'
                : connectionStatus === 'reconnecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-rose-500'
            }`}
          />
          <span className="capitalize hidden md:inline text-[10px]">{connectionStatus}</span>
        </div>

        {/* Toggle Dev Simulator Button */}
        <button
          onClick={toggleDevSimulator}
          className={`p-1.5 rounded-md border text-xs transition-all ${
            showDevSimulator
              ? 'bg-zinc-800 text-indigo-400 border-indigo-500/30'
              : 'bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.05]'
          }`}
          title="Toggle Developer Simulator (Demo Events)"
        >
          <FlaskConical className="w-3.5 h-3.5" />
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-1.5 rounded-md border text-xs transition-all ${
            activeTab === 'settings'
              ? 'bg-zinc-800 text-zinc-200 border-white/15'
              : 'bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.05]'
          }`}
          title="Settings"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
