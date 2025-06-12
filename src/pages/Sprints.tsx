import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Activity, Clock, BarChart3, RefreshCw, Settings, AlertCircle, CheckCircle, Package, Users, AlertTriangle, RotateCcw } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useWorkItems } from '../context/WorkItemsContext';
import { WorkItem } from '../services/adoService';
import { sprintService } from '../services/sprintService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface SprintsProps {
  onNavigate?: (view: string) => void;
  dashboardRefreshRef?: React.RefObject<(() => void) | null>;
}

interface SprintData {
  name: string;
  number: number;
  active: number;
  completed: number;
  total: number;
  storyPoints: number;
  completedStoryPoints: number;
  completionRate: number;
  workItems: WorkItem[];
  // Enhanced metrics with detailed tracking
  bugs: number;
  completedBugs: number;
  bugRatio: number;
  reworkItems: number;
  reworkRate: number;
  scopeChange: number;
  // Detailed breakdown for accurate calculations
  userStories: number;
  completedUserStories: number;
  linkedBugs: number; // Bugs linked to user stories in this sprint
  linkedCompletedBugs: number;
  accurateBugRatio: number; // (linkedBugs / userStories) * 100
  stateTransitions: number; // Items that changed state during sprint
  backwardTransitions: number; // Items moved backward in workflow
  itemsAddedDuringSprint: number;
  itemsRemovedDuringSprint: number;
  calculationDebug?: {
    method: string;
    userStoriesFound: number;
    bugsLinkedToUserStories: number;
    reworkDetectionMethod: string;
    scopeChangeDetails: string;
  };
}

interface SprintMetrics {
  currentSprint: number;
  daysRemaining: number;
  sprintStartDate: Date | null;
  sprintEndDate: Date | null;
  totalSprints: number;
  avgVelocity: number;
  avgCompletionRate: number;
  scopeChangeRate: number;
}

