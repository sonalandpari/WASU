import React, { useState } from 'react';
import { vsCodeBridge } from '../services/vscodeBridge';
import { GitCommit, ExternalLink, MessageSquarePlus, Copy, Check } from 'lucide-react';

interface DiffLineItem {
  type: 'added' | 'deleted' | 'unchanged';
  oldLine?: number;
  newLine?: number;
  content: string;
}

interface GitDiffViewerProps {
  commitHash?: string;
  commitMessage?: string;
  author?: string;
  timestamp?: string;
  filePath?: string;
  onLineSelect?: (line: number) => void;
}

export const GitDiffViewer: React.FC<GitDiffViewerProps> = ({
  commitHash = '8b7f1a4',
  commitMessage = 'feat(api): implement Socket.IO project room sync',
  author = 'Master Zalulu',
  timestamp = '10:50 AM',
  filePath = 'backend/src/realtime/socketGateway.ts',
  onLineSelect,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);

  // Mock realistic diff lines
  const diffLines: DiffLineItem[] = [
    { type: 'unchanged', oldLine: 28, newLine: 28, content: 'export class SocketGateway {' },
    { type: 'unchanged', oldLine: 29, newLine: 29, content: '  private io: Server;' },
    { type: 'deleted', oldLine: 30, content: '-  private activeUsers = new Map<string, string>();' },
    { type: 'added', newLine: 30, content: '+  private activePresences = new Map<string, UserPresence>();' },
    { type: 'added', newLine: 31, content: '+  private projectRooms = new Map<string, Set<string>>();' },
    { type: 'unchanged', oldLine: 31, newLine: 32, content: '' },
    { type: 'unchanged', oldLine: 32, newLine: 33, content: '  public joinProject(socket: Socket, projectId: string) {' },
    { type: 'added', newLine: 34, content: '+    socket.join(`project:${projectId}`);' },
    { type: 'added', newLine: 35, content: '+    this.broadcastPresence(projectId);' },
    { type: 'unchanged', oldLine: 33, newLine: 36, content: '  }' },
  ];

  const handleCopyCommit = () => {
    navigator.clipboard.writeText(commitHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEditor = () => {
    vsCodeBridge.postMessage({
      type: 'OPEN_FILE',
      payload: { path: filePath, line: selectedLines[0] || 34 },
    });
  };

  const toggleLineSelect = (lineNum?: number) => {
    if (!lineNum) return;
    if (selectedLines.includes(lineNum)) {
      setSelectedLines(selectedLines.filter((l) => l !== lineNum));
    } else {
      setSelectedLines([...selectedLines, lineNum]);
      if (onLineSelect) onLineSelect(lineNum);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neu-bg rounded-2xl overflow-hidden select-none neu-card shadow-neu-flat">
      {/* Commit Header */}
      <div className="p-3.5 bg-neu-bg border-b border-white/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg neu-surface-sm text-emerald-600 shadow-neu-flat-sm">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 truncate">
                {commitMessage}
              </span>
              <button
                onClick={handleCopyCommit}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg neu-btn text-[10px] font-mono text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Copy commit SHA"
              >
                <span>{commitHash.substring(0, 7)}</span>
                {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              <span>{author}</span> • <span className="font-mono tabular-nums">{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Action Button: View in Editor */}
        <button
          onClick={handleOpenEditor}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all cursor-pointer"
        >
          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
          <span>View in Editor</span>
        </button>
      </div>

      {/* File Path Bar */}
      <div className="px-3.5 py-2 bg-neu-bg/80 border-b border-white/70 flex items-center justify-between text-xs">
        <span className="font-mono text-slate-700 font-semibold text-[11px]">{filePath}</span>
        <div className="flex items-center gap-2.5 text-[10px] font-mono font-bold">
          <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 shadow-neu-badge">+4 lines</span>
          <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 shadow-neu-badge">-1 line</span>
        </div>
      </div>

      {/* Diff Table */}
      <div className="flex-1 overflow-y-auto font-mono text-xs bg-slate-50">
        {diffLines.map((line, idx) => {
          const isSelected = line.newLine ? selectedLines.includes(line.newLine) : false;
          return (
            <div
              key={idx}
              onClick={() => toggleLineSelect(line.newLine || line.oldLine)}
              className={`flex items-stretch hover:bg-slate-200/60 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-indigo-100/70 ring-1 ring-inset ring-indigo-400 font-semibold'
                  : line.type === 'added'
                  ? 'bg-emerald-50 text-emerald-900 border-l-2 border-emerald-500'
                  : line.type === 'deleted'
                  ? 'bg-rose-50 text-rose-900 line-through opacity-80 border-l-2 border-rose-500'
                  : 'text-slate-700'
              }`}
            >
              {/* Old Line # */}
              <div className="w-10 px-2 py-0.5 text-right text-[10px] text-slate-400 select-none border-r border-slate-200 bg-slate-100/70 tabular-nums">
                {line.oldLine || ''}
              </div>
              {/* New Line # */}
              <div className="w-10 px-2 py-0.5 text-right text-[10px] text-slate-400 select-none border-r border-slate-200 bg-slate-100/70 tabular-nums">
                {line.newLine || ''}
              </div>
              {/* Code Line Content */}
              <div className="flex-1 px-3 py-0.5 font-mono whitespace-pre overflow-x-auto leading-relaxed">
                {line.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="px-3.5 py-2 bg-neu-bg border-t border-white/70 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Click on any line to select & link a discussion to that exact code location</span>
        {selectedLines.length > 0 && (
          <span className="text-indigo-600 font-mono font-bold">
            Line {selectedLines.join(', ')} selected
          </span>
        )}
      </div>
    </div>
  );
};
