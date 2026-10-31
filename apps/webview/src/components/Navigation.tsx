import React from 'react';
import { useAppStore, ActiveTab } from '../store/useAppStore';
import { Activity, Network, MessageSquareCode, FileBarChart, Settings } from 'lucide-react';

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab, discussions, events } = useAppStore();

  const navItems: NavItem[] = [
    { id: 'activity', label: 'Activity', icon: Activity, badge: events.length },
    { id: 'architecture', label: 'Architecture', icon: Network },
    { id: 'discussions', label: 'Discussions', icon: MessageSquareCode, badge: discussions.length },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <aside className="w-52 bg-neu-bg border-r border-white/70 flex flex-col justify-between p-3 select-none shrink-0 shadow-neu-flat-sm text-slate-800">
      <div className="space-y-1.5">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'neu-input text-indigo-600 shadow-neu-inset font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:scale-[1.02]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono tabular-nums font-bold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700 shadow-neu-badge'
                      : 'neu-surface-sm text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-white/70">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'neu-input text-indigo-600 shadow-neu-inset font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:scale-[1.02]'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