export const Sprints: React.FC<SprintsProps> = ({ onNavigate }) => {
  const { settings } = useSettings();
  const { workItems, loading, error, refreshWorkItems } = useWorkItems();
  const [selectedSprint, setSelectedSprint] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate current sprint information
  const currentSprintInfo = useMemo(() => {
    if (!settings.sprint.sprintStartDate || !settings.sprint.sprintDuration) {
      return null;
    }

    return sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: settings.sprint.sprintDuration,
        firstSprintStartDate: settings.sprint.sprintStartDate
      },
      new Date()
    );
  }, [settings.sprint.sprintStartDate, settings.sprint.sprintDuration]);

  // Calculate sprint data with enhanced accuracy
  const sprintData = useMemo(() => {
    if (!workItems || !currentSprintInfo) return [];

    console.log('🔄 Starting enhanced sprint calculation...');
    const sprintMap = new Map<string, SprintData>();

    // Helper function to determine sprint assignment
    const getSprintAssignment = (item: WorkItem) => {
      // Method 1: Use Iteration Path (most accurate)
      const iterationPath = item['Iteration Path'];
      if (iterationPath && iterationPath !== '') {
        // Extract sprint info from iteration path
        const pathParts = iterationPath.split('\\');
        const lastPart = pathParts[pathParts.length - 1];
        
        // Look for sprint patterns like "Sprint 15", "Sprint 2024.15", etc.
        const sprintMatch = lastPart.match(/Sprint\s*(\d+)/i);
        if (sprintMatch) {
          const sprintNumber = parseInt(sprintMatch[1]);
          return {
            method: 'iteration_path',
            sprintName: `Sprint ${sprintNumber}`,
            sprintNumber: sprintNumber
          };
        }
        
        // If iteration path doesn't contain sprint info, use it as-is
        return {
          method: 'iteration_path_direct',
          sprintName: lastPart,
          sprintNumber: 0
        };
      }

      // Method 2: Fall back to creation date calculation
      const createdDate = new Date(item['Created Date']);
      const sprintStartDate = new Date(settings.sprint.sprintStartDate);
      const sprintDurationWeeks = settings.sprint.sprintDuration;
      
      if (createdDate >= sprintStartDate) {
        const daysDiff = Math.floor((createdDate.getTime() - sprintStartDate.getTime()) / (1000 * 60 * 60 * 24));
        const sprintNumber = Math.floor(daysDiff / (sprintDurationWeeks * 7)) + 1;
        
        return {
          method: 'creation_date',
          sprintName: `Sprint ${sprintNumber}`,
          sprintNumber: sprintNumber
        };
      } else {
        return {
          method: 'pre_sprint',
          sprintName: 'Pre-Sprint',
          sprintNumber: 0
        };
      }
    };

    // Helper function to detect rework with enhanced logic
    const detectRework = (item: WorkItem) => {
      const reason = (item['Reason'] || '').toLowerCase();
      const boardColumn = (item['Board Column'] || '').toLowerCase();
      const state = (item['State'] || '').toLowerCase();
      const stateChangeDate = item['State Change Date'];
      
      // Enhanced rework detection patterns
      const reworkPatterns = [
        // Explicit rework reasons
        'moved to rework', 'returned for rework', 'rejected', 'failed review',
        'needs rework', 'rework required', 'back to development', 'reopened',
        
        // Board column indicators
        'rework', 'development', 'in progress', 'active',
        
        // State transition indicators
        'moved from done', 'moved from completed', 'moved from resolved',
        'reactivated', 'regression'
      ];
      
      const isRework = reworkPatterns.some(pattern => 
        reason.includes(pattern) || boardColumn.includes(pattern)
      );
      
      // Additional check: if item was previously in a "done" state but is now active
      const wasPreviouslyDone = reason.includes('moved from') && 
        (reason.includes('done') || reason.includes('completed') || reason.includes('resolved'));
      
      const isCurrentlyActive = ['active', 'in progress', 'development', 'new'].includes(state);
      
      return {
        isRework: isRework || (wasPreviouslyDone && isCurrentlyActive),
        method: isRework ? 'pattern_match' : wasPreviouslyDone ? 'state_regression' : 'none',
        details: `Reason: ${reason}, Column: ${boardColumn}, State: ${state}`
      };
    };

    // First pass: Group items by sprint and collect basic metrics
    workItems.forEach(item => {
      const assignment = getSprintAssignment(item);
      const sprintName = assignment.sprintName;
      const sprintNumber = assignment.sprintNumber;

      if (!sprintMap.has(sprintName)) {
        sprintMap.set(sprintName, {
          name: sprintName,
          number: sprintNumber,
          active: 0,
          completed: 0,
          total: 0,
          storyPoints: 0,
          completedStoryPoints: 0,
          completionRate: 0,
          workItems: [],
          bugs: 0,
          completedBugs: 0,
          bugRatio: 0,
          reworkItems: 0,
          reworkRate: 0,
          scopeChange: 0,
          userStories: 0,
          completedUserStories: 0,
          linkedBugs: 0,
          linkedCompletedBugs: 0,
          accurateBugRatio: 0,
          stateTransitions: 0,
          backwardTransitions: 0,
          itemsAddedDuringSprint: 0,
          itemsRemovedDuringSprint: 0,
          calculationDebug: {
            method: assignment.method,
            userStoriesFound: 0,
            bugsLinkedToUserStories: 0,
            reworkDetectionMethod: 'enhanced_pattern_matching',
            scopeChangeDetails: ''
          }
        });
      }

      const sprint = sprintMap.get(sprintName)!;
      sprint.workItems.push(item);
      sprint.total++;

      const state = (item['State'] || '').toLowerCase();
      const workItemType = (item['Work Item Type'] || '').toLowerCase();
      const storyPoints = parseFloat(String(item['Story Points'] || 0)) || 0;
      
      sprint.storyPoints += storyPoints;

      // Track work item types more accurately
      if (workItemType === 'user story' || workItemType === 'story') {
        sprint.userStories++;
        if (['done', 'closed', 'completed', 'resolved'].includes(state)) {
          sprint.completedUserStories++;
        }
      }

      // Track bugs (will be refined with parent-child relationships)
      if (workItemType === 'bug') {
        sprint.bugs++;
        if (['done', 'closed', 'completed', 'resolved'].includes(state)) {
          sprint.completedBugs++;
        }
      }

      // Enhanced rework detection
      const reworkAnalysis = detectRework(item);
      if (reworkAnalysis.isRework) {
        sprint.reworkItems++;
        if (reworkAnalysis.method === 'state_regression') {
          sprint.backwardTransitions++;
        }
      }

      // Track completion
      if (['done', 'closed', 'completed', 'resolved'].includes(state)) {
        sprint.completed++;
        sprint.completedStoryPoints += storyPoints;
      } else {
        sprint.active++;
      }

      // Update debug info
      if (sprint.calculationDebug) {
        if (workItemType === 'user story' || workItemType === 'story') {
          sprint.calculationDebug.userStoriesFound++;
        }
      }
    });

    // Second pass: Calculate accurate bug ratios using parent-child relationships
    // Note: This is a simplified version. In a real implementation, you'd use the fetchWorkItemRelations API
    sprintMap.forEach((sprint, sprintName) => {
      const userStories = sprint.workItems.filter(item => {
        const type = (item['Work Item Type'] || '').toLowerCase();
        return type === 'user story' || type === 'story';
      });

      const bugs = sprint.workItems.filter(item => {
        const type = (item['Work Item Type'] || '').toLowerCase();
        return type === 'bug';
      });

      // For now, we'll use a heuristic: bugs in the same sprint are likely related to user stories in that sprint
      // In a full implementation, you'd use the parent-child relationships from ADO
      sprint.linkedBugs = bugs.length;
      sprint.linkedCompletedBugs = bugs.filter(bug => {
        const state = (bug['State'] || '').toLowerCase();
        return ['done', 'closed', 'completed', 'resolved'].includes(state);
      }).length;

      // Calculate accurate bug ratio: bugs per user story
      sprint.accurateBugRatio = sprint.userStories > 0 ? 
        (sprint.linkedBugs / sprint.userStories) * 100 : 0;

      // Calculate other rates
      sprint.completionRate = sprint.total > 0 ? (sprint.completed / sprint.total) * 100 : 0;
      sprint.bugRatio = sprint.total > 0 ? (sprint.bugs / sprint.total) * 100 : 0;
      sprint.reworkRate = sprint.total > 0 ? (sprint.reworkItems / sprint.total) * 100 : 0;

      // Update debug information
      if (sprint.calculationDebug) {
        sprint.calculationDebug.bugsLinkedToUserStories = sprint.linkedBugs;
        sprint.calculationDebug.scopeChangeDetails = `${sprint.storyPoints} SP total, ${sprint.userStories} user stories`;
      }

      console.log(`📊 ${sprintName}: ${sprint.userStories} user stories, ${sprint.linkedBugs} linked bugs, ${sprint.accurateBugRatio.toFixed(1)}% bug ratio`);
    });

    const sortedSprints = Array.from(sprintMap.values())
      .sort((a, b) => {
        if (a.number !== b.number) {
          if (a.number > 0 && b.number > 0) {
            return b.number - a.number;
          }
          if (a.number > 0) return -1;
          if (b.number > 0) return 1;
        }
        return a.name.localeCompare(b.name);
      })
      .filter(sprint => sprint.name !== 'Unassigned' || sprint.total > 0);

    // Calculate enhanced scope changes
    for (let i = 0; i < sortedSprints.length - 1; i++) {
      const currentSprint = sortedSprints[i];
      const previousSprint = sortedSprints[i + 1];
      
      if (previousSprint && previousSprint.storyPoints > 0) {
        const storyPointChange = Math.abs(currentSprint.storyPoints - previousSprint.storyPoints);
        const userStoryChange = Math.abs(currentSprint.userStories - previousSprint.userStories);
        
        currentSprint.scopeChange = (storyPointChange / previousSprint.storyPoints) * 100;
        
        if (currentSprint.calculationDebug) {
          currentSprint.calculationDebug.scopeChangeDetails = 
            `SP: ${previousSprint.storyPoints} → ${currentSprint.storyPoints} (${storyPointChange} change), ` +
            `Stories: ${previousSprint.userStories} → ${currentSprint.userStories} (${userStoryChange} change)`;
        }
      }
    }

    console.log(`✅ Enhanced sprint calculation complete. Found ${sortedSprints.length} sprints.`);
    return sortedSprints;
  }, [workItems, currentSprintInfo, settings.sprint.sprintDuration, settings.sprint.sprintStartDate]);

  // Get current sprint data
  const currentSprintData = useMemo(() => {
    if (!currentSprintInfo) return null;
    return sprintData.find(sprint => sprint.number === currentSprintInfo.currentSprintNumber) || null;
  }, [sprintData, currentSprintInfo]);

  // Calculate overall sprint metrics
  const sprintMetrics = useMemo((): SprintMetrics => {
    const totalSprints = sprintData.length;
    const avgVelocity = totalSprints > 0 ? 
      sprintData.reduce((sum, sprint) => sum + sprint.completedStoryPoints, 0) / totalSprints : 0;
    const avgCompletionRate = totalSprints > 0 ? 
      sprintData.reduce((sum, sprint) => sum + sprint.completionRate, 0) / totalSprints : 0;

    // Calculate scope change rate (simplified)
    const scopeChangeRate = totalSprints > 1 ? 
      Math.abs(sprintData[0]?.storyPoints - sprintData[1]?.storyPoints) / (sprintData[1]?.storyPoints || 1) * 100 : 0;

    return {
      currentSprint: currentSprintInfo?.currentSprintNumber || 0,
      daysRemaining: currentSprintInfo?.daysRemaining || 0,
      sprintStartDate: currentSprintInfo?.sprintStartDate || null,
      sprintEndDate: currentSprintInfo?.sprintEndDate || null,
      totalSprints,
      avgVelocity,
      avgCompletionRate,
      scopeChangeRate
    };
  }, [sprintData, currentSprintInfo]);

  // Filter work items by selected sprint
  const filteredWorkItems = useMemo(() => {
    if (!workItems || selectedSprint === 'all') return workItems || [];
    
    const selectedSprintData = sprintData.find(sprint => sprint.name === selectedSprint);
    return selectedSprintData?.workItems || [];
  }, [workItems, selectedSprint, sprintData]);

  // Chart data for sprint history (reverse order for chronological display)
  const chartData = useMemo(() => {
    return sprintData
      .slice() // Create a copy to avoid mutating original array
      .reverse() // Reverse to show chronological order (oldest to newest) in chart
      .map(sprint => ({
        name: sprint.name,
        Active: sprint.active,
        Completed: sprint.completed,
        'Story Points': sprint.completedStoryPoints
      }));
  }, [sprintData]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshWorkItems();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshWorkItems]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Loading sprint data...
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Fetching work items and calculating sprint metrics
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Error Loading Sprint Data
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
          </p>
          <div className="mt-6">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="-ml-1 mr-2 h-5 w-5" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!workItems || workItems.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            No sprint data available
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            No work items found to generate sprint analytics. Check your area path configuration.
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate?.('settings')}
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

  // Configuration needed state
  if (!settings.sprint.sprintStartDate || !settings.sprint.sprintDuration) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <Calendar className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Configure sprint settings
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please configure your sprint duration and start date in Settings to view sprint analytics.
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate?.('settings')}
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

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sprint Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track sprint progress and performance across {sprintMetrics.totalSprints} sprints
            {settings.ado.areaPath && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                • {settings.ado.areaPath}
              </span>
            )}
          </p>

        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`-ml-1 mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Sprint Card */}
      {currentSprintInfo && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sprint {sprintMetrics.currentSprint}</h2>
              <p className="text-blue-100 mt-1">
                {sprintMetrics.daysRemaining} days remaining
              </p>
              {sprintMetrics.sprintStartDate && sprintMetrics.sprintEndDate && (
                <p className="text-blue-100 text-sm mt-2">
                  {sprintMetrics.sprintStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {sprintMetrics.sprintEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
            <Calendar className="h-12 w-12 text-blue-200" />
          </div>
        </div>
      )}

      {/* Sprint Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Completion Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${Math.round(currentSprintData.completionRate)}%` : `${sprintMetrics.avgCompletionRate.toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentSprintData ? `${currentSprintData.completed}/${currentSprintData.total} items` : 'Average across sprints'}
              </p>
            </div>
            <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Velocity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Velocity</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${currentSprintData.completedStoryPoints}` : `${sprintMetrics.avgVelocity.toFixed(1)}`} SP
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {currentSprintData ? `${currentSprintData.storyPoints} SP planned` : 'Average per sprint'}
              </p>
            </div>
            <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Bug Ratio */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bug Ratio</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${Math.round(currentSprintData.accurateBugRatio)}%` : 
                  `${(sprintData.reduce((sum, s) => sum + s.accurateBugRatio, 0) / Math.max(sprintData.length, 1)).toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={
                currentSprintData ? 
                  `Calculation: ${currentSprintData.linkedBugs} bugs ÷ ${currentSprintData.userStories} user stories × 100. Method: ${currentSprintData.calculationDebug?.method || 'enhanced'}` :
                  'Average bugs per user story across all sprints'
              }>
                {currentSprintData ? 
                  `${currentSprintData.linkedBugs} bugs / ${currentSprintData.userStories} stories` : 
                  'Average across sprints'
                }
              </p>
            </div>
            <div className="h-8 w-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </div>

        {/* Rework Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rework Rate</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${Math.round(currentSprintData.reworkRate)}%` : 
                  `${(sprintData.reduce((sum, s) => sum + s.reworkRate, 0) / Math.max(sprintData.length, 1)).toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={
                currentSprintData ? 
                  `Detection method: ${currentSprintData.calculationDebug?.reworkDetectionMethod}. Includes items moved back to development, rejected, or requiring rework.` :
                  'Average items requiring rework across all sprints'
              }>
                {currentSprintData ? 
                  `${currentSprintData.reworkItems} items (${currentSprintData.backwardTransitions} backward transitions)` : 
                  'Average across sprints'
                }
              </p>
            </div>
            <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <RotateCcw className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Planning Accuracy</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {sprintData.length > 1 ? 
                  `${Math.round(sprintData.slice(0, 5).reduce((acc, s) => acc + s.completionRate, 0) / Math.min(5, sprintData.length))}%` : 
                  '0%'
                }
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 5 sprints average</p>
            </div>
            <div className="h-8 w-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Scope Change</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${Math.round(currentSprintData.scopeChange)}%` : `${sprintMetrics.scopeChangeRate.toFixed(1)}%`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1" title={
                currentSprintData?.calculationDebug?.scopeChangeDetails || 
                'Story point and user story changes from previous sprint'
              }>
                {currentSprintData ? 
                  `${currentSprintData.storyPoints} SP, ${currentSprintData.userStories} stories` : 
                  'From previous sprint'
                }
              </p>
            </div>
            <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Throughput</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {currentSprintData ? `${currentSprintData.completed}` : `${(sprintData.reduce((sum, sprint) => sum + sprint.completed, 0) / Math.max(sprintData.length, 1)).toFixed(1)}`} items
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sprintData.length > 1 ? 
                  `Avg: ${Math.round(sprintData.slice(0, 5).reduce((acc, s) => acc + s.completed, 0) / Math.min(5, sprintData.length))}` : 
                  'No history'
                }
              </p>
            </div>
            <div className="h-8 w-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
              <Activity className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Debug Information (Development Mode) */}
      {process.env.NODE_ENV === 'development' && currentSprintData?.calculationDebug && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            🔧 Debug Information - {currentSprintData.name}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p><strong>Sprint Assignment Method:</strong> {currentSprintData.calculationDebug.method}</p>
              <p><strong>User Stories Found:</strong> {currentSprintData.calculationDebug.userStoriesFound}</p>
              <p><strong>Bugs Linked to User Stories:</strong> {currentSprintData.calculationDebug.bugsLinkedToUserStories}</p>
            </div>
            <div>
              <p><strong>Rework Detection:</strong> {currentSprintData.calculationDebug.reworkDetectionMethod}</p>
              <p><strong>Scope Change Details:</strong> {currentSprintData.calculationDebug.scopeChangeDetails}</p>
              <p><strong>Accurate Bug Ratio:</strong> {currentSprintData.accurateBugRatio.toFixed(2)}% (vs {currentSprintData.bugRatio.toFixed(2)}% simple)</p>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint History Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sprint History</h3>
          <div data-testid="sprint-history-chart" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Active" fill="#f59e0b" name="Active Items" />
                <Bar dataKey="Completed" fill="#10b981" name="Completed Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scope Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scope Management</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Scope Change Rate</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sprintMetrics.scopeChangeRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Sprints</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sprintMetrics.totalSprints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Sprint Size</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sprintData.length > 0 ? (sprintData.reduce((sum, sprint) => sum + sprint.total, 0) / sprintData.length).toFixed(1) : 0} items
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Work Items by Sprint */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Work Items by Sprint</h3>
            <div className="flex items-center gap-4">
              <label htmlFor="sprint-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Sprint:
              </label>
              <select
                id="sprint-filter"
                aria-label="Filter by Sprint"
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Sprints</option>
                {sprintData.map(sprint => (
                  <option key={sprint.name} value={sprint.name}>
                    {sprint.name} ({sprint.total} items)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Story Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Assignee</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWorkItems.map((item) => (
                <tr key={item['ID']} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                    {item['ID']}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {item['Title']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item['Work Item Type']}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ['done', 'closed', 'completed', 'resolved'].includes((item['State'] || '').toLowerCase())
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {item['State']}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {item['Story Points'] || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {item['Assigned To'] || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}; 