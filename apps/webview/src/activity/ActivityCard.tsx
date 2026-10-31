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
          color: 'text-zinc-300',
          bg: 'bg-white/[0.04]',
          border: 'border-white/[0.08]',
          title: 'Saved',
        };
      case 'BRANCH_CREATED':
      case 'BRANCH_SWITCHED':
        return {
          icon: GitBranch,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/20',
          title: 'Branch',
        };
      case 'COMMIT_CREATED':
        return {
          icon: GitCommit,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          title: 'Commit',
        };
      case 'CHANGES_PUSHED':
        return {
          icon: UploadCloud,
          color: 'text-sky-400',
          bg: 'bg-sky-500/10',
          border: 'border-sky-500/20',
          title: 'Pushed',
        };
      case 'FILES_STAGED':
        return {
          icon: Layers,
          color: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          title: 'Staged',
        };
      case 'ARCHITECTURE_UPDATED':
        return {
          icon: Network,
          color: 'text-purple-400',
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          title: 'Architecture',
        };
      case 'MEMBER_JOINED':
        return {
          icon: UserCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          title: 'Joined',
        };
      case 'MEMBER_LEFT':
        return {
          icon: UserX,
          color: 'text-zinc-500',
          bg: 'bg-white/[0.02]',
          border: 'border-white/[0.05]',
          title: 'Left',
        };
      default:
        return {
          icon: FileCode,
          color: 'text-zinc-400',
          bg: 'bg-white/[0.04]',
          border: 'border-white/[0.08]',
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
    <div className="group relative bg-zinc-900/35 hover:bg-zinc-900/75 border border-white/[0.06] hover:border-white/[0.12] rounded-xl p-3 transition-all duration-150">
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar & Meta */}
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-medium text-zinc-300 shrink-0 mt-0.5">
            {event.userAvatar || event.userName[0]}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-zinc-200">
                {event.userName}
              </span>
              <div
                className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{badge.title}</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono tabular-nums">
                {event.timestamp}
              </span>
            </div>

            <p className="text-xs text-zinc-300/90 mt-1 leading-snug break-words">
              {event.description}
            </p>

            {/* Event Specific Metadata Pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {event.metadata?.file && (
                <button
                  onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-white/[0.06] text-[11px] text-zinc-300 font-mono hover:border-white/20 transition-colors group/pill"
                >
                  <FileCode className="w-3 h-3 text-zinc-500 group-hover/pill:text-zinc-300" />
                  <span className="truncate max-w-[220px]">{event.metadata.file}</span>
                  {event.metadata.count && event.metadata.count > 1 && (
                    <span className="ml-1 px-1 rounded-full bg-white/10 text-[9px] font-bold text-zinc-200">
                      ×{event.metadata.count}
                    </span>
                  )}
                </button>
              )}

              {event.metadata?.commitHash && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-white/[0.06] text-[11px] text-zinc-300 font-mono">
                  <GitCommit className="w-3 h-3 text-emerald-400" />
                  <span>{event.metadata.commitHash.substring(0, 7)}</span>
                  {event.metadata.diffSummary && (
                    <span className="text-[10px] ml-1">
                      <span className="text-emerald-400">+{event.metadata.diffSummary.added}</span>{' '}
                      <span className="text-rose-400">-{event.metadata.diffSummary.deleted}</span>
                    </span>
                  )}
                </div>
              )}

              {event.metadata?.branch && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-white/[0.06] text-[11px] text-indigo-300 font-mono">
                  <GitBranch className="w-3 h-3 text-indigo-400" />
                  <span>{event.metadata.branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {event.metadata?.commitHash && (
            <button
              onClick={() => handleViewDiff(event.metadata?.commitHash, event.metadata?.file)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 border border-white/10 text-xs text-zinc-200 transition-colors font-medium shadow-xs"
              title="Open Side-by-Side Diff"
            >
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>Diff</span>
            </button>
          )}

          {event.metadata?.file && (
            <button
              onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              title="Open in Editor"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {event.metadata?.discussionId && (
            <button
              onClick={() => handleOpenDiscussion(event.metadata?.discussionId)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Discussion</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
