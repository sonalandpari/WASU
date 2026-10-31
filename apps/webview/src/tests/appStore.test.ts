import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/useAppStore';

describe('useAppStore State Management', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeTab: 'activity',
      searchQuery: '',
      selectedEventType: 'ALL',
      selectedMemberId: 'ALL',
      connectionStatus: 'connected',
      events: [],
      discussions: [],
    });
  });

  it('updates active navigation tab', () => {
    const { setActiveTab } = useAppStore.getState();
    setActiveTab('architecture');
    expect(useAppStore.getState().activeTab).toBe('architecture');

    setActiveTab('reports');
    expect(useAppStore.getState().activeTab).toBe('reports');
  });

  it('adds and prepends new project events correctly', () => {
    const { addEvent } = useAppStore.getState();
    const mockEvent = {
      id: 'test-evt-1',
      projectId: 'contextflow-demo',
      type: 'COMMIT_CREATED' as const,
      userId: 'user-zalulu',
      userName: 'Master Zalulu',
      timestamp: '11:00 AM',
      description: 'feat: add socket presence logic',
    };

    addEvent(mockEvent);
    expect(useAppStore.getState().events).toHaveLength(1);
    expect(useAppStore.getState().events[0].id).toBe('test-evt-1');
  });

  it('handles connection status transitions', () => {
    const { setConnectionStatus } = useAppStore.getState();
    setConnectionStatus('reconnecting');
    expect(useAppStore.getState().connectionStatus).toBe('reconnecting');

    setConnectionStatus('disconnected');
    expect(useAppStore.getState().connectionStatus).toBe('disconnected');
  });

  it('manages discussions and thread comments', () => {
    const { addDiscussion, addComment } = useAppStore.getState();
    const mockDiscussion = {
      id: 'disc-test',
      projectId: 'contextflow-demo',
      title: 'Review React Flow integration',
      authorId: 'user-ali',
      authorName: 'Ali (UI Lead)',
      createdAt: 'Just now',
      updatedAt: 'Just now',
      status: 'open' as const,
      comments: [],
    };

    addDiscussion(mockDiscussion);
    expect(useAppStore.getState().discussions).toHaveLength(1);

    addComment('disc-test', {
      id: 'comm-1',
      discussionId: 'disc-test',
      userId: 'user-ali',
      userName: 'Ali (UI Lead)',
      content: 'LGTM!',
      createdAt: 'Just now',
    });

    const updated = useAppStore.getState().discussions.find((d) => d.id === 'disc-test');
    expect(updated?.comments).toHaveLength(1);
    expect(updated?.comments[0].content).toBe('LGTM!');
  });
});
