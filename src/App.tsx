import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppInitializer } from './components/AppInitializer';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { WorkItemsProvider } from './context/WorkItemsContext';
import { AppLayout } from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ErrorBoundary>
      <AppInitializer>
        <ThemeProvider>
          <SettingsProvider>
            <WorkItemsProvider>
              <AppLayout />
            </WorkItemsProvider>
          </SettingsProvider>
        </ThemeProvider>
      </AppInitializer>
    </ErrorBoundary>
  );
}

export default App; 