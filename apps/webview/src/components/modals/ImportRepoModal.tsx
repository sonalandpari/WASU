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
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { parseRepoInput, fetchPublicRepo, getGitHubToken, setGitHubToken } from '../../services/githubService';
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
  const [tokenInput, setTokenInput] = useState(getGitHubToken());
  const [showTokenInput, setShowTokenInput] = useState(false);
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

  const handleSaveToken = (val: string) => {
    setTokenInput(val);
    setGitHubToken(val);
  };

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
      if (data.events && data.events.length > 0) setEvents(data.events);
      if (data.presence && data.presence.length > 0) setPresence(data.presence);
      if (data.graph) setGraph(data.graph);

      if (data.isRateLimitedSnapshot) {
        setSuccessMsg(`⚡ Imported snapshot for ${data.repositoryName}! (GitHub 60 req/hr limit bypassed with instant offline fallback)`);
      } else {
        setSuccessMsg(`Successfully imported live ${data.repositoryName}! (${data.events.length} commits, ${data.presence.length} contributors)`);
      }

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Failed to import repository.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg neu-surface rounded-3xl shadow-neu-flat-lg overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-neu-bg">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl neu-surface-sm text-indigo-600">
              <GitFork className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Import Public GitHub Repo</h3>
              <p className="text-[11px] text-slate-500">Stream live commits, active contributors, and AST graphs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
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
                className="flex-1 px-3.5 py-2.5 rounded-xl neu-input text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-mono transition-all"
              />
              <button
                onClick={() => handleImport()}
                disabled={isLoading || !repoInput.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl neu-btn-primary disabled:opacity-40 text-white text-xs font-bold shadow-neu-primary transition-all shrink-0 cursor-pointer"
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

            {/* Optional GitHub Token Accordion */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-medium"
              >
                <KeyRound className="w-3 h-3 text-slate-400" />
                <span>{showTokenInput ? 'Hide GitHub Token Settings' : 'Have a GitHub Token? (Expands limit to 5,000 req/hr)'}</span>
                {tokenInput && (
                  <span className="flex items-center gap-0.5 text-emerald-600 font-semibold ml-1">
                    <ShieldCheck className="w-3 h-3" /> Token Active
                  </span>
                )}
              </button>

              {showTokenInput && (
                <div className="mt-2 p-3 rounded-2xl neu-surface-sm space-y-2 border border-slate-200/60 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">GitHub Personal Access Token</span>
                    <span className="text-[10px] text-slate-400">Stored locally in browser</span>
                  </div>
                  <input
                    type="password"
                    value={tokenInput}
                    onChange={(e) => handleSaveToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx (Optional, public repo read-only)"
                    className="w-full px-3 py-1.5 rounded-xl neu-input text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Unauthenticated GitHub requests are capped at 60/hr. Adding a free token raises your limit to 5,000/hr. If exceeded without a token, RERO automatically serves instant realistic snapshots with zero errors!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">
              Try Sample Repositories:
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_REPOS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => {
                    setRepoInput(preset.name);
                    handleImport(preset.name);
                  }}
                  disabled={isLoading}
                  className="flex items-center justify-between p-3 rounded-2xl neu-surface-sm hover:neu-btn transition-all text-left group cursor-pointer"
                >
                  <div className="truncate">
                    <span className="text-xs font-mono font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                      {preset.name}
                    </span>
                    <p className="text-[10px] text-slate-500 truncate">{preset.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white px-2.5 py-1 rounded-lg shadow-neu-flat-sm shrink-0 ml-2 group-hover:neu-btn-primary group-hover:text-white transition-all">
                    Load
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs animate-in fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
