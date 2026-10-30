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
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-aurora-border rounded-xl bg-aurora-card/30 max-w-md mx-auto my-auto">
      <div className={`p-3 rounded-full mb-3 ${config.iconBg} ${config.iconColor}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-aurora-textPrimary">
        {title || config.defaultTitle}
      </h3>
      <p className="text-xs text-aurora-textSecondary mt-1 leading-relaxed">
        {description || config.defaultDesc}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3 py-1.5 rounded-md bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border text-xs text-aurora-textPrimary hover:border-aurora-primary transition-colors font-medium shadow-sm"
        >
          {actionLabel || config.btnText}
        </button>
      )}
    </div>
  );
};
