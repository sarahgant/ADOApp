import React, { useState, useRef } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { MainContent } from '../MainContent';
import { useSettings } from '../../context/SettingsContext';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { disconnect } = useSettings();
  
  // Ref to communicate with Dashboard component for data refresh
  const dashboardRefreshRef = useRef<(() => void) | null>(null);

  const handleViewChange = (view: string) => {
    setActiveView(view);
  };

  const handleSettingsClick = () => {
    setActiveView('settings');
  };

  const handleRefreshData = async () => {
    if (dashboardRefreshRef.current) {
      setIsRefreshing(true);
      try {
        await dashboardRefreshRef.current();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleDisconnect = () => {
    if (window.confirm('Are you sure you want to disconnect from the server?')) {
      disconnect();
      // Optionally navigate back to dashboard
      if (activeView === 'settings') {
        setActiveView('dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        onSettingsClick={handleSettingsClick}
        onRefreshData={handleRefreshData}
        onDisconnect={handleDisconnect}
        isRefreshing={isRefreshing}
      />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
        
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children ? (
              React.isValidElement(children) 
                ? React.cloneElement(children, { 
                    activeView, 
                    onNavigate: handleViewChange,
                    dashboardRefreshRef 
                  } as any)
                : children
            ) : (
              <MainContent 
                activeView={activeView} 
                onNavigate={handleViewChange}
                dashboardRefreshRef={dashboardRefreshRef}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}; 