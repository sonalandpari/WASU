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
          ? 'bg-aurora-warningMuted/30 border-aurora-warning/40 text-aurora-warning'
          : 'bg-aurora-errorMuted/30 border-aurora-error/40 text-aurora-error'
      }`}
    >
      <div className="flex items-center gap-2">
        {connectionStatus === 'reconnecting' ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span className="font-medium">
          {connectionStatus === 'reconnecting'
            ? 'Backend connection lost. Reconnecting to ContextFlow real-time gateway...'
            : 'Disconnected from ContextFlow backend server. Changes will not sync in real-time.'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {connectionStatus === 'disconnected' && (
          <button
            onClick={() => setConnectionStatus('reconnecting')}
            className="px-2 py-0.5 rounded bg-aurora-card border border-aurora-border text-aurora-textPrimary hover:border-aurora-primary transition-colors text-[11px]"
          >
            Reconnect Now
          </button>
        )}
      </div>
    </div>
  );
};
