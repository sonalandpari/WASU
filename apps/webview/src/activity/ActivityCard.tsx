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

  const isChat = event.type === ('CHAT_MESSAGE' as any);

  const getEventBadge = () => {
    switch (event.type) {
      case 'CHAT_MESSAGE' as any:
        return {
          icon: MessageSquare,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/15',
          border: 'border-indigo-500/30',
          title: 'Chat',
        };
      case 'FILE_SAVED':
        return {
          icon: Save,
          color: 'text-zinc-300',
          bg: 'bg-zinc-800',
          border: 'border-zinc-700',
          title: 'Saved',
        };
      case 'BRANCH_CREATED':
      case 'BRANCH_SWITCHED':
        return {
          icon: GitBranch,
          color: 'text-indigo-400',
          bg: 'bg-indigo-500/15',
          border: 'border-indigo-500/30',
          title: 'Branch',
        };
      case 'COMMIT_CREATED':
        return {
          icon: GitCommit,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          title: 'Commit',
        };
      case 'CHANGES_PUSHED':
        return {
          icon: UploadCloud,
          color: 'text-sky-400',
          bg: 'bg-sky-500/15',
          border: 'border-sky-500/30',
          title: 'Pushed',
        };
      case 'FILES_STAGED':
        return {
          icon: Layers,
          color: 'text-amber-400',
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          title: 'Staged',
        };
      case 'ARCHITECTURE_UPDATED':
        return {
          icon: Network,
          color: 'text-purple-400',
          bg: 'bg-purple-500/15',
          border: 'border-purple-500/30',
          title: 'Architecture',
        };
      case 'MEMBER_JOINED':
        return {
          icon: UserCheck,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/15',
          border: 'border-emerald-500/30',
          title: 'Joined',
        };
      case 'MEMBER_LEFT':
        return {
          icon: UserX,
          color: 'text-zinc-400',
          bg: 'bg-zinc-800',
          border: 'border-zinc-700',
          title: 'Left',
        };
      default:
        return {
          icon: FileCode,
          color: 'text-zinc-300',
          bg: 'bg-zinc-800',
          border: 'border-zinc-700',
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
    <div
      className={`group relative border rounded-xl p-3 transition-colors ${
        isChat
          ? 'bg-zinc-900/80 border-indigo-500/25 hover:border-indigo-500/40'
          : 'bg-zinc-900/50 hover:bg-zinc-900/85 border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar & Meta */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border ${
              isChat
                ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30'
                : 'bg-zinc-800 text-zinc-200 border-zinc-700'
            }`}
          >
            {event?.userAvatar || event?.userName?.[0]?.toUpperCase() || 'G'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-zinc-100">
                {event?.userName || 'Developer'}
              </span>

              <div
                className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-medium border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{badge.title}</span>
              </div>

              <span className="text-[10px] text-zinc-400 font-mono tabular-nums">
                {event.timestamp}
              </span>
            </div>

            {/* Description / Chat message */}
            <p
              className={`text-xs mt-1 leading-snug break-words ${
                isChat ? 'text-zinc-100 font-medium' : 'text-zinc-300'
              }`}
            >
              {event.description}
            </p>

            {/* Metadata Pills */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {event.metadata?.file && (
                <button
                  onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-zinc-300 font-mono hover:text-white hover:border-zinc-500 transition-colors group/pill"
                >
                  <FileCode className="w-3 h-3 text-zinc-400 group-hover/pill:text-zinc-200" />
                  <span className="truncate max-w-[220px]">{event.metadata.file}</span>
                  {event.metadata.count && event.metadata.count > 1 && (
                    <span className="ml-1 px-1 rounded-full bg-zinc-700 text-[9px] font-bold text-zinc-200">
                      ×{event.metadata.count}
                    </span>
                  )}
                </button>
              )}

              {event.metadata?.commitHash && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-emerald-400 font-mono">
                  <GitCommit className="w-3 h-3" />
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
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-[11px] text-indigo-300 font-mono">
                  <GitBranch className="w-3 h-3" />
                  <span>{event.metadata.branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action: Clickable Diff Button */}
        <div className="flex items-center gap-1 shrink-0">
          {event.metadata?.commitHash && (
            <button
              onClick={() => handleViewDiff(event.metadata?.commitHash, event.metadata?.file)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs text-zinc-100 font-medium transition-colors shadow-xs cursor-pointer focus:outline-none"
              title="Open Side-by-Side Diff in Editor"
            >
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>Diff</span>
            </button>
          )}

          {event.metadata?.file && (
            <button
              onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              title="Open in Editor"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {event.metadata?.discussionId && (
            <button
              onClick={() => handleOpenDiscussion(event.metadata?.discussionId)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-xs text-indigo-300 hover:bg-indigo-500/25 transition-colors"
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
