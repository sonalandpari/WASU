import { create } from 'zustand';
import {
  ProjectEvent,
  UserPresence,
  Discussion,
  ArchitectureGraph,
  WebviewInitialState,
} from '@contextflow/shared';
import { vsCodeBridge } from '../services/vscodeBridge';
import { SEED_EVENTS, SEED_PRESENCE, SEED_DISCUSSIONS } from './seedData';

export type ActiveTab = 'activity' | 'architecture' | 'discussions' | 'reports' | 'settings';

interface AppStore {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Project & Developer Info
  projectId: string;
  projectName: string;
  setProjectName: (name: string) => void;
  currentBranch: string;
  setCurrentBranch: (branch: string) => void;
  workspacePath: string;
  repositoryName: string;
  setRepositoryName: (name: string) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
    email?: string;
  };

  // Modals
  isDiffModalOpen: boolean;
  diffModalData: {
    commitHash?: string;
    fileName?: string;
    authorName?: string;
    commitMessage?: string;
  };
  openDiffModal: (data?: { commitHash?: string; fileName?: string; authorName?: string; commitMessage?: string }) => void;
  closeDiffModal: () => void;

  isImportModalOpen: boolean;
  openImportModal: () => void;
  closeImportModal: () => void;

  // Connection
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;

  // Presence
  presence: UserPresence[];
  setPresence: (presence: UserPresence[]) => void;
  updateUserPresence: (presence: UserPresence) => void;

  // Activity Feed & Chat
  events: ProjectEvent[];
  setEvents: (events: ProjectEvent[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedEventType: string;
  setSelectedEventType: (type: string) => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  addEvent: (event: ProjectEvent) => void;
  sendMessage: (content: string) => void;

  // Discussions
  discussions: Discussion[];
  selectedDiscussionId: string | null;
  setSelectedDiscussionId: (id: string | null) => void;
  addDiscussion: (discussion: Discussion) => void;
  addComment: (discussionId: string, comment: any) => void;

  // Architecture Graph
  graph: any | null;
  graphViewMode: 'technical' | 'executive';
  setGraphViewMode: (mode: 'technical' | 'executive') => void;
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
  setGraph: (graph: any) => void;

  // Reports
  reportType: 'technical' | 'executive';
  setReportType: (type: 'technical' | 'executive') => void;
  exportProgress: number | null;
  exportStatus: 'idle' | 'exporting' | 'success' | 'error';
  setExportStatus: (status: 'idle' | 'exporting' | 'success' | 'error', progress?: number | null) => void;

  // UI Toggles
  showPresencePanel: boolean;
  setShowPresencePanel: (show: boolean) => void;
  togglePresencePanel: () => void;
  showDevSimulator: boolean;
  setShowDevSimulator: (show: boolean) => void;
  toggleDevSimulator: () => void;

  // Initializer
  initFromState: (state: Partial<WebviewInitialState>) => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  activeTab: 'activity',
  setActiveTab: (tab) => set({ activeTab: tab }),

  showPresencePanel: false,
  setShowPresencePanel: (show) => set({ showPresencePanel: show }),
  togglePresencePanel: () => set((state) => ({ showPresencePanel: !state.showPresencePanel })),

  showDevSimulator: false,
  setShowDevSimulator: (show) => set({ showDevSimulator: show }),
  toggleDevSimulator: () => set((state) => ({ showDevSimulator: !state.showDevSimulator })),

  projectId: 'WASU',
  projectName: 'RERO',
  setProjectName: (name) => set({ projectName: name }),
  currentBranch: 'main',
  setCurrentBranch: (branch) => set({ currentBranch: branch }),
  workspacePath: '',
  repositoryName: 'sonalandpari/WASU',
  setRepositoryName: (name) => set({ repositoryName: name }),
  roomCode: 'WASU',
  setRoomCode: (code) => set({ roomCode: code }),
  currentUser: {
    id: 'user-wafiq',
    name: 'Wafiq (Lead)',
    avatar: 'W',
  },

  // Modals
  isDiffModalOpen: false,
  diffModalData: {},
  openDiffModal: (data) =>
    set({
      isDiffModalOpen: true,
      diffModalData: data || {
        commitHash: '06570ef',
        fileName: 'apps/webview/src/services/gemmaService.ts',
        authorName: 'Wafiq (Lead)',
        commitMessage: 'feat(ai): integrate Gemma 4 sprint intelligence digest and Vercel edge proxy',
      },
    }),
  closeDiffModal: () => set({ isDiffModalOpen: false, diffModalData: {} }),

  isImportModalOpen: false,
  openImportModal: () => set({ isImportModalOpen: true }),
  closeImportModal: () => set({ isImportModalOpen: false }),

  connectionStatus: 'connected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  presence: SEED_PRESENCE,
  setPresence: (presence) => set({ presence }),
  updateUserPresence: (item) =>
    set((state) => ({
      presence: state.presence.map((p) => (p.id === item.id ? { ...p, ...item } : p)),
    })),

  events: SEED_EVENTS,
  setEvents: (events) => set({ events }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedEventType: 'ALL',
  setSelectedEventType: (type) => set({ selectedEventType: type }),
  selectedMemberId: 'ALL',
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),

  sendMessage: (content: string) => {
    const text = content.trim();
    if (!text) return;
    const { currentUser, roomCode } = get();
    const newEvt: ProjectEvent = {
      id: `msg-${Date.now()}`,
      projectId: roomCode || 'WASU',
      type: 'CHAT_MESSAGE' as any,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || currentUser.name[0],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      description: text,
    };
    set((state) => ({ events: [newEvt, ...state.events] }));
    vsCodeBridge.postMessage({
      type: 'SEND_MESSAGE' as any,
      payload: {
        content: text,
        projectId: roomCode || 'WASU',
        userId: currentUser.id,
        userName: currentUser.name,
      },
    });
  },

  discussions: SEED_DISCUSSIONS,
  selectedDiscussionId: null,
  setSelectedDiscussionId: (id) => set({ selectedDiscussionId: id }),
  addDiscussion: (discussion) => set((state) => ({ discussions: [discussion, ...state.discussions] })),
  addComment: (discId, comment) =>
    set((state) => ({
      discussions: state.discussions.map((d) =>
        d.id === discId ? { ...d, comments: [...d.comments, comment] } : d
      ),
    })),

  // Architecture Graph
  graph: {
    nodes: [
      {
        id: 'node-app',
        type: 'custom',
        position: { x: 250, y: 50 },
        data: {
          label: 'App.tsx',
          path: 'apps/webview/src/App.tsx',
          module: 'UI / Shell',
          type: 'component',
          imports: ['ActivityFeed', 'Header'],
          exports: ['App'],
          modified: false,
          dependentCount: 2,
          lineCount: 75,
        },
      },
      {
        id: 'node-feed',
        type: 'custom',
        position: { x: 380, y: 160 },
        data: {
          label: 'ActivityFeed.tsx',
          path: 'apps/webview/src/activity/ActivityFeed.tsx',
          module: 'Activity',
          type: 'component',
          imports: ['ActivityCard', 'useAppStore'],
          exports: ['ActivityFeed'],
          modified: false,
          dependentCount: 4,
          lineCount: 140,
        },
      },
      {
        id: 'node-store',
        type: 'custom',
        position: { x: 250, y: 280 },
        data: {
          label: 'useAppStore.ts',
          path: 'apps/webview/src/store/useAppStore.ts',
          module: 'State Management',
          type: 'store',
          imports: ['zustand', 'vscodeBridge'],
          exports: ['useAppStore'],
          modified: false,
          dependentCount: 6,
          lineCount: 180,
        },
      },
      {
        id: 'node-shared',
        type: 'custom',
        position: { x: 250, y: 400 },
        data: {
          label: 'types.ts',
          path: 'packages/shared/src/types.ts',
          module: 'Shared Contracts',
          type: 'type',
          imports: [],
          exports: ['ProjectEvent', 'UserPresence', 'Discussion'],
          modified: false,
          dependentCount: 8,
          lineCount: 135,
        },
      },
    ],
    edges: [
      { id: 'e2', source: 'node-app', target: 'node-feed', animated: true },
      { id: 'e4', source: 'node-feed', target: 'node-store' },
      { id: 'e5', source: 'node-store', target: 'node-shared' },
    ],
  } as any,
  graphViewMode: 'technical',
  setGraphViewMode: (mode) => set({ graphViewMode: mode }),
  selectedNodeId: 'node-app',
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setGraph: (graph) => set({ graph }),

  reportType: 'executive',
  setReportType: (type) => set({ reportType: type }),
  exportProgress: null,
  exportStatus: 'idle',
  setExportStatus: (status, progress = null) => set({ exportStatus: status, exportProgress: progress }),

  initFromState: (initialState) =>
    set((state) => ({
      ...state,
      ...initialState,
      events: initialState.events && initialState.events.length > 0 ? initialState.events : state.events,
      presence: initialState.presence && initialState.presence.length > 0 ? initialState.presence : state.presence,
    })),
}));

// Wire up VS Code bridge listeners to store
vsCodeBridge.onMessage((msg) => {
  const store = useAppStore.getState();
  switch (msg.type) {
    case 'INIT_STATE':
      store.initFromState(msg.payload);
      break;
    case 'EVENT_RECEIVED':
      store.addEvent(msg.payload);
      break;
    case 'PRESENCE_UPDATED':
      store.setPresence(msg.payload);
      break;
    case 'GRAPH_UPDATED':
      store.setGraph(msg.payload);
      break;
    case 'DISCUSSIONS_UPDATED':
      if (Array.isArray(msg.payload)) {
        useAppStore.setState({ discussions: msg.payload });
      }
      break;
    case 'CONNECTION_STATUS_CHANGED':
      store.setConnectionStatus(msg.payload.status);
      break;
    case 'GIT_INFO_CHANGED':
      useAppStore.setState({
        currentBranch: msg.payload.branch,
        repositoryName: msg.payload.repositoryName,
      });
      break;
    default:
      break;
  }
});

// Signal extension host that webview is mounted and ready
if (typeof window !== 'undefined') {
  vsCodeBridge.postMessage({ type: 'READY' });
}
