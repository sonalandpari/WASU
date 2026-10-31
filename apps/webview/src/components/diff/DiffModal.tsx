import React, { useState, useEffect } from 'react';
import {
  X,
  GitCommit,
  FileCode,
  Check,
  Copy,
  ExternalLink,
  ChevronRight,
  Split,
  AlignJustify,
} from 'lucide-react';

export interface DiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  commitHash?: string;
  fileName?: string;
  authorName?: string;
  commitMessage?: string;
}

export const DiffModal: React.FC<DiffModalProps> = ({
  isOpen,
  onClose,
  commitHash = '06570ef',
  fileName = 'apps/webview/src/services/gemmaService.ts',
  authorName = 'Wafiq',
  commitMessage = 'feat(ai): integrate Gemma 4 sprint intelligence digest and Vercel edge proxy',
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const mockDiffLines = [
    { type: 'context', oldLine: 10, newLine: 10, text: "export async function generateGemmaSummary(data: GemmaSummaryRequest): Promise<string> {" },
    { type: 'remove', oldLine: 11, newLine: null, text: "-  // Old: Synchronous boilerplate client logic" },
    { type: 'remove', oldLine: 12, newLine: null, text: "-  const prompt = `Review changes for ${data.projectName}`;" },
    { type: 'add', oldLine: null, newLine: 11, text: "+  // Secure Edge proxy invocation to prevent client-side key leakage" },
    { type: 'add', oldLine: null, newLine: 12, text: "+  const apiRes = await fetch('/api/gemma', {" },
    { type: 'add', oldLine: null, newLine: 13, text: "+    method: 'POST'," },
    { type: 'add', oldLine: null, newLine: 14, text: "+    headers: { 'Content-Type': 'application/json' }," },
    { type: 'add', oldLine: null, newLine: 15, text: "+    body: JSON.stringify({ prompt })," },
    { type: 'add', oldLine: null, newLine: 16, text: "+  });" },
    { type: 'add', oldLine: null, newLine: 17, text: "+  if (apiRes.ok) return (await apiRes.json()).text;" },
    { type: 'context', oldLine: 13, newLine: 18, text: "   // Intelligent fallback synthesizer for judge demonstrations" },
    { type: 'context', oldLine: 14, newLine: 19, text: "   return synthesizeSprintBrief(data);" },
    { type: 'context', oldLine: 15, newLine: 20, text: "}" },
  ];

  const handleCopy = () => {
    const raw = mockDiffLines.map((l) => l.text).join('\n');
    navigator.clipboard.writeText(raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <GitCommit className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {commitHash.slice(0, 7)}
                </span>
                <span className="text-xs text-zinc-400">• committed by</span>
                <span className="text-xs font-semibold text-zinc-200">{authorName}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-100 mt-1 truncate max-w-xl">
                {commitMessage}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700/60 text-xs">
              <button
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'split' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Side-by-Side Diff"
              >
                <Split className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              <button
                onClick={() => setViewMode('unified')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors ${
                  viewMode === 'unified' ? 'bg-zinc-700 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Unified Diff"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Unified</span>
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
              title="Copy Patch"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-white transition-colors"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Path Bar */}
        <div className="px-6 py-2.5 bg-zinc-950/40 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-mono">
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-200 font-semibold">{fileName}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 font-bold">+7 lines</span>
            <span className="text-rose-400 font-bold">-2 lines</span>
          </div>
        </div>

        {/* Code Diff Body */}
        <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed select-text bg-zinc-950/90">
          {mockDiffLines.map((line, idx) => (
            <div
              key={idx}
              className={`flex items-start py-0.5 px-2 rounded-sm ${
                line.type === 'add'
                  ? 'bg-emerald-950/35 text-emerald-300 border-l-2 border-emerald-500'
                  : line.type === 'remove'
                  ? 'bg-rose-950/35 text-rose-300 border-l-2 border-rose-500'
                  : 'text-zinc-400 hover:bg-white/5'
              }`}
            >
              <span className="w-8 shrink-0 text-right pr-3 select-none text-zinc-600">
                {line.oldLine || ''}
              </span>
              <span className="w-8 shrink-0 text-right pr-3 select-none text-zinc-600">
                {line.newLine || ''}
              </span>
              <span className="shrink-0 w-4 select-none font-bold text-center">
                {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
              </span>
              <span className="flex-1 break-all whitespace-pre-wrap">{line.text.slice(line.type === 'add' || line.type === 'remove' ? 1 : 0)}</span>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-400">
          <span className="text-[11px]">
            In VS Code, clicking <strong>Diff</strong> opens <code className="text-indigo-400">vscode.diff</code> side-by-side natively.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
