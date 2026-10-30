import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ActivityCard } from './ActivityCard';
import { vsCodeBridge } from '../services/vscodeBridge';
import { Search, Filter, RefreshCw, User, Layers, Inbox } from 'lucide-react';
import { ProjectEvent } from '@contextflow/shared';

export const ActivityFeed: React.FC = () => {
  const {
    events,
    searchQuery,
    setSearchQuery,
    selectedEventType,
    setSelectedEventType,
    selectedMemberId,
    setSelectedMemberId,
    presence,
  } = useAppStore();

  const eventTypeOptions = [
    { value: 'ALL', label: 'All Activities' },
    { value: 'FILE_SAVED', label: 'File Saves' },
    { value: 'COMMIT_CREATED', label: 'Commits' },
    { value: 'BRANCH_SWITCHED', label: 'Branch Swaps' },
    { value: 'ARCHITECTURE_UPDATED', label: 'Architecture' },
    { value: 'MEMBER_JOINED', label: 'Member Activity' },
  ];

  // Group consecutive file saves by the same user & file within short intervals
  const groupedEvents = useMemo(() => {
    const result: ProjectEvent[] = [];
    events.forEach((curr) => {
      if (curr.type === 'FILE_SAVED' && result.length > 0) {
        const prev = result[result.length - 1];
        if (
          prev.type === 'FILE_SAVED' &&
          prev.userId === curr.userId &&
          prev.metadata?.file === curr.metadata?.file
        ) {
          prev.metadata = {
            ...prev.metadata,
            count: (prev.metadata?.count || 1) + 1,
          };
          prev.timestamp = curr.timestamp;
          return;
        }
      }
      result.push({ ...curr });
    });
    return result;
  }, [events]);

  const filteredEvents = useMemo(() => {
    return groupedEvents.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesUser = item.userName.toLowerCase().includes(q);
        const matchesFile = item.metadata?.file?.toLowerCase().includes(q) || false;
        const matchesBranch = item.metadata?.branch?.toLowerCase().includes(q) || false;
        if (!matchesDesc && !matchesUser && !matchesFile && !matchesBranch) return false;
      }

      // Event type filter
      if (selectedEventType !== 'ALL') {
        if (selectedEventType === 'BRANCH_SWITCHED') {
          if (item.type !== 'BRANCH_SWITCHED' && item.type !== 'BRANCH_CREATED') return false;
        } else if (selectedEventType === 'MEMBER_JOINED') {
          if (item.type !== 'MEMBER_JOINED' && item.type !== 'MEMBER_LEFT') return false;
        } else if (item.type !== selectedEventType) {
          return false;
        }
      }

      // Member filter
      if (selectedMemberId !== 'ALL' && item.userId !== selectedMemberId) {
        return false;
      }

      return true;
    });
  }, [groupedEvents, searchQuery, selectedEventType, selectedMemberId]);

  const handleRefresh = () => {
    vsCodeBridge.postMessage({ type: 'REFRESH_ACTIVITY' });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-aurora-bg overflow-hidden">
      {/* Control Toolbar */}
      <div className="p-3 border-b border-aurora-border flex items-center justify-between gap-3 bg-aurora-secondary/50">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-aurora-textMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity, files, commits..."
              className="w-full bg-aurora-card border border-aurora-border rounded-md pl-8 pr-3 py-1.5 text-xs text-aurora-textPrimary placeholder:text-aurora-textMuted focus:outline-none focus:border-aurora-primary transition-colors"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          {/* Event type filter */}
          <div className="flex items-center gap-1.5 bg-aurora-card border border-aurora-border rounded-md px-2 py-1">
            <Filter className="w-3 h-3 text-aurora-textMuted" />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-transparent text-xs text-aurora-textSecondary focus:outline-none cursor-pointer"
            >
              {eventTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-aurora-card text-aurora-textPrimary">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member filter */}
          <div className="flex items-center gap-1.5 bg-aurora-card border border-aurora-border rounded-md px-2 py-1">
            <User className="w-3 h-3 text-aurora-textMuted" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-xs text-aurora-textSecondary focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-aurora-card text-aurora-textPrimary">All Members</option>
              {presence.map((member) => (
                <option key={member.id} value={member.id} className="bg-aurora-card text-aurora-textPrimary">
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md bg-aurora-card border border-aurora-border text-aurora-textSecondary hover:text-aurora-primary hover:border-aurora-primary transition-colors"
            title="Refresh Activity"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <ActivityCard key={event.id} event={event} />)
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-aurora-border rounded-lg bg-aurora-card/20">
            <Inbox className="w-8 h-8 text-aurora-textMuted mb-2 opacity-60" />
            <h3 className="text-sm font-semibold text-aurora-textPrimary">No activities match your filters</h3>
            <p className="text-xs text-aurora-textSecondary mt-1 max-w-sm">
              Try adjusting your search criteria or event filters, or wait for teammate activities to sync.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
