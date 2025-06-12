import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle, Settings, TrendingUp, Activity, Target, Package } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useWorkItems } from '../context/WorkItemsContext';
import { WorkItem } from '../services/adoService';
import { MetricsData } from '../types/analytics';
import { WorkItemsTable } from '../components/ui/WorkItemsTable';
import { MetricDetailDialog, MetricType } from '../components/ui/MetricDetailDialog';

interface DashboardProps {
  onNavigate?: (view: string) => void;
  dashboardRefreshRef?: React.RefObject<(() => void) | null>;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, dashboardRefreshRef }) => {
  const { settings } = useSettings();
  const { workItems: data, loading, error, refreshWorkItems, analyticsData, usingAnalytics } = useWorkItems();
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<{
    type: MetricType;
    title: string;
  } | null>(null);

  const handleGoToSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Handle metric card click
  const handleMetricClick = (metricType: MetricType, title: string) => {
    setSelectedMetric({ type: metricType, title });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedMetric(null);
  };

  // Set up refresh function for header
  useEffect(() => {
    if (dashboardRefreshRef) {
      dashboardRefreshRef.current = refreshWorkItems;
    }
  }, [dashboardRefreshRef, refreshWorkItems]);

  // Column name normalizer
  const normalizeColumnName = useCallback((name: string) => {
    if (!name) return '';
    return name.trim().toLowerCase().replace(/\s+/g, '');
  }, []);

  // Get column value with fallback
  const getColumnValue = useCallback((row: any, possibleNames: string[]) => {
    if (!row || !possibleNames) return null;
    for (const name of possibleNames) {
      if (row[name] !== undefined) return row[name];
      const normalized = normalizeColumnName(name);
      const found = Object.keys(row).find(key => normalizeColumnName(key) === normalized);
      if (found) return row[found];
    }
    return null;
  }, [normalizeColumnName]);

  // Calculate dashboard metrics using server-side data when available
  const dashboardMetrics = useMemo(() => {
    // Prioritize server-side analytics when available
    if (usingAnalytics && analyticsData?.aggregations) {
      console.log('Using server-side aggregations');
      const agg = analyticsData.aggregations;
      
      return {
        totalItems: agg.totalItems || 0,
        completedItems: agg.completedItems || 0,
        remainingItems: (agg.totalItems || 0) - (agg.completedItems || 0),
        totalStoryPoints: agg.totalStoryPoints || 0,
        completedStoryPoints: agg.completedStoryPoints || 0,
        remainingStoryPoints: (agg.totalStoryPoints || 0) - (agg.completedStoryPoints || 0),
        avgCycleTime: agg.avgCycleTime || 0,
        avgLeadTime: agg.avgLeadTime || 0,
        p85CycleTime: agg.p85CycleTime || 0,
        p95CycleTime: agg.p95CycleTime || 0,
        serverSideData: true
      };
    }

    // Fallback to basic work item data for display
    if (data && data.length > 0) {
      console.log('Using basic work item data');
      return {
        totalItems: data.length,
        completedItems: 0,
        remainingItems: data.length,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        remainingStoryPoints: 0,
        avgCycleTime: 0,
        avgLeadTime: 0,
        p85CycleTime: 0,
        p95CycleTime: 0,
        serverSideData: false
      };
    }

    return null;
  }, [data, usingAnalytics, analyticsData]);

  // Key insights summary cards
  const renderKeyInsights = () => {
    if (!dashboardMetrics) return null;

    const insights = [
      {
        title: 'Total Work Items',
        value: dashboardMetrics.totalItems,
        icon: Package,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        metricType: 'totalItems' as MetricType,
      },
      {
        title: 'Completed',
        value: dashboardMetrics.completedItems,
        icon: CheckCircle,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900',
        metricType: 'completedItems' as MetricType,
      },
      {
        title: 'In Progress',
        value: dashboardMetrics.remainingItems,
        icon: Activity,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
        metricType: 'remainingItems' as MetricType,
      },
      {
        title: 'Story Points',
        value: `${dashboardMetrics.completedStoryPoints}/${dashboardMetrics.totalStoryPoints}`,
        icon: TrendingUp,
        color: 'text-indigo-600 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900',
        metricType: 'storyPoints' as MetricType,
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div
              key={index}
              onClick={() => handleMetricClick(insight.metricType, insight.title)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {insight.title}
                  </p>
                  <p className={`text-2xl font-bold ${insight.color}`}>
                    {insight.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${insight.bgColor}`}>
                  <Icon className={`w-6 h-6 ${insight.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Check if user has configured settings
  const hasValidConnection = settings.ado.organization && 
                            settings.ado.project && 
                            settings.ado.personalAccessToken && 
                            settings.ado.isConnected;

  // Show configuration prompt if not connected
  if (!hasValidConnection) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Azure DevOps Connection Required
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure your Azure DevOps connection to start viewing your work items and analytics.
          </p>
          <div className="mt-6">
            <button
              onClick={handleGoToSettings}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="-ml-1 mr-2 h-5 w-5" />
              Go to Settings
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Loading Work Items
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fetching data from Azure DevOps...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Error Loading Data
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={refreshWorkItems}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No Work Items Found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No work items were found in the configured project and area path.
          </p>
          <div className="mt-6">
            <button
              onClick={refreshWorkItems}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Insights Summary */}
      {renderKeyInsights()}

      {/* Work Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <WorkItemsTable workItems={data} />
      </div>

      {/* Metric Detail Dialog */}
      {selectedMetric && (
        <MetricDetailDialog
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          metricType={selectedMetric.type}
          title={selectedMetric.title}
          workItems={data}
        />
      )}
    </div>
  );
};

export default Dashboard; 