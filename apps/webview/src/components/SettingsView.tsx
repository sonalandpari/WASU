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
    <div className="flex-1 flex flex-col h-full bg-neu-bg overflow-y-auto p-6 text-slate-800">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Title */}
        <div className="border-b border-white/70 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Project Settings & Connections</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage local backend URL, synchronization triggers, and developer identity.
            </p>
          </div>
          <div className="p-2 rounded-xl neu-surface-sm text-indigo-600 shadow-neu-flat-sm">
            <Settings className="w-5 h-5" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          {/* Backend Connection */}
          <div className="p-5 rounded-2xl neu-card space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Backend & Socket.IO Gateway</span>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-semibold block mb-1">Gateway URL</label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Connection Status:</span>
                <span className="text-xs font-mono font-bold capitalize text-indigo-600">
                  {connectionStatus}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setConnectionStatus(connectionStatus === 'connected' ? 'disconnected' : 'connected')
                }
                className="px-3 py-1.5 rounded-xl neu-btn text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all cursor-pointer"
              >
                Toggle Mock State
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-5 rounded-2xl neu-card space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <User className="w-4 h-4 text-indigo-600" />
              <span>Developer Identity</span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">Display Name</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.name}
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs text-slate-700 opacity-90 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 font-semibold block mb-1">User ID</label>
                <input
                  type="text"
                  readOnly
                  value={currentUser.id}
                  className="w-full neu-input rounded-xl px-3.5 py-2 text-xs font-mono text-slate-700 opacity-90 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Theme & Styling */}
          <div className="p-5 rounded-2xl neu-card space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Theme System</span>
            </div>
            <p className="text-xs text-slate-600">
              Active Theme: <strong className="text-indigo-600 font-bold">Neumorphic Tactile Light (Soft UI)</strong>
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl neu-btn-primary shadow-neu-primary text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Saved Settings</span>
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
