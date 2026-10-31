import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ActivityCard } from './ActivityCard';
import { vsCodeBridge } from '../services/vscodeBridge';
import {
  Search,
  RefreshCw,
  User,
  Inbox,
  SlidersHorizontal,
  Send,
  MessageSquare,
  GitCommit,
  Save,
} from 'lucide-react';
import { ProjectEvent } from '@contextflow/shared';
import { UserAvatar } from '../components/common/UserAvatar';

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
    sendMessage,
    currentUser,
    roomCode,
  } = useAppStore();

  const [chatInput, setChatInput] = useState('');

  const eventTypeOptions = [
    { value: 'ALL', label: 'All Activity' },
    { value: 'COMMIT_CREATED', label: 'Git Commits' },
    { value: 'CHAT_MESSAGE', label: 'Team Chat' },
    { value: 'FILE_SAVED', label: 'File Saves' },
    { value: 'BRANCH_SWITCHED', label: 'Branch Swaps' },
    { value: 'MEMBER_JOINED', label: 'Member Activity' },
  ];

  // Group consecutive file saves by the same user & file within short intervals
  const groupedEvents = useMemo(() => {
    const result: ProjectEvent[] = [];
    const eventList = Array.isArray(events) ? events : [];
    eventList.forEach((curr) => {
      if (!curr) return;
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
      if (!item) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesUser = (item.userName || '').toLowerCase().includes(q);
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

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden">
      {/* Sleek Minimal Toolbar */}
      <div className="px-3 py-2 border-b border-zinc-800/80 flex items-center justify-between gap-2.5 bg-zinc-900/40 shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter commits, messages, files..."
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-700 rounded-md pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Minimal Filters */}
        <div className="flex items-center gap-1.5">
          {/* Event type filter */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1">
            <SlidersHorizontal className="w-3 h-3 text-zinc-400" />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              {eventTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-zinc-900 text-zinc-100">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member filter (if presence available) */}
          {Array.isArray(presence) && presence.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1">
              <User className="w-3 h-3 text-zinc-400" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-zinc-900 text-zinc-100">All Members</option>
                {presence.map((member) => (
                  <option key={member.id} value={member.id} className="bg-zinc-900 text-zinc-100">
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors focus:outline-none"
            title="Scan for new commits & sync"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((event) => <ActivityCard key={event.id} event={event} />)
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <Inbox className="w-7 h-7 text-zinc-600 mb-2" />
            <h3 className="text-xs font-semibold text-zinc-200">No events found</h3>
            <p className="text-[11px] text-zinc-400 mt-1 max-w-xs">
              Make a commit in your terminal or send a team message below to start your timeline.
            </p>
          </div>
        )}
      </div>

      {/* Live In-Editor Team Chat Bar */}
      <div className="p-2.5 border-t border-zinc-800/80 bg-zinc-900/80 backdrop-blur shrink-0">
        <form onSubmit={handleSendChat} className="flex items-center gap-2">
          <UserAvatar name={currentUser?.name} avatar={currentUser?.avatar} size="sm" />

          <div className="relative flex-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message #${roomCode || 'WASU'} team... (Enter to send)`}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-indigo-500/60 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white transition-all shadow-xs shrink-0 cursor-pointer focus:outline-none"
            title="Send Message (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
