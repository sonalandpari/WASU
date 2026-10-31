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
    <div className="flex-1 flex flex-col h-full bg-neu-bg overflow-hidden">
      {/* Sleek Neumorphic Toolbar */}
      <div className="px-3.5 py-2.5 border-b border-white/60 flex items-center justify-between gap-3 bg-neu-bg shrink-0">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter commits, messages, files..."
              className="w-full neu-input rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Minimal Filters */}
        <div className="flex items-center gap-2">
          {/* Event type filter */}
          <div className="flex items-center gap-1.5 neu-btn rounded-xl px-2.5 py-1.5 text-slate-700">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
            >
              {eventTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-slate-800">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Member filter (if presence available) */}
          {Array.isArray(presence) && presence.length > 0 && (
            <div className="flex items-center gap-1.5 neu-btn rounded-xl px-2.5 py-1.5 text-slate-700">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-white text-slate-800">All Members</option>
                {presence.map((member) => (
                  <option key={member.id} value={member.id} className="bg-white text-slate-800">
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl neu-btn text-slate-500 hover:text-slate-800 transition-all focus:outline-none cursor-pointer"
            title="Scan for new commits & sync"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3">
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

      {/* Live In-Editor Team Chat Bar (Neumorphic Dock) */}
      <div className="p-3 border-t border-white/60 bg-neu-bg shrink-0 shadow-neu-flat-sm">
        <form onSubmit={handleSendChat} className="flex items-center gap-2.5">
          <UserAvatar name={currentUser?.name} avatar={currentUser?.avatar} size="sm" />

          <div className="relative flex-1">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message #${roomCode || 'WASU'} team... (Enter to send)`}
              className="w-full neu-input rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2.5 rounded-xl neu-btn-primary disabled:opacity-40 text-white transition-all shrink-0 cursor-pointer focus:outline-none shadow-neu-primary"
            title="Send Message (Enter)"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
