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
    <div className="flex flex-col h-full bg-aurora-bg border border-aurora-border rounded-lg overflow-hidden select-none">
      {/* Commit Header */}
      <div className="p-3 bg-aurora-secondary border-b border-aurora-border flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 rounded bg-aurora-successMuted text-aurora-success border border-aurora-success/30">
            <GitCommit className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-aurora-textPrimary truncate">
                {commitMessage}
              </span>
              <button
                onClick={handleCopyCommit}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-aurora-card border border-aurora-border text-[10px] font-mono text-aurora-textSecondary hover:text-aurora-primary transition-colors"
                title="Copy commit SHA"
              >
                <span>{commitHash.substring(0, 7)}</span>
                {copied ? <Check className="w-2.5 h-2.5 text-aurora-success" /> : <Copy className="w-2.5 h-2.5" />}
              </button>
            </div>
            <div className="text-[11px] text-aurora-textMuted mt-0.5">
              <span>{author}</span> • <span>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Action Button: View in Editor */}
        <button
          onClick={handleOpenEditor}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-aurora-card border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View in Editor</span>
        </button>
      </div>

      {/* File Path Bar */}
      <div className="px-3 py-1.5 bg-aurora-sidebar border-b border-aurora-border flex items-center justify-between text-xs">
        <span className="font-mono text-aurora-textPrimary text-[11px]">{filePath}</span>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-aurora-success">+4 lines</span>
          <span className="text-aurora-error">-1 line</span>
        </div>
      </div>

      {/* Diff Table */}
      <div className="flex-1 overflow-y-auto font-mono text-xs">
        {diffLines.map((line, idx) => {
          const isSelected = line.newLine ? selectedLines.includes(line.newLine) : false;
          return (
            <div
              key={idx}
              onClick={() => toggleLineSelect(line.newLine || line.oldLine)}
              className={`flex items-stretch hover:bg-aurora-cardHover/70 cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-aurora-primaryMuted/30 ring-1 ring-inset ring-aurora-primary/50'
                  : line.type === 'added'
                  ? 'bg-aurora-successMuted/20 text-aurora-success'
                  : line.type === 'deleted'
                  ? 'bg-aurora-errorMuted/20 text-aurora-error'
                  : 'text-aurora-textSecondary'
              }`}
            >
              {/* Old Line # */}
              <div className="w-10 px-2 py-0.5 text-right text-[10px] text-aurora-textMuted select-none border-r border-aurora-borderSubtle bg-aurora-sidebar/30">
                {line.oldLine || ''}
              </div>
              {/* New Line # */}
              <div className="w-10 px-2 py-0.5 text-right text-[10px] text-aurora-textMuted select-none border-r border-aurora-borderSubtle bg-aurora-sidebar/30">
                {line.newLine || ''}
              </div>
              {/* Code Line Content */}
              <div className="flex-1 px-3 py-0.5 font-mono whitespace-pre overflow-x-auto">
                {line.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="px-3 py-1.5 bg-aurora-secondary border-t border-aurora-border text-[11px] text-aurora-textMuted flex items-center justify-between">
        <span>Click on any line to select & link a discussion to that exact code location</span>
        {selectedLines.length > 0 && (
          <span className="text-aurora-primary font-mono font-medium">
            Line {selectedLines.join(', ')} selected
          </span>
        )}
      </div>
    </div>
  );
};
