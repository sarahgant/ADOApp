import React from 'react';
import Dashboard from '../pages/Dashboard';
import { Settings } from '../pages/Settings';
import Team from '../pages/Team';
import Analytics from '../pages/Analytics';
import { Sprints } from '../pages/Sprints';

interface MainContentProps {
  activeView: string;
  onNavigate?: (view: string) => void;
  dashboardRefreshRef?: React.RefObject<(() => void) | null>;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  activeView, 
  onNavigate, 
  dashboardRefreshRef 
}) => {
  
  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard 
            onNavigate={onNavigate} 
            dashboardRefreshRef={dashboardRefreshRef}
          />
        );
      case 'analytics':
        return <Analytics />;
      case 'team':
        return <Team onNavigate={onNavigate} dashboardRefreshRef={dashboardRefreshRef} />;
      case 'sprints':
        return <Sprints onNavigate={onNavigate} dashboardRefreshRef={dashboardRefreshRef} />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Dashboard 
            onNavigate={onNavigate} 
            dashboardRefreshRef={dashboardRefreshRef}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {renderContent()}
    </div>
  );
}; 