import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { GitDiffViewer } from '../diff/GitDiffViewer';
import { vsCodeBridge } from '../services/vscodeBridge';
import {
  MessageSquare,
  Send,
  ExternalLink,
  PlusCircle,
  FileCode,
  CheckCircle2,
  Clock,
  CornerDownRight,
} from 'lucide-react';
import { Discussion } from '@contextflow/shared';
import { UserAvatar } from '../components/common/UserAvatar';

export const DiscussionsView: React.FC = () => {
  const {
    discussions,
    selectedDiscussionId,
    setSelectedDiscussionId,
    addComment,
    addDiscussion,
    currentUser,
  } = useAppStore();

  const [commentText, setCommentText] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFilePath, setNewFilePath] = useState('apps/webview/src/App.tsx');
  const [newLineStart, setNewLineStart] = useState<number>(10);
  const [newSnippet, setNewSnippet] = useState('export const App: React.FC = () => {');

  const selectedDisc = discussions.find((d) => d.id === selectedDiscussionId) || discussions[0];

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedDisc) return;

    const newComment = {
      id: `c-${Date.now()}`,
      discussionId: selectedDisc.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: commentText.trim(),
      createdAt: 'Just now',
    };

    addComment(selectedDisc.id, newComment);
    setCommentText('');
  };

  const handleCreateDiscussion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newDisc: Discussion = {
      id: `disc-${Date.now()}`,
      projectId: useAppStore.getState().roomCode || 'WASU',
      title: newTitle.trim(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      createdAt: 'Just now',
      updatedAt: 'Just now',
      status: 'open',
      filePath: newFilePath,
      lineStart: Number(newLineStart),
      lineEnd: Number(newLineStart) + 4,
      codeSnippet: newSnippet,
      comments: [
        {
          id: `c-${Date.now()}`,
          discussionId: `disc-${Date.now()}`,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content: 'Started this discussion around line ' + newLineStart,
          createdAt: 'Just now',
        },
      ],
    };

    addDiscussion(newDisc);
    setSelectedDiscussionId(newDisc.id);
    setShowNewModal(false);
    setNewTitle('');

    vsCodeBridge.postMessage({
      type: 'CREATE_DISCUSSION',
      payload: newDisc,
    });
  };

  const handleOpenInEditor = (path?: string, line?: number) => {
    if (path) {
      vsCodeBridge.postMessage({
        type: 'OPEN_FILE',
        payload: { path, line },
      });
    }
  };

  return (
    <div className="flex-1 flex h-full bg-neu-bg overflow-hidden text-slate-800">
      {/* Left List of Discussions */}
      <div className="w-80 border-r border-white/70 flex flex-col bg-neu-bg select-none shadow-neu-flat-sm">
        <div className="p-3.5 border-b border-white/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg neu-surface-sm text-indigo-600 shadow-neu-flat-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800">Code Discussions</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl neu-btn-primary text-xs font-semibold shadow-neu-primary transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {discussions.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400">
              No discussions yet. Click <strong>+ New</strong> to start one!
            </div>
          )}
          {discussions.map((disc) => {
            const isSelected = selectedDisc?.id === disc.id;
            return (
              <div
                key={disc.id}
                onClick={() => setSelectedDiscussionId(disc.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? 'neu-input ring-2 ring-indigo-500/50 shadow-neu-inset'
                    : 'neu-card hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[130px] font-semibold text-slate-700">{disc.filePath?.split('/').pop() || 'General'}</span>
                    {disc.lineStart && <span className="text-slate-400">:{disc.lineStart}</span>}
                  </div>
                  <span className="text-[10px] font-mono tabular-nums">{disc.createdAt}</span>
                </div>

                <div className="text-xs font-bold text-slate-800 line-clamp-2 mb-2 leading-snug">
                  {disc.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span className="font-medium text-slate-600">{disc.authorName}</span>
                  <span className="px-2 py-0.5 rounded-full neu-surface-sm text-[10px] font-semibold text-indigo-600 shadow-neu-badge">
                    {disc.comments.length} replies
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Discussion Thread & Linked Git Diff */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {selectedDisc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Discussion Header */}
            <div className="p-4 bg-neu-bg border-b border-white/70 flex items-start justify-between shadow-neu-flat-sm">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {selectedDisc.title}
                </h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  <span>Created by <strong className="text-slate-700 font-semibold">{selectedDisc.authorName}</strong></span>
                  <span>•</span>
                  <span className="font-mono tabular-nums">{selectedDisc.createdAt}</span>
                  {selectedDisc.filePath && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleOpenInEditor(selectedDisc.filePath, selectedDisc.lineStart)}
                        className="flex items-center gap-1.5 text-indigo-600 font-mono font-medium hover:underline cursor-pointer"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>{selectedDisc.filePath}:{selectedDisc.lineStart}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-neu-badge uppercase tracking-wide">
                  {selectedDisc.status}
                </span>
              </div>
            </div>

            {/* Split Content: Code Snippet / Diff & Comments */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-neu-bg">
              {/* Linked Code Snippet / Diff */}
              <div className="flex-1 p-4 overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/70">
                {selectedDisc.codeSnippet ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
                      <span>Linked Code Context (Lines {selectedDisc.lineStart}-{selectedDisc.lineEnd})</span>
                      <button
                        onClick={() => handleOpenInEditor(selectedDisc.filePath, selectedDisc.lineStart)}
                        className="flex items-center gap-1.5 text-indigo-600 text-xs font-semibold hover:underline cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Jump to Line</span>
                      </button>
                    </div>
                    <pre className="p-3.5 rounded-xl neu-input font-mono text-xs text-slate-800 overflow-x-auto shadow-neu-inset leading-relaxed">
                      <code>{selectedDisc.codeSnippet}</code>
                    </pre>

                    {/* Integrated Live Diff Viewer */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-700 mb-2">
                        Related Git Changes
                      </div>
                      <GitDiffViewer
                        commitHash={selectedDisc.commitHash}
                        filePath={selectedDisc.filePath}
                      />
                    </div>
                  </div>
                ) : (
                  <GitDiffViewer />
                )}
              </div>

              {/* Comments Thread */}
              <div className="w-full lg:w-96 flex flex-col bg-neu-bg border-l border-white/70">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {selectedDisc.comments.map((comment) => (
                    <div key={comment.id} className="p-3.5 rounded-2xl neu-card shadow-neu-flat-sm space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <UserAvatar name={comment.userName} avatar={comment.userAvatar} size="xs" />
                          <span className="font-bold text-slate-800">{comment.userName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums">{comment.createdAt}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed break-words pl-6">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply Input Form */}
                <form onSubmit={handleSendComment} className="p-3.5 border-t border-white/70 bg-neu-bg">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 neu-input rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all font-sans"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="p-2.5 rounded-xl neu-btn-primary shadow-neu-primary disabled:opacity-40 hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
            Select a discussion or create one to get started.
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neu-bg border border-white/80 rounded-2xl max-w-md w-full p-6 shadow-neu-flat-lg space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Create Code Discussion</h3>
            <form onSubmit={handleCreateDiscussion} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Title / Question</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Why was this hook dependency updated?"
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">File Path</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Target Line</label>
                <input
                  type="number"
                  value={newLineStart}
                  onChange={(e) => setNewLineStart(Number(e.target.value))}
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Code Snippet Preview</label>
                <textarea
                  rows={3}
                  value={newSnippet}
                  onChange={(e) => setNewSnippet(e.target.value)}
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl neu-btn text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl neu-btn-primary shadow-neu-primary text-xs font-semibold cursor-pointer hover:scale-105 active:scale-95"
                >
                  Create Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
