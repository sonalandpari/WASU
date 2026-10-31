import React from 'react';
import {
  Inbox,
  AlertTriangle,
  WifiOff,
  GitFork,
  FileQuestion,
  RotateCcw,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

export type EmptyStateType =
  | 'empty_project'
  | 'no_members'
  | 'disconnected'
  | 'no_git'
  | 'no_architecture'
  | 'scanner_error'
  | 'empty_discussions';

interface StateCardProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const StateCard: React.FC<StateCardProps> = ({
  type,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const getConfig = () => {
    switch (type) {
      case 'empty_project':
        return {
          icon: FolderOpen,
          defaultTitle: 'Empty ContextFlow Workspace',
          defaultDesc: 'No project files or activities detected in this repository yet.',
          iconColor: 'text-aurora-primary',
          iconBg: 'bg-aurora-primaryMuted',
          btnText: 'Initialize Workspace',
        };
      case 'no_members':
        return {
          icon: Inbox,
          defaultTitle: 'No Teammates Online',
          defaultDesc: 'You are currently the only connected contributor on this branch.',
          iconColor: 'text-aurora-textSecondary',
          iconBg: 'bg-aurora-card',
          btnText: 'Invite Teammate',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          defaultTitle: 'Backend Disconnected',
          defaultDesc: 'Real-time synchronization is offline. Retrying connection to gateway...',
          iconColor: 'text-aurora-warning',
          iconBg: 'bg-aurora-warningMuted',
          btnText: 'Retry Connection',
        };
      case 'no_git':
        return {
          icon: GitFork,
          defaultTitle: 'No Git Repository Detected',
          defaultDesc: 'ContextFlow requires an initialized Git repo to track commits, branches, and diffs.',
          iconColor: 'text-aurora-error',
          iconBg: 'bg-aurora-errorMuted',
          btnText: 'Initialize Git',
        };
      case 'no_architecture':
        return {
          icon: FileQuestion,
          defaultTitle: 'No Architecture Graph Available',
          defaultDesc: 'Scan the repository to map dependencies, imports, and component relationships.',
          iconColor: 'text-aurora-secondaryAccent',
          iconBg: 'bg-aurora-secondaryMuted',
          btnText: 'Run AST Scanner',
        };
      case 'scanner_error':
        return {
          icon: AlertTriangle,
          defaultTitle: 'Architecture Scanner Encountered an Error',
          defaultDesc: 'Failed to parse TypeScript/JavaScript AST. Check project tsconfig or build logs.',
          iconColor: 'text-aurora-error',
          iconBg: 'bg-aurora-errorMuted',
          btnText: 'Re-scan Project',
        };
      case 'empty_discussions':
        return {
          icon: Inbox,
          defaultTitle: 'No Code Discussions Yet',
          defaultDesc: 'Select code lines in the Git diff viewer or click "New" to start a discussion thread.',
          iconColor: 'text-aurora-primary',
          iconBg: 'bg-aurora-primaryMuted',
          btnText: 'Create First Discussion',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl neu-card shadow-neu-flat max-w-md mx-auto my-auto border border-white/80">
      <div className="p-4 rounded-2xl mb-4 neu-surface-sm text-indigo-600 shadow-neu-flat-sm">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        {title || config.defaultTitle}
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
        {description || config.defaultDesc}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl neu-btn text-xs text-slate-700 hover:text-indigo-600 font-semibold transition-all shadow-neu-flat-sm hover:scale-105 active:scale-95 cursor-pointer"
        >
          {actionLabel || config.btnText}
        </button>
      )}
    </div>
  );
};
