import React from 'react';
import { ProjectEvent } from '@contextflow/shared';
import { vsCodeBridge } from '../services/vscodeBridge';
import { useAppStore } from '../store/useAppStore';
import {
  Save,
  GitBranch,
  GitCommit,
  UploadCloud,
  Network,
  UserCheck,
  UserX,
  FileCode,
  Layers,
  ExternalLink,
  MessageSquare,
  Eye,
} from 'lucide-react';

interface ActivityCardProps {
  event: ProjectEvent;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ event }) => {
  const { setSelectedDiscussionId, setActiveTab } = useAppStore();

  const getEventBadge = () => {
    switch (event.type) {
      case 'FILE_SAVED':
        return {
          icon: Save,
          color: 'text-aurora-primary',
          bg: 'bg-aurora-primaryMuted',
          border: 'border-aurora-primary/30',
          title: 'File Saved',
        };
      case 'BRANCH_CREATED':
      case 'BRANCH_SWITCHED':
        return {
          icon: GitBranch,
          color: 'text-aurora-secondaryAccent',
          bg: 'bg-aurora-secondaryMuted',
          border: 'border-aurora-secondaryAccent/30',
          title: 'Branch',
        };
      case 'COMMIT_CREATED':
        return {
          icon: GitCommit,
          color: 'text-aurora-success',
          bg: 'bg-aurora-successMuted',
          border: 'border-aurora-success/30',
          title: 'Commit',
        };
      case 'CHANGES_PUSHED':
        return {
          icon: UploadCloud,
          color: 'text-aurora-primary',
          bg: 'bg-aurora-primaryMuted',
          border: 'border-aurora-primary/30',
          title: 'Pushed',
        };
      case 'FILES_STAGED':
        return {
          icon: Layers,
          color: 'text-aurora-warning',
          bg: 'bg-aurora-warningMuted',
          border: 'border-aurora-warning/30',
          title: 'Staged',
        };
      case 'ARCHITECTURE_UPDATED':
        return {
          icon: Network,
          color: 'text-aurora-secondaryAccent',
          bg: 'bg-aurora-secondaryMuted',
          border: 'border-aurora-secondaryAccent/30',
          title: 'Architecture',
        };
      case 'MEMBER_JOINED':
        return {
          icon: UserCheck,
          color: 'text-aurora-success',
          bg: 'bg-aurora-successMuted',
          border: 'border-aurora-success/30',
          title: 'Joined',
        };
      case 'MEMBER_LEFT':
        return {
          icon: UserX,
          color: 'text-aurora-textMuted',
          bg: 'bg-aurora-borderSubtle',
          border: 'border-aurora-border',
          title: 'Left',
        };
      default:
        return {
          icon: FileCode,
          color: 'text-aurora-textSecondary',
          bg: 'bg-aurora-card',
          border: 'border-aurora-border',
          title: 'Event',
        };
    }
  };

  const badge = getEventBadge();
  const Icon = badge.icon;

  const handleOpenFile = (path: string, line?: number) => {
    vsCodeBridge.postMessage({
      type: 'OPEN_FILE',
      payload: { path, line },
    });
  };

  const handleViewDiff = (commitHash?: string, file?: string) => {
    vsCodeBridge.postMessage({
      type: 'OPEN_COMMIT_DIFF',
      payload: { commitHash, changedPath: file, file },
    });
  };

  const handleOpenDiscussion = (discussionId?: string) => {
    if (discussionId) {
      setSelectedDiscussionId(discussionId);
      setActiveTab('discussions');
      vsCodeBridge.postMessage({
        type: 'OPEN_DISCUSSION',
        payload: { discussionId },
      });
    }
  };

  return (
    <div className="group relative bg-aurora-card hover:bg-aurora-cardHover border border-aurora-border hover:border-aurora-border/80 rounded-lg p-3 transition-all duration-150 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        {/* Left: User Avatar & Basic Info */}
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-aurora-secondary border border-aurora-border flex items-center justify-center text-xs font-semibold text-aurora-primary shrink-0">
            {event.userAvatar || event.userName[0]}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-aurora-textPrimary">
                {event.userName}
              </span>
              <div
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{badge.title}</span>
              </div>
              <span className="text-[11px] text-aurora-textMuted font-mono">
                {event.timestamp}
              </span>
            </div>

            <p className="text-xs text-aurora-textSecondary mt-1 leading-snug break-words">
              {event.description}
            </p>

            {/* Event Specific Metadata Pills */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {event.metadata?.file && (
                <button
                  onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-secondary border border-aurora-border text-[11px] text-aurora-primary font-mono hover:border-aurora-primary transition-colors group/pill"
                >
                  <FileCode className="w-3 h-3 text-aurora-textMuted group-hover/pill:text-aurora-primary" />
                  <span className="truncate max-w-[220px]">{event.metadata.file}</span>
                  {event.metadata.count && event.metadata.count > 1 && (
                    <span className="ml-1 px-1 rounded-full bg-aurora-primary/20 text-[9px] font-bold">
                      ×{event.metadata.count}
                    </span>
                  )}
                </button>
              )}

              {event.metadata?.commitHash && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-secondary border border-aurora-border text-[11px] text-aurora-success font-mono">
                  <GitCommit className="w-3 h-3" />
                  <span>{event.metadata.commitHash.substring(0, 7)}</span>
                  {event.metadata.diffSummary && (
                    <span className="text-[10px] text-aurora-textMuted ml-1">
                      <span className="text-aurora-success">+{event.metadata.diffSummary.added}</span>{' '}
                      <span className="text-aurora-error">-{event.metadata.diffSummary.deleted}</span>
                    </span>
                  )}
                </div>
              )}

              {event.metadata?.branch && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-aurora-secondary border border-aurora-border text-[11px] text-aurora-secondaryAccent font-mono">
                  <GitBranch className="w-3 h-3" />
                  <span>{event.metadata.branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {event.metadata?.commitHash && (
            <button
              onClick={() => handleViewDiff(event.metadata?.commitHash, event.metadata?.file)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-aurora-secondary border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
              title="View Commit Diff"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Diff</span>
            </button>
          )}

          {event.metadata?.file && (
            <button
              onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
              className="p-1 rounded text-aurora-textSecondary hover:text-aurora-primary hover:bg-aurora-secondary transition-colors"
              title="Open in VS Code Editor"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {event.metadata?.discussionId && (
            <button
              onClick={() => handleOpenDiscussion(event.metadata?.discussionId)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-aurora-primaryMuted border border-aurora-primary/30 text-xs text-aurora-primary hover:bg-aurora-primary/20 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Discussion</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
