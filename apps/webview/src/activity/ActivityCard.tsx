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
import { UserAvatar } from '../components/common/UserAvatar';

interface ActivityCardProps {
  event: ProjectEvent;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ event }) => {
  const { setSelectedDiscussionId, setActiveTab, openDiffModal } = useAppStore();

  const isChat = event.type === ('CHAT_MESSAGE' as any);

  const getEventBadge = () => {
    switch (event.type) {
      case 'CHAT_MESSAGE' as any:
        return {
          icon: MessageSquare,
          color: 'text-indigo-600',
          bg: 'bg-indigo-50',
          border: 'border-indigo-200/80',
          title: 'Chat',
        };
      case 'FILE_SAVED':
        return {
          icon: Save,
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          title: 'Saved',
        };
      case 'BRANCH_CREATED':
      case 'BRANCH_SWITCHED':
        return {
          icon: GitBranch,
          color: 'text-sky-600',
          bg: 'bg-sky-50',
          border: 'border-sky-200/80',
          title: 'Branch',
        };
      case 'COMMIT_CREATED':
        return {
          icon: GitCommit,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200/80',
          title: 'Commit',
        };
      case 'CHANGES_PUSHED':
        return {
          icon: UploadCloud,
          color: 'text-sky-600',
          bg: 'bg-sky-50',
          border: 'border-sky-200/80',
          title: 'Pushed',
        };
      case 'FILES_STAGED':
        return {
          icon: Layers,
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          border: 'border-amber-200/80',
          title: 'Staged',
        };
      case 'ARCHITECTURE_UPDATED':
        return {
          icon: Network,
          color: 'text-purple-700',
          bg: 'bg-purple-50',
          border: 'border-purple-200/80',
          title: 'Architecture',
        };
      case 'MEMBER_JOINED':
        return {
          icon: UserCheck,
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          border: 'border-emerald-200/80',
          title: 'Joined',
        };
      case 'MEMBER_LEFT':
        return {
          icon: UserX,
          color: 'text-slate-500',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
          title: 'Left',
        };
      default:
        return {
          icon: FileCode,
          color: 'text-slate-600',
          bg: 'bg-slate-100',
          border: 'border-slate-200',
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
    openDiffModal({
      commitHash: commitHash || event.metadata?.commitHash || '06570ef',
      fileName: file || event.metadata?.file || 'apps/webview/src/services/gemmaService.ts',
      authorName: event.userName || 'Developer',
      commitMessage: event.description,
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
      className={`group relative neu-surface rounded-2xl p-3.5 transition-all hover:scale-[1.005] select-none ${
        isChat ? 'ring-1 ring-indigo-500/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar & Meta */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <UserAvatar
            name={event?.userName}
            avatar={event?.userAvatar}
            size="md"
            className="mt-0.5"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-800">
                {event?.userName || 'Developer'}
              </span>

              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg} ${badge.color} ${badge.border}`}
              >
                <Icon className="w-2.5 h-2.5" />
                <span>{badge.title}</span>
              </div>

              <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                {event.timestamp}
              </span>
            </div>

            {/* Description / Chat message */}
            <p
              className={`text-xs mt-1.5 leading-snug break-words ${
                isChat ? 'text-indigo-950 font-semibold' : 'text-slate-700'
              }`}
            >
              {event.description}
            </p>

            {/* Metadata Pills */}
            <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
              {event.metadata?.file && (
                <button
                  onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg neu-btn text-[11px] text-slate-600 font-mono hover:text-indigo-600 transition-all group/pill"
                >
                  <FileCode className="w-3 h-3 text-slate-400 group-hover/pill:text-indigo-600" />
                  <span className="truncate max-w-[220px]">{event.metadata.file}</span>
                  {event.metadata.count && event.metadata.count > 1 && (
                    <span className="ml-1 px-1 rounded-full bg-slate-200 text-[9px] font-bold text-slate-700">
                      ×{event.metadata.count}
                    </span>
                  )}
                </button>
              )}

              {event.metadata?.commitHash && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg neu-btn text-[11px] text-emerald-700 font-mono font-semibold">
                  <GitCommit className="w-3 h-3 text-emerald-600" />
                  <span>{event.metadata.commitHash.substring(0, 7)}</span>
                  {event.metadata.diffSummary && (
                    <span className="text-[10px] ml-1">
                      <span className="text-emerald-700">+{event.metadata.diffSummary.added}</span>{' '}
                      <span className="text-rose-600">-{event.metadata.diffSummary.deleted}</span>
                    </span>
                  )}
                </div>
              )}

              {event.metadata?.branch && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg neu-btn text-[11px] text-indigo-600 font-mono font-medium">
                  <GitBranch className="w-3 h-3" />
                  <span>{event.metadata.branch}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Action: Clickable Diff Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {event.metadata?.commitHash && (
            <button
              onClick={() => handleViewDiff(event.metadata?.commitHash, event.metadata?.file)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl neu-btn text-xs text-indigo-700 font-bold transition-all shadow-neu-flat-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Open Side-by-Side Diff"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-600" />
              <span>Diff</span>
            </button>
          )}

          {event.metadata?.file && (
            <button
              onClick={() => handleOpenFile(event.metadata!.file!, event.metadata?.line)}
              className="p-1.5 rounded-xl neu-btn text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
              title="Open in Editor"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {event.metadata?.discussionId && (
            <button
              onClick={() => handleOpenDiscussion(event.metadata?.discussionId)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl neu-btn text-xs text-indigo-600 font-semibold transition-all cursor-pointer"
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
