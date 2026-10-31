import React from 'react';

export const ActivitySkeleton: React.FC = () => {
  return (
    <div className="space-y-3.5 p-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 rounded-2xl neu-card shadow-neu-flat-sm flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-xl bg-slate-300/80 shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-24 bg-slate-300/80 rounded-md" />
              <div className="h-3.5 w-16 bg-slate-300/60 rounded-md" />
              <div className="h-3 w-14 bg-slate-300/50 rounded-md ml-auto" />
            </div>
            <div className="h-3.5 w-4/5 bg-slate-300/70 rounded-md" />
            <div className="h-4 w-32 bg-slate-300/50 rounded-md mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};
