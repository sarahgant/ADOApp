import React, { useMemo } from 'react';
import { Dialog } from './Dialog';
import { WorkItem } from '../../services/adoService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, Users, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';

export type MetricType = 'totalItems' | 'completedItems' | 'activeItems' | 'blockedItems' | 'storyPoints' | 'completionRate';

export interface MetricDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  metricType: MetricType;
  workItems: WorkItem[];
  title: string;
}

interface BreakdownData {
  name: string;
  count: number;
  storyPoints: number;
  percentage: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export const MetricDetailDialog: React.FC<MetricDetailDialogProps> = ({
  isOpen,
  onClose,
  metricType,
  workItems,
  title
}) => {
  // Helper functions for filtering work items
  const getColumnValue = (row: WorkItem, possibleNames: string[]) => {
    for (const name of possibleNames) {
      if (row[name] !== undefined) return row[name];
    }
    return null;
  };

  const isCompleted = (item: WorkItem) => {
    const state = getColumnValue(item, ['State', 'Status']);
    const boardColumn = getColumnValue(item, ['Board Column', 'BoardColumn']);
    return ['Closed', 'Done', 'Completed', 'Resolved', 'Accepted'].includes(state) ||
           ['Done', 'Completed', 'Accepted'].includes(boardColumn);
  };

  const isActive = (item: WorkItem) => {
    const state = getColumnValue(item, ['State', 'Status']);
    const boardColumn = getColumnValue(item, ['Board Column', 'BoardColumn']);
    return ['Active', 'In Progress', 'Committed', 'Open', 'In Development', 'In Review', 'Testing'].includes(state) ||
           ['Doing', 'In Progress', 'Development', 'Review', 'Testing'].includes(boardColumn);
  };

  const isBlocked = (item: WorkItem) => {
    const tags = getColumnValue(item, ['Tags', 'Labels']) || '';
    const state = getColumnValue(item, ['State', 'Status']);
    return getColumnValue(item, ['Blocked']) === true || 
           tags.toLowerCase().includes('blocked') ||
           state === 'Blocked';
  };

  const getStoryPoints = (item: WorkItem) => {
    const points = getColumnValue(item, ['Story Points', 'StoryPoints', 'Points', 'Effort', 'Size']);
    return parseFloat(points) || 0;
  };

  // Filter work items based on metric type
  const filteredWorkItems = useMemo(() => {
    switch (metricType) {
      case 'completedItems':
        return workItems.filter(isCompleted);
      case 'activeItems':
        return workItems.filter(isActive);
      case 'blockedItems':
        return workItems.filter(isBlocked);
      case 'totalItems':
      case 'storyPoints':
      case 'completionRate':
      default:
        return workItems;
    }
  }, [workItems, metricType]);

  // Calculate breakdowns
  const breakdownByType = useMemo((): BreakdownData[] => {
    const typeMap = new Map<string, { count: number; storyPoints: number }>();
    
    filteredWorkItems.forEach(item => {
      const type = item['Work Item Type'] || 'Unknown';
      const current = typeMap.get(type) || { count: 0, storyPoints: 0 };
      typeMap.set(type, {
        count: current.count + 1,
        storyPoints: current.storyPoints + getStoryPoints(item)
      });
    });

    const total = filteredWorkItems.length;
    return Array.from(typeMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      storyPoints: data.storyPoints,
      percentage: total > 0 ? (data.count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredWorkItems]);

  const breakdownByAssignee = useMemo((): BreakdownData[] => {
    const assigneeMap = new Map<string, { count: number; storyPoints: number }>();
    
    filteredWorkItems.forEach(item => {
      const assignee = item['Assigned To'] || 'Unassigned';
      const current = assigneeMap.get(assignee) || { count: 0, storyPoints: 0 };
      assigneeMap.set(assignee, {
        count: current.count + 1,
        storyPoints: current.storyPoints + getStoryPoints(item)
      });
    });

    const total = filteredWorkItems.length;
    return Array.from(assigneeMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      storyPoints: data.storyPoints,
      percentage: total > 0 ? (data.count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredWorkItems]);

  const breakdownByPriority = useMemo((): BreakdownData[] => {
    const priorityMap = new Map<string, { count: number; storyPoints: number }>();
    
    filteredWorkItems.forEach(item => {
      const priority = item['Priority'] || 'Unknown';
      const current = priorityMap.get(priority) || { count: 0, storyPoints: 0 };
      priorityMap.set(priority, {
        count: current.count + 1,
        storyPoints: current.storyPoints + getStoryPoints(item)
      });
    });

    const total = filteredWorkItems.length;
    return Array.from(priorityMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      storyPoints: data.storyPoints,
      percentage: total > 0 ? (data.count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }, [filteredWorkItems]);

  const totalStoryPoints = useMemo(() => {
    return filteredWorkItems.reduce((sum, item) => sum + getStoryPoints(item), 0);
  }, [filteredWorkItems]);



  const renderDialogContent = () => {
    switch (metricType) {
      case 'totalItems':
        return renderTotalItemsContent();
      case 'completedItems':
        return renderCompletedItemsContent();
      case 'activeItems':
        return renderActiveItemsContent();
      case 'blockedItems':
        return renderBlockedItemsContent();
      case 'completionRate':
        return renderCompletionRateContent();
      case 'storyPoints':
        return renderStoryPointsContent();
      default:
        return renderTotalItemsContent();
    }
  };

  const renderTotalItemsContent = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{filteredWorkItems.length}</h3>
            <p className="text-blue-100">Total Work Items</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <Target className="w-8 h-8" />
          </div>
        </div>
                 <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-blue-100">Story Points</p>
             <p className="text-sm font-semibold">{totalStoryPoints}</p>
           </div>
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-blue-100">Types</p>
             <p className="text-sm font-semibold">{breakdownByType.length}</p>
           </div>
         </div>
      </div>

      {/* Work Item Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-500" />
            Work Item Distribution
          </h4>
          <div className="space-y-3">
            {breakdownByType.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visual Breakdown</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdownByType}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ name, percentage }) => `${percentage.toFixed(0)}%`}
                >
                  {breakdownByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, 'Items']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompletedItemsContent = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{filteredWorkItems.length}</h3>
            <p className="text-green-100">Completed Items</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
        </div>
                 <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-green-100">Story Points</p>
             <p className="text-sm font-semibold">{totalStoryPoints}</p>
           </div>
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-green-100">Contributors</p>
             <p className="text-sm font-semibold">{breakdownByAssignee.length}</p>
           </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-green-500" />
            Completed by Type
          </h4>
          <div className="space-y-3">
            {breakdownByType.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.storyPoints} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Top Contributors
          </h4>
          <div className="space-y-3">
            {breakdownByAssignee.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.storyPoints} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderActiveItemsContent = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{filteredWorkItems.length}</h3>
            <p className="text-yellow-100">In Progress Items</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <Clock className="w-8 h-8" />
          </div>
        </div>
                 <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-yellow-100">Story Points</p>
             <p className="text-sm font-semibold">{totalStoryPoints}</p>
           </div>
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-yellow-100">Active Team</p>
             <p className="text-sm font-semibold">{breakdownByAssignee.length}</p>
           </div>
         </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-yellow-500" />
            Current Assignees
          </h4>
          <div className="space-y-3">
            {breakdownByAssignee.slice(0, 5).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                      {item.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 dark:text-white">{item.count}</div>
                  <div className="text-xs text-gray-500">{item.storyPoints} pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
            Priority Breakdown
          </h4>
          <div className="space-y-3">
            {breakdownByPriority.map((item, index) => {
              const priorityColors = {
                'Critical': '#EF4444',
                'High': '#F59E0B', 
                'Medium': '#10B981',
                'Low': '#6B7280'
              };
              const color = priorityColors[item.name as keyof typeof priorityColors] || '#6B7280';
              
              return (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.count}</div>
                    <div className="text-xs text-gray-500">{item.storyPoints} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBlockedItemsContent = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{filteredWorkItems.length}</h3>
            <p className="text-red-100">Blocked Items</p>
          </div>
          <div className="bg-white/20 rounded-lg p-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
        </div>
                 <div className="mt-4 grid grid-cols-2 gap-3">
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-red-100">Story Points</p>
             <p className="text-sm font-semibold">{totalStoryPoints}</p>
           </div>
           <div className="bg-white/10 rounded-lg p-2">
             <p className="text-xs text-red-100">Impact</p>
             <p className="text-sm font-semibold">{filteredWorkItems.length > 0 ? 'High' : 'None'}</p>
           </div>
         </div>
      </div>
      
      {filteredWorkItems.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Blocked Items
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkItems.map((item) => (
              <div key={item.ID} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 mr-2">
                      #{item.ID}
                    </span>
                    <span className="text-xs text-gray-500">{item['Work Item Type']}</span>
                  </div>
                  <span className="text-xs text-gray-500">{getStoryPoints(item)} pts</span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">{item.Title}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{item['Assigned To'] || 'Unassigned'}</span>
                  <span className="capitalize">{item['Priority'] || 'Medium'} Priority</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary insights */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {breakdownByPriority.some(p => p.name === 'Critical') && (
              <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
                <span className="text-sm text-red-800 dark:text-red-200">Critical items blocked - immediate attention needed</span>
              </div>
            )}
            {totalStoryPoints > 20 && (
              <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                <span className="text-sm text-yellow-800 dark:text-yellow-200">High story point impact - review blockers</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-lg border border-gray-200 dark:border-gray-700 text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Blocked Items!</h3>
          <p className="text-gray-500 dark:text-gray-400">Great work! All items are flowing smoothly.</p>
        </div>
      )}
    </div>
  );

  const renderCompletionRateContent = () => {
    const completionRate = workItems.length > 0 ? (workItems.filter(isCompleted).length / workItems.length) * 100 : 0;
    const completedItems = workItems.filter(isCompleted);
    const remainingItems = workItems.length - completedItems.length;
    
    // Calculate velocity insights
    const avgStoryPointsCompleted = completedItems.length > 0 ? 
      completedItems.reduce((sum, item) => sum + getStoryPoints(item), 0) / completedItems.length : 0;
    
    // Calculate completion rates by work item type (NOT using filteredWorkItems)
    const typeMap = new Map<string, { completed: number; total: number }>();
    
    workItems.forEach(item => {
      const type = item['Work Item Type'] || 'Unknown';
      const current = typeMap.get(type) || { completed: 0, total: 0 };
      typeMap.set(type, {
        completed: current.completed + (isCompleted(item) ? 1 : 0),
        total: current.total + 1
      });
    });

    const completionByType = Array.from(typeMap.entries()).map(([name, data]) => ({
      name,
      completed: data.completed,
      total: data.total,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    })).sort((a, b) => b.completionRate - a.completionRate);
    
    return (
      <div className="space-y-6">
        {/* Hero Stats */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">{completionRate.toFixed(1)}%</h3>
              <p className="text-purple-100">Completion Rate</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
          </div>
                     <div className="mt-4 grid grid-cols-3 gap-3">
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-purple-100">Completed</p>
               <p className="text-sm font-semibold">{completedItems.length}</p>
             </div>
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-purple-100">Remaining</p>
               <p className="text-sm font-semibold">{remainingItems}</p>
             </div>
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-purple-100">Efficiency</p>
               <p className="text-sm font-semibold">{avgStoryPointsCompleted.toFixed(1)} pts</p>
             </div>
           </div>
        </div>

        {/* Completion Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-purple-500" />
              Completion by Type
            </h4>
            <div className="space-y-4">
              {completionByType.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">{item.completionRate.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${item.completionRate}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{item.completed} completed</span>
                    <span>{item.total} total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-500" />
              Progress Overview
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Completed', value: completedItems.length, fill: '#10B981' },
                      { name: 'Remaining', value: remainingItems, fill: '#E5E7EB' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  />
                  <Tooltip formatter={(value) => [value, 'Items']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Key Insights */}
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Avg Story Points/Item</span>
                <span className="font-semibold text-green-900 dark:text-green-100">{avgStoryPointsCompleted.toFixed(1)}</span>
              </div>
              {completionRate >= 80 && (
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm text-green-800 dark:text-green-200">Excellent completion rate!</span>
                </div>
              )}
              {completionRate < 50 && (
                <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">Consider reviewing blockers</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStoryPointsContent = () => {
    const totalStoryPointsAll = workItems.reduce((sum, item) => sum + getStoryPoints(item), 0);
    const completedStoryPoints = workItems.filter(isCompleted).reduce((sum, item) => sum + getStoryPoints(item), 0);
    const remainingStoryPoints = totalStoryPointsAll - completedStoryPoints;
    const avgStoryPointsPerItem = workItems.length > 0 ? totalStoryPointsAll / workItems.length : 0;
    const completionVelocity = workItems.filter(isCompleted).length > 0 ? 
      completedStoryPoints / workItems.filter(isCompleted).length : 0;
    
    // Calculate efficiency metrics
    const largeItems = workItems.filter(item => getStoryPoints(item) >= 8);
    const smallItems = workItems.filter(item => getStoryPoints(item) <= 3);
    const mediumItems = workItems.filter(item => getStoryPoints(item) > 3 && getStoryPoints(item) < 8);
    
    const sizeDistribution = [
      { name: 'Small (1-3)', count: smallItems.length, storyPoints: smallItems.reduce((sum, item) => sum + getStoryPoints(item), 0), color: '#10B981' },
      { name: 'Medium (4-7)', count: mediumItems.length, storyPoints: mediumItems.reduce((sum, item) => sum + getStoryPoints(item), 0), color: '#F59E0B' },
      { name: 'Large (8+)', count: largeItems.length, storyPoints: largeItems.reduce((sum, item) => sum + getStoryPoints(item), 0), color: '#EF4444' }
    ];
    
    return (
      <div className="space-y-6">
        {/* Hero Stats */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">{totalStoryPointsAll}</h3>
              <p className="text-indigo-100">Total Story Points</p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <Zap className="w-8 h-8" />
            </div>
          </div>
                     <div className="mt-4 grid grid-cols-3 gap-3">
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-indigo-100">Completed</p>
               <p className="text-sm font-semibold">{completedStoryPoints}</p>
             </div>
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-indigo-100">Remaining</p>
               <p className="text-sm font-semibold">{remainingStoryPoints}</p>
             </div>
             <div className="bg-white/10 rounded-lg p-2">
               <p className="text-xs text-indigo-100">Velocity</p>
               <p className="text-sm font-semibold">{completionVelocity.toFixed(1)}</p>
             </div>
           </div>
        </div>

        {/* Story Point Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-500" />
              Story Point Distribution
            </h4>
            <div className="space-y-4">
              {sizeDistribution.map((item, index) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.storyPoints} pts</div>
                      <div className="text-xs text-gray-500">{item.count} items</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        width: `${totalStoryPointsAll > 0 ? (item.storyPoints / totalStoryPointsAll) * 100 : 0}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Velocity Insights */}
            <div className="mt-6 space-y-3">
              <h5 className="font-semibold text-gray-900 dark:text-white">Velocity Insights</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Completion Rate</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {totalStoryPointsAll > 0 ? ((completedStoryPoints / totalStoryPointsAll) * 100).toFixed(0) : 0}%
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <p className="text-xs text-green-600 dark:text-green-400">Avg Velocity</p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {completionVelocity.toFixed(1)} pts
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
              Story Point Size Distribution
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    fontSize={12}
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [value, name === 'storyPoints' ? 'Story Points' : 'Items']}
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="storyPoints" 
                    fill="#6366F1"
                    radius={[4, 4, 0, 0]}
                  >
                    {sizeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Size Distribution Insights */}
            <div className="mt-4 space-y-2">
              {largeItems.length > workItems.length * 0.3 && (
                <div className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600" />
                  <span className="text-sm text-yellow-800 dark:text-yellow-200">
                    {largeItems.length} large items (≥8 pts) - consider breaking down
                  </span>
                </div>
              )}
              {smallItems.length > workItems.length * 0.6 && (
                <div className="flex items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  <span className="text-sm text-green-800 dark:text-green-200">
                    Good sizing - {smallItems.length} small items for quick wins
                  </span>
                </div>
              )}
              {mediumItems.length > workItems.length * 0.5 && (
                <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    Balanced sizing - {mediumItems.length} medium items for steady progress
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} size="large">
      {renderDialogContent()}
    </Dialog>
  );
}; 