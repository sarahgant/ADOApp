import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { adoService, WorkItem } from '../services/adoService';

interface WorkItemsContextType {
  workItems: WorkItem[] | null;
  loading: boolean;
  error: string | null;
  analyticsData: any | null;
  usingAnalytics: boolean;
  fetchWorkItems: () => Promise<void>;
  refreshWorkItems: () => Promise<void>;
}

const WorkItemsContext = createContext<WorkItemsContextType | undefined>(undefined);

interface WorkItemsProviderProps {
  children: ReactNode;
}

export const WorkItemsProvider: React.FC<WorkItemsProviderProps> = ({ children }) => {
  const { settings } = useSettings();
  const [workItems, setWorkItems] = useState<WorkItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any | null>(null);
  const [usingAnalytics, setUsingAnalytics] = useState(false);

  // Check if user has configured settings
  const hasValidConnection = settings.ado.organization && 
                            settings.ado.project && 
                            settings.ado.personalAccessToken && 
                            settings.ado.isConnected;

  // Fetch work items from Azure DevOps with Analytics API
  const fetchWorkItems = useCallback(async () => {
    if (!hasValidConnection) {
      setError('Please configure your Azure DevOps connection in Settings first.');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalyticsData(null);
    setUsingAnalytics(false);

    try {
      // Try Analytics API first for enhanced data
      const analyticsResult = await adoService.fetchAnalyticsWorkItems(
        settings.ado.organization,
        settings.ado.project,
        settings.ado.personalAccessToken,
        settings.ado.areaPath
      );

      if (analyticsResult.success && analyticsResult.data) {
        setWorkItems(analyticsResult.data);
        setAnalyticsData({
          aggregations: analyticsResult.aggregations,
          snapshots: analyticsResult.snapshots
        });
        setUsingAnalytics(!analyticsResult.error); // True if no fallback error
        console.log(`🔧 Successfully loaded ${analyticsResult.data.length} work items using ${analyticsResult.error ? 'REST API (fallback)' : 'Analytics API'}`);
        
        if (analyticsResult.error) {
          console.warn('Analytics API limitation:', analyticsResult.error);
        }
      } else {
        // Fallback to regular REST API
        console.warn('Analytics API failed, using REST API fallback');
        const restResult = await adoService.fetchWorkItems(
          settings.ado.organization,
          settings.ado.project,
          settings.ado.personalAccessToken,
          settings.ado.areaPath
        );

        if (restResult.success && restResult.workItems) {
          setWorkItems(restResult.workItems);
          setUsingAnalytics(false);
          console.log(`Successfully loaded ${restResult.workItems.length} work items using REST API`);
        } else {
          setError(restResult.error || 'Failed to fetch work items');
        }
      }
    } catch (err) {
      console.error('Error fetching work items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [hasValidConnection, settings.ado.organization, settings.ado.project, settings.ado.personalAccessToken, settings.ado.areaPath]);

  // Refresh function (alias for fetchWorkItems)
  const refreshWorkItems = useCallback(async () => {
    await fetchWorkItems();
  }, [fetchWorkItems]);

  // Auto-load data when connection is established
  useEffect(() => {
    if (hasValidConnection && !workItems && !loading) {
      fetchWorkItems();
    }
  }, [hasValidConnection, workItems, loading, fetchWorkItems]);

  const value: WorkItemsContextType = {
    workItems,
    loading,
    error,
    analyticsData,
    usingAnalytics,
    fetchWorkItems,
    refreshWorkItems
  };

  return (
    <WorkItemsContext.Provider value={value}>
      {children}
    </WorkItemsContext.Provider>
  );
};

export const useWorkItems = (): WorkItemsContextType => {
  const context = useContext(WorkItemsContext);
  if (context === undefined) {
    throw new Error('useWorkItems must be used within a WorkItemsProvider');
  }
  return context;
}; 