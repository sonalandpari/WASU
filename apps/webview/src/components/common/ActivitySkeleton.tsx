import React from 'react';

export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="space-y-3 p-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 bg-aurora-card/60 border border-aurora-border rounded-lg flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-aurora-secondary shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-20 bg-aurora-secondary rounded" />
              <div className="h-3 w-14 bg-aurora-secondary rounded" />
              <div className="h-2.5 w-12 bg-aurora-secondary rounded ml-auto" />
            </div>
            <div className="h-3 w-4/5 bg-aurora-secondary/70 rounded" />
            <div className="h-4 w-32 bg-aurora-secondary/50 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
