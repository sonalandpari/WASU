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
    <aside className="w-48 bg-aurora-sidebar border-r border-aurora-border flex flex-col justify-between p-2 select-none shrink-0">
      <div className="space-y-1">
        <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wider text-aurora-textMuted uppercase">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-aurora-card text-aurora-primary border-l-2 border-aurora-primary pl-2 shadow-sm'
                  : 'text-aurora-textSecondary hover:bg-aurora-cardHover hover:text-aurora-textPrimary'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-aurora-primary' : 'text-aurora-textSecondary'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-aurora-primaryMuted text-aurora-primary font-bold'
                      : 'bg-aurora-border text-aurora-textMuted'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-2 border-t border-aurora-border">
        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-aurora-card text-aurora-primary border-l-2 border-aurora-primary pl-2'
              : 'text-aurora-textSecondary hover:bg-aurora-cardHover hover:text-aurora-textPrimary'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
