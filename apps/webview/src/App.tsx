import React from 'react';
import { useAppStore } from './store/useAppStore';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { GlobalBanners } from './components/GlobalBanners';
import { ActivityFeed } from './activity/ActivityFeed';
import { PresencePanel } from './presence/PresencePanel';
import { DiscussionsView } from './discussion/DiscussionsView';
import { ArchitectureView } from './architecture/ArchitectureView';
import { ReportsView } from './reports/ReportsView';
import { SettingsView } from './components/SettingsView';
import { DevSimulationBar } from './components/common/DevSimulationBar';

export const App: React.FC = () => {
  const { activeTab } = useAppStore();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <div className="flex-1 flex h-full overflow-hidden">
            <ActivityFeed />
            <PresencePanel />
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
    <div className="flex flex-col h-screen w-screen bg-aurora-bg text-aurora-textPrimary font-sans overflow-hidden">
      {/* Top Header */}
      <Header />

      {/* Disconnection / Warning Banners */}
      <GlobalBanners />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Navigation />

        {/* Dynamic Center Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-aurora-bg">
          {renderActiveTab()}
        </main>
      </div>

      {/* Dev Simulation Bar for Live Real-Time Testing */}
      <DevSimulationBar />
    </div>
  );
};

export default App;
