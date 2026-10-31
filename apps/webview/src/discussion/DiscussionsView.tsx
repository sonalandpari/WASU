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
      projectId: 'contextflow-demo',
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
    <div className="flex-1 flex h-full bg-aurora-bg overflow-hidden">
      {/* Left List of Discussions */}
      <div className="w-80 border-r border-aurora-border flex flex-col bg-aurora-secondary/30 select-none">
        <div className="p-3 border-b border-aurora-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-aurora-primary" />
            <span className="text-xs font-semibold text-aurora-textPrimary">Code Discussions</span>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-aurora-primary text-aurora-bg text-xs font-medium hover:bg-aurora-primary/90 transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {discussions.map((disc) => {
            const isSelected = selectedDisc?.id === disc.id;
            return (
              <div
                key={disc.id}
                onClick={() => setSelectedDiscussionId(disc.id)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-aurora-card border-aurora-primary/60 shadow-sm'
                    : 'bg-aurora-card/50 border-aurora-border/60 hover:bg-aurora-card hover:border-aurora-border'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-aurora-textMuted mb-1">
                  <div className="flex items-center gap-1 font-mono">
                    <FileCode className="w-3 h-3 text-aurora-primary" />
                    <span className="truncate max-w-[130px]">{disc.filePath?.split('/').pop() || 'General'}</span>
                    {disc.lineStart && <span>:{disc.lineStart}</span>}
                  </div>
                  <span className="text-[10px]">{disc.createdAt}</span>
                </div>

                <div className="text-xs font-medium text-aurora-textPrimary line-clamp-2 mb-1.5">
                  {disc.title}
                </div>

                <div className="flex items-center justify-between text-[11px] text-aurora-textMuted">
                  <span>{disc.authorName}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-aurora-secondary border border-aurora-border text-[10px]">
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
            <div className="p-4 bg-aurora-secondary border-b border-aurora-border flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-aurora-textPrimary">
                  {selectedDisc.title}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-aurora-textMuted">
                  <span>Created by <strong className="text-aurora-textSecondary">{selectedDisc.authorName}</strong></span>
                  <span>•</span>
                  <span>{selectedDisc.createdAt}</span>
                  {selectedDisc.filePath && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => handleOpenInEditor(selectedDisc.filePath, selectedDisc.lineStart)}
                        className="flex items-center gap-1 text-aurora-primary font-mono hover:underline"
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
                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-aurora-successMuted text-aurora-success border border-aurora-success/30">
                  {selectedDisc.status}
                </span>
              </div>
            </div>

            {/* Split Content: Code Snippet / Diff & Comments */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Linked Code Snippet / Diff */}
              <div className="flex-1 p-3 overflow-y-auto border-b lg:border-b-0 lg:border-r border-aurora-border">
                {selectedDisc.codeSnippet ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-aurora-textSecondary font-semibold">
                      <span>Linked Code Context (Lines {selectedDisc.lineStart}-{selectedDisc.lineEnd})</span>
                      <button
                        onClick={() => handleOpenInEditor(selectedDisc.filePath, selectedDisc.lineStart)}
                        className="flex items-center gap-1 text-aurora-primary text-[11px] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Jump to Line</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-aurora-sidebar border border-aurora-border rounded-md font-mono text-xs text-aurora-textPrimary overflow-x-auto">
                      <code>{selectedDisc.codeSnippet}</code>
                    </pre>

                    {/* Integrated Live Diff Viewer */}
                    <div className="pt-2">
                      <div className="text-xs font-semibold text-aurora-textSecondary mb-2">
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
              <div className="w-full lg:w-96 flex flex-col bg-aurora-secondary/20">
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {selectedDisc.comments.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-aurora-card border border-aurora-border">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-aurora-textPrimary">{comment.userName}</span>
                        <span className="text-[10px] text-aurora-textMuted font-mono">{comment.createdAt}</span>
                      </div>
                      <p className="text-xs text-aurora-textSecondary leading-relaxed break-words">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reply Input Form */}
                <form onSubmit={handleSendComment} className="p-3 border-t border-aurora-border bg-aurora-card">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 bg-aurora-secondary border border-aurora-border rounded-md px-3 py-1.5 text-xs text-aurora-textPrimary placeholder:text-aurora-textMuted focus:outline-none focus:border-aurora-primary transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="p-1.5 rounded-md bg-aurora-primary text-aurora-bg disabled:opacity-40 hover:bg-aurora-primary/90 transition-colors shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-aurora-textMuted text-xs">
            Select a discussion or create one to get started.
          </div>
        )}
      </div>

      {/* New Discussion Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-aurora-card border border-aurora-border rounded-lg max-w-md w-full p-4 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-aurora-textPrimary">Create Code Discussion</h3>
            <form onSubmit={handleCreateDiscussion} className="space-y-3">
              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">Title / Question</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Why was this hook dependency updated?"
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs text-aurora-textPrimary focus:outline-none focus:border-aurora-primary"
                />
              </div>

              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">File Path</label>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs font-mono text-aurora-textPrimary focus:outline-none focus:border-aurora-primary"
                />
              </div>

              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">Target Line</label>
                <input
                  type="number"
                  value={newLineStart}
                  onChange={(e) => setNewLineStart(Number(e.target.value))}
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs font-mono text-aurora-textPrimary focus:outline-none focus:border-aurora-primary"
                />
              </div>

              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">Code Snippet Preview</label>
                <textarea
                  rows={3}
                  value={newSnippet}
                  onChange={(e) => setNewSnippet(e.target.value)}
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs font-mono text-aurora-textPrimary focus:outline-none focus:border-aurora-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3 py-1.5 rounded bg-aurora-secondary border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-textPrimary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded bg-aurora-primary text-aurora-bg text-xs font-medium hover:bg-aurora-primary/90"
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
