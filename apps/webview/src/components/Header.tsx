import React from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  Activity,
  Network,
  MessageSquareCode,
  FileBarChart,
  Settings,
  GitBranch,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    projectName,
    currentBranch,
    connectionStatus,
    presence,
    activeTab,
    setActiveTab,
  } = useAppStore();

  const onlineMembers = presence.filter((p) => p.online);

  return (
    <header className="h-12 bg-aurora-secondary border-b border-aurora-border px-4 flex items-center justify-between select-none">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-aurora-primary to-aurora-secondaryAccent flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold text-aurora-bg">R</span>
          </div>
          <span className="font-semibold text-sm text-aurora-textPrimary tracking-tight">
            {projectName}
          </span>
        </div>

        {/* Git Branch Pill */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-aurora-card border border-aurora-border text-xs text-aurora-textSecondary font-mono">
          <GitBranch className="w-3 h-3 text-aurora-primary" />
          <span>{currentBranch}</span>
        </div>
      </div>

      {/* Right Tools: Presence Avatars & Connection Status */}
      <div className="flex items-center gap-3">
        {/* Connected Team Avatars */}
        <div className="flex items-center -space-x-1.5 hover:space-x-1 transition-all duration-200">
          {onlineMembers.map((member) => (
            <div
              key={member.id}
              className="relative group cursor-pointer"
              title={`${member.name} (${member.activeFile || 'Idle'})`}
            >
              <div className="w-6 h-6 rounded-full bg-aurora-card border border-aurora-border flex items-center justify-center text-[10px] font-bold text-aurora-primary hover:border-aurora-primary">
                {member.avatar || member.name[0]}
              </div>
              <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-aurora-success ring-1 ring-aurora-bg" />
            </div>
          ))}
          <span className="text-[11px] text-aurora-textMuted pl-2">
            {onlineMembers.length} online
          </span>
        </div>

        <div className="h-4 w-px bg-aurora-border" />

        {/* Backend Connection Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${
            connectionStatus === 'connected'
              ? 'bg-aurora-successMuted text-aurora-success border-aurora-success/30'
              : connectionStatus === 'reconnecting' || connectionStatus === 'connecting'
              ? 'bg-aurora-warningMuted text-aurora-warning border-aurora-warning/30'
              : 'bg-aurora-errorMuted text-aurora-error border-aurora-error/30'
          }`}
        >
          {connectionStatus === 'connected' ? (
            <Wifi className="w-3 h-3" />
          ) : connectionStatus === 'reconnecting' ? (
            <RefreshCw className="w-3 h-3 animate-spin" />
          ) : (
            <WifiOff className="w-3 h-3" />
          )}
          <span className="capitalize">{connectionStatus}</span>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-1.5 rounded text-aurora-textSecondary hover:text-aurora-textPrimary hover:bg-aurora-card transition-colors ${
            activeTab === 'settings' ? 'text-aurora-primary bg-aurora-card' : ''
          }`}
          title="Settings & Diagnostics"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
