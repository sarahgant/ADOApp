import React from 'react';
import { X, Clock, AlertCircle, CheckCircle, Activity, Calendar } from 'lucide-react';
import { WorkItem } from '../../services/adoService';

interface CurrentWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  currentWork: WorkItem[];
  recentWork: WorkItem[];
}

export const CurrentWorkModal: React.FC<CurrentWorkModalProps> = ({
  isOpen,
  onClose,
  memberName,
  currentWork,
  recentWork,
}) => {
  if (!isOpen) return null;

  const getColumnValue = (row: any, possibleNames: string[]) => {
    if (!row || !possibleNames) return null;
    for (const name of possibleNames) {
      if (row[name] !== undefined) return row[name];
    }
    return null;
  };

  const getState = (row: WorkItem) => getColumnValue(row, ['State', 'Status']);
  const getWorkItemType = (row: WorkItem) => getColumnValue(row, ['Work Item Type', 'WorkItemType', 'Type']);
  const getPriority = (row: WorkItem) => getColumnValue(row, ['Priority']);
  const getChangedDate = (row: WorkItem) => getColumnValue(row, ['Changed Date', 'ChangedDate']);
  const getCreatedDate = (row: WorkItem) => getColumnValue(row, ['Created Date', 'CreatedDate']);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStateIcon = (state: string) => {
    switch (state?.toLowerCase()) {
      case 'done':
      case 'closed':
      case 'completed':
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'active':
      case 'in progress':
      case 'committed':
        return <Activity className="w-4 h-4 text-blue-500" />;
      case 'blocked':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string | null | undefined) => {
    if (!priority) return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    
    const priorityStr = String(priority).toLowerCase();
    switch (priorityStr) {
      case 'high':
      case '1':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'medium':
      case '2':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
      case '3':
      case '4':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeColor = (type: string | null | undefined) => {
    if (!type) return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    
    const typeStr = String(type).toLowerCase();
    switch (typeStr) {
      case 'bug':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'user story':
      case 'story':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      case 'task':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'feature':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Current Work - {memberName}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Active assignments and recent activity
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-8">
            {/* Current Active Work */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Currently Active ({currentWork.length})
                </h3>
              </div>
              
              {currentWork.length > 0 ? (
                <div className="space-y-3">
                  {currentWork.map((item) => (
                    <div
                      key={item.ID}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStateIcon(getState(item))}
                            <span className="font-medium text-gray-900 dark:text-white">
                              #{item.ID} - {item.Title}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(getWorkItemType(item))}`}>
                              {getWorkItemType(item)}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(getPriority(item))}`}>
                              {getPriority(item) || 'No'} Priority
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {getState(item)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            Last updated: {formatDate(getChangedDate(item))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No active work items assigned</p>
                </div>
              )}
            </div>

            {/* Recent Work */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Clock className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Activity ({recentWork.length})
                </h3>
              </div>
              
              {recentWork.length > 0 ? (
                <div className="space-y-3">
                  {recentWork.slice(0, 10).map((item) => (
                    <div
                      key={item.ID}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStateIcon(getState(item))}
                            <span className="font-medium text-gray-900 dark:text-white">
                              #{item.ID} - {item.Title}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(getWorkItemType(item))}`}>
                              {getWorkItemType(item)}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                              {getState(item)}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            Last changed: {formatDate(getChangedDate(item))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}; 