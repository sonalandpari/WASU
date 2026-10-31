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
  Sparkles,
} from 'lucide-react';
import { UserAvatar } from './common/UserAvatar';

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
    addEvent,
    openDiffModal,
    closeDiffModal,
  } = useAppStore();

  const [copiedRoom, setCopiedRoom] = useState(false);
  const [isShowcaseRunning, setIsShowcaseRunning] = useState(false);

  const handleRunShowcase = () => {
    if (isShowcaseRunning) return;
    setIsShowcaseRunning(true);

    // 1. Switch to timeline tab
    setActiveTab('activity');

    // 2. Add realistic live commit event
    const demoEvent: any = {
      id: `evt-demo-${Date.now()}`,
      type: 'COMMIT_CREATED',
      projectId: roomCode || 'WASU',
      userId: 'user-pari',
      userName: 'Pari (Lead Architect)',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      description: 'feat(gemma): integrate Gemma 4 edge synthesis & sprint metrics',
      timestamp: 'Just now',
      metadata: {
        commitHash: 'a7c93e1b82f0',
        stagedFiles: ['apps/webview/api/gemma.ts', 'apps/webview/src/reports/ReportsView.tsx'],
        lineInsertions: 142,
        lineDeletions: 8,
      },
    };
    addEvent(demoEvent);

    // 3. Open diff viewer modal after 1.2s
    setTimeout(() => {
      openDiffModal({
        commitHash: 'a7c93e1b82f0',
        fileName: 'apps/webview/api/gemma.ts',
        authorName: 'Pari (Lead Architect)',
        commitMessage: 'feat(gemma): integrate Gemma 4 edge synthesis & sprint metrics',
      });
    }, 1200);

    // 4. Close diff modal and navigate to Reports after 4s
    setTimeout(() => {
      closeDiffModal();
      setActiveTab('reports');
      // Trigger Gemma 4 synthesis
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('TRIGGER_GEMMA_SYNTHESIS'));
        setIsShowcaseRunning(false);
      }, 500);
    }, 4200);
  };

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
    <div className="flex flex-col border-b border-white/70 bg-neu-bg select-none z-20 shrink-0 shadow-neu-flat-sm">
      {/* Top Header Row */}
      <header className="h-12 px-3.5 flex items-center justify-between gap-3 bg-neu-bg">
        {/* Brand & Main Segmented Tabs */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg neu-surface-sm flex items-center justify-center font-bold text-indigo-600 text-xs shadow-neu-flat-sm">
              ⚡
            </div>
            <span className="font-bold text-sm tracking-tight text-neu-textHead">
              {projectName || 'RERO'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-300" />

          {/* Segmented Navigation Tabs */}
          <nav className="flex items-center p-1 rounded-xl neu-input gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs transition-all focus:outline-none cursor-pointer ${
                    isActive
                      ? 'neu-btn-primary font-semibold shadow-neu-primary'
                      : 'text-neu-textMuted hover:text-neu-textHead hover:bg-white/40'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono tabular-nums ${
                        isActive
                          ? 'bg-white/25 text-white font-bold'
                          : 'bg-slate-200 text-neu-textMuted'
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
          {/* Automated 15s Live Demo Button */}
          <button
            onClick={handleRunShowcase}
            disabled={isShowcaseRunning}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isShowcaseRunning
                ? 'neu-input text-indigo-600 shadow-neu-inset animate-pulse'
                : 'neu-btn text-indigo-600 hover:scale-[1.02] active:scale-[0.98]'
            }`}
            title="Run 15-second live showcase: real commit -> diff viewer -> Gemma 4 synthesis"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isShowcaseRunning ? 'animate-spin text-amber-500' : 'text-indigo-600'}`} />
            <span className="hidden sm:inline font-semibold">{isShowcaseRunning ? 'Simulating...' : '▶ 15s Live Demo'}</span>
          </button>

          {/* Import Public GitHub Repo Button */}
          <button
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-slate-700 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Import public GitHub repository"
          >
            <GitFork className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Import Repo</span>
          </button>

          {/* Team Presence Toggle Button */}
          <button
            onClick={togglePresencePanel}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all focus:outline-none cursor-pointer ${
              showPresencePanel
                ? 'neu-btn active text-indigo-600'
                : 'neu-btn text-neu-textHead'
            }`}
            title="Toggle Team Presence Panel"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <div className="flex items-center -space-x-1">
              {onlineMembers.length > 0 ? (
                onlineMembers.slice(0, 3).map((m) => (
                  <UserAvatar
                    key={m.id}
                    name={m.name}
                    avatar={m.avatar}
                    size="xs"
                    className="ring-1 ring-white"
                  />
                ))
              ) : (
                <UserAvatar
                  name={currentUser?.name}
                  avatar={currentUser?.avatar}
                  size="xs"
                  className="ring-1 ring-white"
                />
              )}
            </div>
            <span className="text-[10px] font-mono tabular-nums text-slate-600 font-semibold">
              {Math.max(onlineMembers.length, 1)} online
            </span>
          </button>

          {/* Minimal Live Status Dot */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl neu-surface-sm text-[11px] text-slate-700 font-medium"
            title={`Backend: ${connectionStatus}`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected'
                  ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]'
                  : connectionStatus === 'reconnecting'
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-rose-500'
              }`}
            />
            <span className="capitalize text-[10px] text-slate-600 hidden md:inline">
              {connectionStatus}
            </span>
          </div>

          {/* Toggle Simulator */}
          <button
            onClick={toggleDevSimulator}
            className={`p-2 rounded-xl text-xs transition-all focus:outline-none cursor-pointer ${
              showDevSimulator
                ? 'neu-btn active text-indigo-600'
                : 'neu-btn text-slate-500 hover:text-slate-700'
            }`}
            title="Toggle Developer Simulator"
          >
            <FlaskConical className="w-3.5 h-3.5" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-xl text-xs transition-all focus:outline-none cursor-pointer ${
              activeTab === 'settings'
                ? 'neu-btn active text-indigo-600'
                : 'neu-btn text-slate-500 hover:text-slate-700'
            }`}
            title="Settings & Diagnostics"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Developer Quick Context Bar */}
      <div className="h-7 px-3.5 bg-neu-bg/90 border-t border-white/60 flex items-center justify-between text-[11px] font-mono text-slate-500 overflow-x-auto gap-3">
        {/* Left: Who Am I + Directory + Repo */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Developer Identity */}
          <div className="flex items-center gap-1.5 text-slate-700" title={`Logged in as ${currentUser?.name || 'Developer'}`}>
            <UserAvatar name={currentUser?.name} avatar={currentUser?.avatar} size="xs" />
            <span className="font-sans font-semibold text-xs text-slate-700">{currentUser?.name || 'Developer'}</span>
          </div>

          <div className="h-3 w-px bg-slate-300" />

          {/* Workspace Directory */}
          <div
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors cursor-default"
            title={`Workspace directory: ${workspacePath || 'Active Workspace'}`}
          >
            <Folder className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[120px] font-medium">{directoryBasename}</span>
          </div>

          <div className="h-3 w-px bg-slate-300" />

          {/* Git Repo & Branch */}
          <div
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors cursor-default"
            title={`Git Repository: ${repositoryName || 'WASU'}`}
          >
            <FolderGit2 className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-semibold truncate max-w-[140px]">
              {repositoryName || 'WASU'}
            </span>
            <span className="text-slate-400">:</span>
            <div className="flex items-center gap-0.5 text-indigo-600 font-medium">
              <GitBranch className="w-2.5 h-2.5" />
              <span>{currentBranch || 'main'}</span>
            </div>
          </div>
        </div>

        {/* Right: Room Code with 1-Click Copy */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyRoom}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg neu-btn text-[11px] text-slate-700 hover:text-indigo-600 transition-all cursor-pointer font-sans"
            title="Click to copy Room Code for teammates"
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Room:</span>
            <span className="font-mono font-bold text-slate-800">{roomCode || 'WASU'}</span>
            {copiedRoom ? (
              <Check className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
