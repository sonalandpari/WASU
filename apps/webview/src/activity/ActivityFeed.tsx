import React, { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ActivityCard } from './ActivityCard';
import { vsCodeBridge } from '../services/vscodeBridge';
import { Search, Filter, RefreshCw, User, Inbox, SlidersHorizontal } from 'lucide-react';
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
      {/* Sleek Minimal Toolbar */}
      <div className="px-4 py-2.5 border-b border-aurora-border flex items-center justify-between gap-3 bg-zinc-950/40 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter timeline, files, commits..."
              className="w-full bg-zinc-900/60 border border-white/[0.08] focus:border-indigo-500/50 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Minimal Filters */}
        <div className="flex items-center gap-2">
          {/* Event type filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-white/[0.08] rounded-md px-2 py-1">
            <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              {eventTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-200">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900/60 border border-white/[0.08] rounded-md px-2 py-1">
            <User className="w-3 h-3 text-zinc-500" />
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-zinc-900 text-zinc-200">All Members</option>
              {presence.map((member) => (
                <option key={member.id} value={member.id} className="bg-zinc-900 text-zinc-200">
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-1 rounded-md bg-zinc-900/60 border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:border-white/20 transition-colors"
            title="Refresh Timeline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <ActivityCard key={event.id} event={event} />)
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/[0.08] rounded-xl bg-zinc-900/20">
            <Inbox className="w-7 h-7 text-zinc-600 mb-2" />
            <h3 className="text-xs font-medium text-zinc-300">No events found</h3>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-xs">
              Waiting for commits, saves, or messages to stream from your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
