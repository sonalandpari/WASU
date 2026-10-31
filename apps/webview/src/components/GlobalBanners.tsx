import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { WifiOff, RefreshCw, AlertTriangle, AlertCircle } from 'lucide-react';

export const GlobalBanners: React.FC = () => {
  const { connectionStatus, setConnectionStatus } = useAppStore();

  if (connectionStatus === 'connected') return null;

  return (
    <div
      className={`px-4 py-2 border-b flex items-center justify-between text-xs select-none transition-colors ${
        connectionStatus === 'reconnecting'
          ? 'bg-amber-100/90 border-amber-300 text-amber-900'
          : 'bg-rose-100/90 border-rose-300 text-rose-900'
      }`}
    >
      <div className="flex items-center gap-2">
        {connectionStatus === 'reconnecting' ? (
          <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
        ) : (
          <WifiOff className="w-4 h-4 text-rose-700" />
        )}
        <span className="font-semibold">
          {connectionStatus === 'reconnecting'
            ? 'Backend connection lost. Reconnecting to ContextFlow real-time gateway...'
            : 'Disconnected from ContextFlow backend server. Running in standalone local simulation mode.'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {connectionStatus === 'disconnected' && (
          <button
            onClick={() => setConnectionStatus('reconnecting')}
            className="px-3 py-1 rounded-xl neu-btn text-slate-800 text-[11px] font-semibold hover:text-indigo-600 transition-all cursor-pointer"
          >
            Reconnect Now
          </button>
        )}
      </div>
    </div>
  );
};
