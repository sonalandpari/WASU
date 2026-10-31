import React, { useState } from 'react';
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
  Copy,
  Check,
  FolderGit2,
  Folder,
  User,
  GitFork,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    projectName,
    currentBranch,
    workspacePath,
    repositoryName,
    roomCode,
    currentUser,
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
    openImportModal,
  } = useAppStore();

  const [copiedRoom, setCopiedRoom] = useState(false);

  const handleCopyRoom = () => {
    const code = roomCode || repositoryName || 'WASU';
    navigator.clipboard.writeText(code);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  const onlineMembers = Array.isArray(presence) ? presence.filter((p) => p && p.online) : [];

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'activity', label: 'Timeline', icon: Activity, badge: Array.isArray(events) ? events.length : 0 },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'discussions', label: 'Discussions', icon: MessageSquareCode, badge: Array.isArray(discussions) ? discussions.length : 0 },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  const directoryBasename = (workspacePath && typeof workspacePath === 'string')
    ? workspacePath.split('/').filter(Boolean).pop() || 'Hackathon'
    : 'Hackathon';

  return (
    <div className="flex flex-col border-b border-zinc-800/80 bg-zinc-950 select-none z-20 shrink-0">
      {/* Top Header Row */}
      <header className="h-11 px-3 flex items-center justify-between gap-2">
        {/* Brand & Main Segmented Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center shadow-xs">
              <span className="text-[10px] font-bold text-white tracking-tight">R</span>
            </div>
            <span className="font-semibold text-xs tracking-tight text-zinc-100">
              {projectName || 'RERO'}
            </span>
          </div>

          <div className="h-3.5 w-px bg-zinc-800" />

          {/* Segmented Navigation Tabs */}
          <nav className="flex items-center p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors focus:outline-none ${
                    isActive
                      ? 'bg-zinc-800 text-white font-medium border border-zinc-700/70 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                        isActive
                          ? 'bg-zinc-700 text-zinc-100 font-semibold'
                          : 'bg-zinc-800/80 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Tools: Presence, Live Status, Controls */}
        <div className="flex items-center gap-2">
          {/* Import Public GitHub Repo Button */}
          <button
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/35 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xs cursor-pointer"
            title="Import public GitHub repository"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Import Repo</span>
          </button>

          {/* Team Presence Toggle Button */}
          <button
            onClick={togglePresencePanel}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-colors focus:outline-none ${
              showPresencePanel
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
            title="Toggle Team Presence Panel"
          >
            <Users className="w-3.5 h-3.5" />
            <div className="flex items-center -space-x-1">
              {onlineMembers.length > 0 ? (
                onlineMembers.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-200"
                  >
                    {m.avatar || m.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                ))
              ) : (
                <div className="w-4 h-4 rounded-full bg-zinc-700 border border-zinc-900 flex items-center justify-center text-[8px] font-bold text-zinc-200">
                  {currentUser?.avatar || currentUser?.name?.[0]?.toUpperCase() || 'D'}
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono tabular-nums text-zinc-300">
              {Math.max(onlineMembers.length, 1)} online
            </span>
          </button>

          {/* Minimal Live Status Dot */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
            title={`Backend: ${connectionStatus}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="capitalize text-[10px] text-zinc-300 hidden md:inline">
              {connectionStatus}
            </span>
          </div>

          {/* Toggle Simulator */}
          <button
            onClick={toggleDevSimulator}
            className={`p-1.5 rounded-md border text-xs transition-colors focus:outline-none ${
              showDevSimulator
                ? 'bg-zinc-800 text-indigo-400 border-indigo-500/40'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Toggle Developer Simulator"
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-1.5 rounded-md border text-xs transition-colors focus:outline-none ${
              activeTab === 'settings'
                ? 'bg-zinc-800 text-zinc-100 border-zinc-700'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title="Settings & Diagnostics"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Developer Quick Context Bar */}
      <div className="h-7 px-3 bg-zinc-900/70 border-t border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400 overflow-x-auto gap-3">
        {/* Left: Who Am I + Directory + Repo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Developer Identity */}
          <div className="flex items-center gap-1.5 text-zinc-300" title={`Logged in as ${currentUser?.name || 'Developer'}`}>
            <div className="w-3.5 h-3.5 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center text-[9px] text-indigo-300 font-bold">
              {currentUser?.avatar || currentUser?.name?.[0]?.toUpperCase() || 'D'}
            </div>
            <span className="font-sans font-medium text-xs text-zinc-200">{currentUser?.name || 'Developer'}</span>
          </div>

          <div className="h-3 w-px bg-zinc-800" />

          {/* Workspace Directory */}
          <div
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-default"
            title={`Workspace directory: ${workspacePath || 'Active Workspace'}`}
          >
            <Folder className="w-3 h-3 text-zinc-500" />
            <span className="truncate max-w-[120px]">{directoryBasename}</span>
          </div>

          <div className="h-3 w-px bg-zinc-800" />

          {/* Git Repo & Branch */}
          <div
            className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-default"
            title={`Git Repository: ${repositoryName || 'WASU'}`}
          >
            <FolderGit2 className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-300 font-medium truncate max-w-[140px]">
              {repositoryName || 'WASU'}
            </span>
            <span className="text-zinc-600">:</span>
            <div className="flex items-center gap-0.5 text-indigo-400">
              <GitBranch className="w-2.5 h-2.5" />
              <span>{currentBranch || 'main'}</span>
            </div>
          </div>
        </div>

        {/* Right: Room Code with 1-Click Copy */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyRoom}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/70 text-[11px] text-zinc-300 hover:text-white transition-all cursor-pointer font-sans"
            title="Click to copy Room Code for teammates"
          >
            <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400">Room:</span>
            <span className="font-mono font-bold text-zinc-100">{roomCode || 'WASU'}</span>
            {copiedRoom ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
