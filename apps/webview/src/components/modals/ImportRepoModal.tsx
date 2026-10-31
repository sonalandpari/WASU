import React, { useState } from 'react';
import {
  X,
  GitFork,
  Loader2,
  FolderGit2,
  Star,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { parseRepoInput, fetchPublicRepo } from '../../services/githubService';
import { useAppStore } from '../../store/useAppStore';

interface ImportRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_REPOS = [
  { name: 'sonalandpari/WASU', desc: 'RERO Official Hackathon Monorepo' },
  { name: 'facebook/react', desc: 'The library for web and native user interfaces' },
  { name: 'shadcn-ui/ui', desc: 'Beautifully designed components' },
];

export const ImportRepoModal: React.FC<ImportRepoModalProps> = ({ isOpen, onClose }) => {
  const [repoInput, setRepoInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    setProjectName,
    setCurrentBranch,
    setRepositoryName,
    setRoomCode,
    setEvents,
    setPresence,
    setGraph,
  } = useAppStore();

  if (!isOpen) return null;

  const handleImport = async (target?: string) => {
    const input = target || repoInput;
    const parsed = parseRepoInput(input);
    if (!parsed) {
      setError('Please enter a valid format: "owner/repo" or "https://github.com/owner/repo"');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const data = await fetchPublicRepo(parsed.owner, parsed.repo);

      // Hydrate Store
      setProjectName(data.projectName);
      setRepositoryName(data.repositoryName);
      setCurrentBranch(data.currentBranch);
      setRoomCode(data.roomCode);
      if (data.events.length > 0) setEvents(data.events);
      if (data.presence.length > 0) setPresence(data.presence);
      if (data.graph) setGraph(data.graph);

      setSuccessMsg(`Successfully imported ${data.repositoryName}! (${data.events.length} commits, ${data.presence.length} contributors)`);
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to import repository.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <GitFork className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">Import Public GitHub Repo</h3>
              <p className="text-[11px] text-zinc-400">Stream live commits, active contributors, and AST graphs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
              Repository Name or URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={repoInput}
                onChange={(e) => {
                  setRepoInput(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. facebook/react or https://github.com/owner/repo"
                disabled={isLoading}
                onKeyDown={(e) => e.key === 'Enter' && handleImport()}
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700/80 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
              />
              <button
                onClick={() => handleImport()}
                disabled={isLoading || !repoInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all shrink-0 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <span>Import</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 block mb-2 uppercase tracking-wider">
              Try Sample Repositories:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {PRESET_REPOS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setRepoInput(preset.name);
                    handleImport(preset.name);
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-700 text-left transition-colors group cursor-pointer"
                >
                  <div className="truncate">
                    <span className="text-xs font-mono font-semibold text-zinc-200 group-hover:text-indigo-400 transition-colors">
                      {preset.name}
                    </span>
                    <p className="text-[10px] text-zinc-500 truncate">{preset.desc}</p>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 shrink-0 ml-2 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
