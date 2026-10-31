import React from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { GlobalBanners } from './components/GlobalBanners';
import { ActivityFeed } from './activity/ActivityFeed';
import { PresencePanel } from './presence/PresencePanel';
import { DiscussionsView } from './discussion/DiscussionsView';
import { ArchitectureView } from './architecture/ArchitectureView';
import { ReportsView } from './reports/ReportsView';
import { SettingsView } from './components/SettingsView';
import { DevSimulationBar } from './components/common/DevSimulationBar';
import { DiffModal } from './components/diff/DiffModal';
import { ImportRepoModal } from './components/modals/ImportRepoModal';

export const App: React.FC = () => {
  const {
    activeTab,
    showPresencePanel,
    showDevSimulator,
    isDiffModalOpen,
    diffModalData,
    closeDiffModal,
    isImportModalOpen,
    closeImportModal,
  } = useAppStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <div className="flex-1 flex h-full overflow-hidden relative">
            <ActivityFeed />
            {showPresencePanel && <PresencePanel />}
          </div>
        );
      case 'architecture':
        return <ArchitectureView />;
      case 'discussions':
        return <DiscussionsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <ActivityFeed />;
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Minimal Header */}
      <Header />

      {/* Disconnection / Warning Banners */}
      <GlobalBanners />

      {/* Main Dynamic Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden bg-zinc-950">
        {renderActiveTab()}
      </main>

      {/* Dev Simulation Bar for Live Testing (Toggled via Header button) */}
      {showDevSimulator && <DevSimulationBar />}

      {/* In-Browser Side-by-Side Diff Modal */}
      <DiffModal
        isOpen={isDiffModalOpen}
        onClose={closeDiffModal}
        commitHash={diffModalData.commitHash}
        fileName={diffModalData.fileName}
        authorName={diffModalData.authorName}
        commitMessage={diffModalData.commitMessage}
      />

      {/* Import Public GitHub Repo Modal */}
      <ImportRepoModal
        isOpen={isImportModalOpen}
        onClose={closeImportModal}
      />
    </div>
  );
};

export default App;
