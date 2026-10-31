import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Settings, Server, User, Palette, Database, ShieldCheck, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    connectionStatus,
    setConnectionStatus,
    projectName,
    currentBranch,
  } = useAppStore();

  const [backendUrl, setBackendUrl] = useState('http://localhost:4000');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-aurora-bg overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Title */}
        <div className="border-b border-aurora-border pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-aurora-textPrimary">Project Settings & Connections</h2>
            <p className="text-xs text-aurora-textSecondary mt-0.5">
              Manage local backend URL, synchronization triggers, and developer identity.
            </p>
          </div>
          <Settings className="w-5 h-5 text-aurora-primary" />
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Backend Connection */}
          <div className="p-4 rounded-lg bg-aurora-card border border-aurora-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-aurora-textPrimary">
              <Server className="w-4 h-4 text-aurora-primary" />
              <span>Backend & Socket.IO Gateway</span>
            </div>

            <div>
              <label className="text-xs text-aurora-textSecondary block mb-1">Gateway URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs font-mono text-aurora-textPrimary focus:outline-none focus:border-aurora-primary"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-aurora-textSecondary">Connection Status:</span>
                <span className="text-xs font-mono font-semibold capitalize text-aurora-primary">
                  {connectionStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConnectionStatus(connectionStatus === 'connected' ? 'disconnected' : 'connected')
                }
                className="px-2.5 py-1 rounded bg-aurora-secondary border border-aurora-border text-xs text-aurora-textSecondary hover:text-aurora-primary transition-colors"
              >
                Toggle Mock State
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 rounded-lg bg-aurora-card border border-aurora-border space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-aurora-textPrimary">
              <User className="w-4 h-4 text-aurora-primary" />
              <span>Developer Identity</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">Display Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.name}
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs text-aurora-textPrimary opacity-80"
                />
              </div>
              <div>
                <label className="text-xs text-aurora-textSecondary block mb-1">User ID</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.id}
                  className="w-full bg-aurora-secondary border border-aurora-border rounded px-3 py-1.5 text-xs font-mono text-aurora-textPrimary opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Theme & Styling */}
          <div className="p-4 rounded-lg bg-aurora-card border border-aurora-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-aurora-textPrimary">
              <Palette className="w-4 h-4 text-aurora-primary" />
              <span>Theme System</span>
            </div>
            <p className="text-xs text-aurora-textSecondary">
              Active Theme: <strong className="text-aurora-textPrimary">Arctic Aurora (Dark)</strong>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-aurora-primary text-aurora-bg text-xs font-semibold hover:bg-aurora-primary/90 transition-colors shadow-sm"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
