import { create } from 'zustand';
import {
  ProjectEvent,
  UserPresence,
  Discussion,
  ArchitectureGraph,
  WebviewInitialState,
} from '@contextflow/shared';
import { vsCodeBridge } from '../services/vscodeBridge';

export type ActiveTab = 'activity' | 'architecture' | 'discussions' | 'reports' | 'settings';

interface AppStore {
  // Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Project Info
  projectId: string;
  projectName: string;
  currentBranch: string;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };

  // Connection
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;

  // Presence
  presence: UserPresence[];
  setPresence: (presence: UserPresence[]) => void;
  updateUserPresence: (presence: UserPresence) => void;

  // Activity Feed
  events: ProjectEvent[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedEventType: string;
  setSelectedEventType: (type: string) => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  addEvent: (event: ProjectEvent) => void;

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

  // Initializer
  initFromState: (state: Partial<WebviewInitialState>) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeTab: 'activity',
  setActiveTab: (tab) => set({ activeTab: tab }),

  projectId: 'rero-demo',
  projectName: 'RERO',
  currentBranch: 'ali',
  currentUser: {
    id: 'user-ali',
    name: 'Ali (UI Lead)',
    avatar: 'A',
  },

  connectionStatus: 'connected',
  setConnectionStatus: (status) => set({ connectionStatus: status }),

  presence: [
    {
      id: 'user-ali',
      name: 'Ali (UI Lead)',
      avatar: 'A',
      online: true,
      activeFile: 'apps/webview/src/App.tsx',
      lastActive: 'Just now',
    },
    {
      id: 'user-zalulu',
      name: 'Master Zalulu',
      avatar: 'Z',
      online: true,
      activeFile: 'backend/src/server.ts',
      lastActive: '2m ago',
    },
    {
      id: 'user-arch',
      name: 'Graph Lead',
      avatar: 'G',
      online: true,
      activeFile: 'scanner/src/dependencyEngine.ts',
      lastActive: '5m ago',
    },
    {
      id: 'user-ext',
      name: 'Extension Lead',
      avatar: 'E',
      online: false,
      activeFile: 'extension/src/git/gitWatcher.ts',
      lastActive: '18m ago',
    },
  ],
  setPresence: (presence) => set({ presence }),
  updateUserPresence: (item) =>
    set((state) => ({
      presence: state.presence.map((p) => (p.id === item.id ? { ...p, ...item } : p)),
    })),

  events: [
    {
      id: 'evt-1',
      projectId: 'contextflow-demo',
      type: 'BRANCH_SWITCHED',
      userId: 'user-ali',
      userName: 'Ali (UI Lead)',
      userAvatar: 'A',
      timestamp: '10:42 AM',
      description: 'Switched branch to ali',
      metadata: { branch: 'ali' },
    },
    {
      id: 'evt-2',
      projectId: 'contextflow-demo',
      type: 'FILE_SAVED',
      userId: 'user-ali',
      userName: 'Ali (UI Lead)',
      userAvatar: 'A',
      timestamp: '10:45 AM',
      description: 'Saved apps/webview/src/App.tsx',
      metadata: { file: 'apps/webview/src/App.tsx', count: 4 },
    },
    {
      id: 'evt-3',
      projectId: 'contextflow-demo',
      type: 'COMMIT_CREATED',
      userId: 'user-zalulu',
      userName: 'Master Zalulu',
      userAvatar: 'Z',
      timestamp: '10:50 AM',
      description: 'feat(api): implement Socket.IO project room sync',
      metadata: {
        commitHash: '8b7f1a4',
        commitMessage: 'feat(api): implement Socket.IO project room sync',
        diffSummary: { added: 142, deleted: 18 },
      },
    },
    {
      id: 'evt-4',
      projectId: 'contextflow-demo',
      type: 'ARCHITECTURE_UPDATED',
      userId: 'user-arch',
      userName: 'Graph Lead',
      userAvatar: 'G',
      timestamp: '10:52 AM',
      description: 'Dependency AST scan completed: 42 files indexed',
      metadata: { nodeCount: 42, edgeCount: 88 },
    },
  ],
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedEventType: 'ALL',
  setSelectedEventType: (type) => set({ selectedEventType: type }),
  selectedMemberId: 'ALL',
  setSelectedMemberId: (id) => set({ selectedMemberId: id }),
  addEvent: (event) => set((state) => ({ events: [event, ...state.events] })),

  discussions: [
    {
      id: 'disc-1',
      projectId: 'contextflow-demo',
      title: 'Optimize React Flow node re-renders on file change',
      authorId: 'user-ali',
      authorName: 'Ali (UI Lead)',
      authorAvatar: 'A',
      createdAt: '10:15 AM',
      updatedAt: '10:30 AM',
      status: 'open',
      filePath: 'apps/webview/src/architecture/ArchitectureView.tsx',
      lineStart: 42,
      lineEnd: 58,
      commitHash: '8b7f1a4',
      codeSnippet: `const onNodesChange = useCallback((changes: NodeChange[]) => {\n  setNodes((nds) => applyNodeChanges(changes, nds));\n}, []);`,
      comments: [
        {
          id: 'c-1',
          discussionId: 'disc-1',
          userId: 'user-ali',
          userName: 'Ali (UI Lead)',
          userAvatar: 'A',
          content: 'We should memoize custom nodes to prevent unnecessary layout recalculations on rapid file saves.',
          createdAt: '10:15 AM',
        },
        {
          id: 'c-2',
          discussionId: 'disc-1',
          userId: 'user-arch',
          userName: 'Graph Lead',
          userAvatar: 'G',
          content: 'Agreed! The scanner batches AST updates with a 300ms debounce so the node IDs stay stable.',
          createdAt: '10:30 AM',
        },
      ],
    },
  ],
  selectedDiscussionId: 'disc-1',
  setSelectedDiscussionId: (id) => set({ selectedDiscussionId: id }),
  addDiscussion: (discussion) => set((state) => ({ discussions: [discussion, ...state.discussions] })),
  addComment: (discId, comment) =>
    set((state) => ({
      discussions: state.discussions.map((d) =>
        d.id === discId ? { ...d, comments: [...d.comments, comment] } : d
      ),
    })),

  graph: ({
    summary: {
      totalFiles: 24,
      totalModules: 5,
      totalDependencies: 46,
      lastUpdated: 'Just now',
    },
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
          imports: ['Navigation', 'ActivityFeed', 'ArchitectureView'],
          exports: ['App'],
          modified: true,
          dependentCount: 0,
          lineCount: 140,
        },
      },
      {
        id: 'node-nav',
        type: 'custom',
        position: { x: 80, y: 180 },
        data: {
          label: 'Navigation.tsx',
          path: 'apps/webview/src/components/Navigation.tsx',
          module: 'UI / Shell',
          type: 'component',
          imports: ['useAppStore', 'lucide-react'],
          exports: ['Navigation'],
          modified: false,
          dependentCount: 1,
          lineCount: 95,
        },
      },
      {
        id: 'node-store',
        type: 'custom',
        position: { x: 250, y: 300 },
        data: {
          label: 'useAppStore.ts',
          path: 'apps/webview/src/store/useAppStore.ts',
          module: 'State Management',
          type: 'store',
          imports: ['zustand', '@contextflow/shared'],
          exports: ['useAppStore'],
          modified: false,
          dependentCount: 5,
          lineCount: 220,
        },
      },
      {
        id: 'node-feed',
        type: 'custom',
        position: { x: 420, y: 180 },
        data: {
          label: 'ActivityFeed.tsx',
          path: 'apps/webview/src/activity/ActivityFeed.tsx',
          module: 'Activity',
          type: 'component',
          imports: ['useAppStore', 'ActivityCard'],
          exports: ['ActivityFeed'],
          modified: false,
          dependentCount: 1,
          lineCount: 165,
        },
      },
      {
        id: 'node-shared',
        type: 'custom',
        position: { x: 250, y: 440 },
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
      { id: 'e1', source: 'node-app', target: 'node-nav', animated: true },
      { id: 'e2', source: 'node-app', target: 'node-feed', animated: true },
      { id: 'e3', source: 'node-nav', target: 'node-store' },
      { id: 'e4', source: 'node-feed', target: 'node-store' },
      { id: 'e5', source: 'node-store', target: 'node-shared' },
    ],
  } as any),
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
      // Update discussions
      break;
    case 'CONNECTION_STATUS_CHANGED':
      store.setConnectionStatus(msg.payload.status);
      break;
  }
});
