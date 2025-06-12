import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Tag, User, Clock, AlertCircle, ExternalLink, Columns, Settings } from 'lucide-react';
import { WorkItem } from '../../services/adoService';
import { useSettings } from '../../context/SettingsContext';
import { usePersistedFilters } from '../../hooks/usePersistedFilters';
import { useColumnConfiguration } from '../../hooks/useColumnConfiguration';
import { WorkItemFilters } from './WorkItemFilters';
import { ColumnConfiguration } from './ColumnConfiguration';

interface WorkItemsTableProps {
  workItems: WorkItem[];
  loading?: boolean;
}

type SortField = 'id' | 'title' | 'type' | 'state' | 'assignee' | 'storyPoints' | 'boardColumn' | 'age' | 'cycleTime' | 'timeInCurrentState' | 'leadTime' | 'priority' | 'severity' | 'created' | 'changed' | 'resolved' | 'closed' | 'areaPath' | 'iterationPath' | 'valueArea' | 'risk' | 'businessValue' | 'timeCriticality' | 'originalEstimate' | 'remainingWork' | 'completedWork' | 'tags';
type SortDirection = 'asc' | 'desc';

export const WorkItemsTable: React.FC<WorkItemsTableProps> = ({ workItems, loading = false }) => {
  const { settings } = useSettings();
  const { filters, updateFilters, clearAllFilters } = usePersistedFilters();
  const columnConfig = useColumnConfiguration();
  const { getVisibleColumnDefinitions } = columnConfig;
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showColumnConfig, setShowColumnConfig] = useState(false);

  const visibleColumns = getVisibleColumnDefinitions();

  // Helper functions to extract data from work items
  const getValue = (item: WorkItem, field: string, fallback: any = '') => {
    return item[field] || fallback;
  };

  const getId = (item: WorkItem) => String(getValue(item, 'ID') || getValue(item, 'Id') || getValue(item, 'Work Item ID') || '');
  const getTitle = (item: WorkItem) => String(getValue(item, 'Title') || getValue(item, 'Summary') || '');
  const getType = (item: WorkItem) => String(getValue(item, 'Work Item Type') || getValue(item, 'Type') || getValue(item, 'Issue Type') || '');
  const getState = (item: WorkItem) => String(getValue(item, 'State') || getValue(item, 'Status') || '');
  const getAssignee = (item: WorkItem) => String(getValue(item, 'Assigned To') || getValue(item, 'AssignedTo') || getValue(item, 'Assignee') || 'Unassigned');
  const getStoryPoints = (item: WorkItem) => {
    const points = getValue(item, 'Story Points') || getValue(item, 'StoryPoints') || getValue(item, 'Points') || getValue(item, 'Effort') || getValue(item, 'Size') || 0;
    return parseFloat(String(points)) || 0;
  };
  const getTags = (item: WorkItem) => String(getValue(item, 'Tags') || getValue(item, 'Labels') || '');
  const getCreated = (item: WorkItem) => getValue(item, 'Created Date') || getValue(item, 'CreatedDate') || getValue(item, 'Created') || '';
  const getBoardColumn = (item: WorkItem) => String(getValue(item, 'Board Column') || getValue(item, 'BoardColumn') || 'Not Set');
  const getPriority = (item: WorkItem) => String(getValue(item, 'Priority') || 'Unknown');
  const getSeverity = (item: WorkItem) => String(getValue(item, 'Severity') || 'Unknown');
  const getValueArea = (item: WorkItem) => String(getValue(item, 'Value Area') || 'Business');
  const getRisk = (item: WorkItem) => String(getValue(item, 'Risk') || 'Medium');
  const getAreaPath = (item: WorkItem) => String(getValue(item, 'Area Path') || '');
  const getIterationPath = (item: WorkItem) => String(getValue(item, 'Iteration Path') || '');
  const getChanged = (item: WorkItem) => getValue(item, 'Changed Date') || getValue(item, 'ChangedDate') || '';
  const getResolved = (item: WorkItem) => getValue(item, 'Resolved Date') || getValue(item, 'ResolvedDate') || '';
  const getClosed = (item: WorkItem) => getValue(item, 'Closed Date') || getValue(item, 'ClosedDate') || '';
  const getActivated = (item: WorkItem) => getValue(item, 'Activated Date') || getValue(item, 'ActivatedDate') || '';
  const getStateChanged = (item: WorkItem) => getValue(item, 'State Change Date') || getValue(item, 'StateChangeDate') || '';
  const getBusinessValue = (item: WorkItem) => parseFloat(String(getValue(item, 'Business Value') || 0)) || 0;
  const getTimeCriticality = (item: WorkItem) => String(getValue(item, 'Time Criticality') || 'Unknown');
  const getOriginalEstimate = (item: WorkItem) => parseFloat(String(getValue(item, 'Original Estimate') || 0)) || 0;
  const getRemainingWork = (item: WorkItem) => parseFloat(String(getValue(item, 'Remaining Work') || 0)) || 0;
  const getCompletedWork = (item: WorkItem) => parseFloat(String(getValue(item, 'Completed Work') || 0)) || 0;

  // Calculate age in days (stops counting when item is closed)
  const getAge = (item: WorkItem) => {
    const createdDate = getCreated(item);
    if (!createdDate) return 0;
    
    try {
      const created = new Date(createdDate);
      // Use closed/resolved date if available, otherwise current date
      const endDate = getResolved(item) || getClosed(item) || new Date();
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // Calculate cycle time (time since activated/in progress, stops when closed)
  const getCycleTime = (item: WorkItem) => {
    const activatedDate = getActivated(item);
    if (!activatedDate) return 0;
    
    try {
      const activated = new Date(activatedDate);
      // Use closed/resolved date if available, otherwise current date
      const endDate = getResolved(item) || getClosed(item) || new Date();
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - activated.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // Calculate time in current state (stops counting when item is closed)
  const getTimeInCurrentState = (item: WorkItem) => {
    const stateChangedDate = getStateChanged(item);
    if (!stateChangedDate) return 0;
    
    try {
      const stateChanged = new Date(stateChangedDate);
      // Use closed/resolved date if available, otherwise current date
      const endDate = getResolved(item) || getClosed(item) || new Date();
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - stateChanged.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // Calculate lead time (creation to completion)
  const getLeadTime = (item: WorkItem) => {
    const createdDate = getCreated(item);
    const resolvedDate = getResolved(item) || getClosed(item);
    
    if (!createdDate || !resolvedDate) return 0;
    
    try {
      const created = new Date(createdDate);
      const resolved = new Date(resolvedDate);
      const diffTime = Math.abs(resolved.getTime() - created.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  // Get age color based on staleness
  const getAgeColor = (days: number) => {
    if (days <= 7) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; // Fresh (0-7 days)
    } else if (days <= 30) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'; // Getting stale (8-30 days)
    } else if (days <= 90) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'; // Stale (31-90 days)
    } else {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'; // Very stale (90+ days)
    }
  };

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = Array.from(new Set(workItems.map(item => getType(item)).filter(Boolean)));
    return types.sort();
  }, [workItems, getType]);

  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(workItems.map(item => getState(item)).filter(Boolean)));
    return states.sort();
  }, [workItems, getState]);

  // Generate work item URL
  const getWorkItemUrl = (id: string) => {
    if (!settings.ado.organization || !settings.ado.project || !id) return '#';
    return `https://dev.azure.com/${settings.ado.organization}/${settings.ado.project}/_workitems/edit/${id}`;
  };

  // Get value for any column
  const getColumnValue = (item: WorkItem, columnId: string): any => {
    switch (columnId) {
      case 'id': return getId(item);
      case 'title': return getTitle(item);
      case 'type': return getType(item);
      case 'state': return getState(item);
      case 'assignee': return getAssignee(item);
      case 'storyPoints': return getStoryPoints(item);
      case 'boardColumn': return getBoardColumn(item);
      case 'priority': return getPriority(item);
      case 'severity': return getSeverity(item);
      case 'age': return getAge(item);
      case 'cycleTime': return getCycleTime(item);
      case 'timeInCurrentState': return getTimeInCurrentState(item);
      case 'leadTime': return getLeadTime(item);
      case 'created': return getCreated(item);
      case 'changed': return getChanged(item);
      case 'resolved': return getResolved(item);
      case 'closed': return getClosed(item);
      case 'areaPath': return getAreaPath(item);
      case 'iterationPath': return getIterationPath(item);
      case 'tags': return getTags(item);
      case 'valueArea': return getValueArea(item);
      case 'risk': return getRisk(item);
      case 'businessValue': return getBusinessValue(item);
      case 'timeCriticality': return getTimeCriticality(item);
      case 'originalEstimate': return getOriginalEstimate(item);
      case 'remainingWork': return getRemainingWork(item);
      case 'completedWork': return getCompletedWork(item);
      default: return '';
    }
  };

  // Filter and sort work items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = workItems.filter(item => {
      const matchesSearch = filters.searchTerm === '' || 
        getTitle(item).toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        getId(item).toString().includes(filters.searchTerm) ||
        getTags(item).toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesType = filters.selectedTypes.length === 0 || filters.selectedTypes.includes(getType(item));
      const matchesState = filters.selectedStates.length === 0 || filters.selectedStates.includes(getState(item));
      
      return matchesSearch && matchesType && matchesState;
    });

    // Sort items
    filtered.sort((a, b) => {
      const aValue = getColumnValue(a, sortField);
      const bValue = getColumnValue(b, sortField);

      // Handle different data types
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }

      // String comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [workItems, sortField, sortDirection, filters, getColumnValue]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const getStateColor = (state: any) => {
    if (!state) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    const lowerState = String(state).toLowerCase();
    if (['closed', 'done', 'completed', 'resolved'].includes(lowerState)) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (['active', 'in progress', 'committed', 'open'].includes(lowerState)) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (['new', 'proposed', 'to do'].includes(lowerState)) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  };

  const getBoardColumnColor = (column: any) => {
    if (!column || column === 'Not Set') return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    const lowerColumn = String(column).toLowerCase();
    if (['done', 'completed', 'closed'].includes(lowerColumn)) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (['in progress', 'active', 'doing'].includes(lowerColumn)) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (['to do', 'new', 'backlog'].includes(lowerColumn)) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  };

  const getTypeColor = (type: any) => {
    if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    const lowerType = String(type).toLowerCase();
    if (['bug', 'defect', 'issue'].includes(lowerType)) {
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
    if (['feature', 'user story', 'story'].includes(lowerType)) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
    if (['task', 'subtask'].includes(lowerType)) {
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    }
    if (['epic'].includes(lowerType)) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    }
    if (['test case', 'test'].includes(lowerType)) {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
  };

  const formatDate = (dateStr: any) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return String(dateStr);
    }
  };

  const parseTags = (tagsStr: any) => {
    if (!tagsStr) return [];
    return String(tagsStr).split(';').map(tag => tag.trim()).filter(Boolean);
  };

  // Render cell content based on column type
  const renderCellContent = (item: WorkItem, columnId: string) => {
    const value = getColumnValue(item, columnId);

    switch (columnId) {
      case 'id':
        return (
          <a
            href={getWorkItemUrl(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center space-x-1"
          >
            <span>{value}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      
      case 'title':
        return (
          <div className="truncate max-w-xs font-medium text-gray-900 dark:text-white" title={value}>
            {value}
          </div>
        );
      
      case 'type':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(value)}`}>
            {value}
          </span>
        );
      
      case 'state':
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStateColor(value)}`}>
            {value}
          </span>
        );
      
      case 'boardColumn':
        return (
          <div className="flex items-center">
            <Columns className="w-3 h-3 mr-1 text-gray-400" />
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getBoardColumnColor(value)}`}>
              {value}
            </span>
          </div>
        );
      
      case 'assignee':
        return (
          <div className="flex items-center">
            <User className="w-3 h-3 mr-1 text-gray-400" />
            <span className="truncate max-w-24 font-medium text-gray-900 dark:text-white" title={value}>
              {value}
            </span>
          </div>
        );
      
      case 'age':
      case 'cycleTime':
      case 'timeInCurrentState':
      case 'leadTime':
        const days = value;
        const createdDate = getCreated(item);
        
        // Create tooltip text based on column type
        const resolvedDate = getResolved(item) || getClosed(item);
        const isClosed = !!resolvedDate;
        let tooltipText = '';
        
        if (columnId === 'age') {
          tooltipText = isClosed 
            ? `Age: ${days} days from creation to closure (${formatDate(createdDate)} - ${formatDate(resolvedDate)})`
            : `Age: ${days} days since creation (${formatDate(createdDate)})`;
        } else if (columnId === 'cycleTime') {
          tooltipText = isClosed
            ? `Cycle Time: ${days} days from start to closure (time in active development)`
            : `Cycle Time: ${days} days since work started (time in active development)`;
        } else if (columnId === 'timeInCurrentState') {
          tooltipText = isClosed
            ? `Time in Final State: ${days} days from last state change to closure`
            : `Time in Current State: ${days} days since last state change`;
        } else if (columnId === 'leadTime') {
          tooltipText = `Lead Time: ${days} days from creation to completion`;
        }
        
        return (
          <div className="flex items-center" title={tooltipText}>
            <Clock className="w-3 h-3 mr-1 text-gray-400" />
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md ${getAgeColor(days)}`}>
              {days}d
            </span>
          </div>
        );
      
      case 'storyPoints':
      case 'businessValue':
      case 'originalEstimate':
      case 'remainingWork':
      case 'completedWork':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
            {value || '—'}
          </span>
        );
      
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {parseTags(value).slice(0, 2).map((tag, tagIndex) => (
              <span 
                key={tagIndex}
                className="inline-flex items-center px-1 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded"
              >
                <Tag className="w-2 h-2 mr-0.5" />
                {tag}
              </span>
            ))}
            {parseTags(value).length > 2 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{parseTags(value).length - 2}
              </span>
            )}
          </div>
        );
      
      case 'created':
      case 'changed':
      case 'resolved':
      case 'closed':
        return (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(value)}
          </div>
        );
      
      default:
        return <span className="font-medium text-gray-900 dark:text-white">{String(value)}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading work items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header with title, area path, and column config button */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Work Items</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {settings.ado.areaPath && (
                <span className="text-blue-600 dark:text-blue-400">
                  Area: {settings.ado.areaPath}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowColumnConfig(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Settings className="w-4 h-4" />
            <span>Configure Columns</span>
          </button>
        </div>
      </div>

      {/* Improved Filters */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <WorkItemFilters
          uniqueTypes={uniqueTypes}
          uniqueStates={uniqueStates}
          selectedTypes={filters.selectedTypes}
          selectedStates={filters.selectedStates}
          searchTerm={filters.searchTerm}
          onTypesChange={(types) => updateFilters({ selectedTypes: types })}
          onStatesChange={(states) => updateFilters({ selectedStates: states })}
          onSearchChange={(search) => updateFilters({ searchTerm: search })}
          onClearAll={clearAllFilters}
          totalItems={workItems.length}
          filteredItems={filteredAndSortedItems.length}
        />
      </div>

      {/* Table - now using configurable columns */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {visibleColumns.map((column) => (
                <th 
                  key={column.id}
                  className={`px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                  } ${column.width || ''}`}
                  onClick={() => column.sortable && handleSort(column.id as SortField)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && getSortIcon(column.id as SortField)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedItems.map((item, index) => (
              <tr key={getId(item) || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                {visibleColumns.map((column) => (
                  <td key={column.id} className="px-3 py-4 whitespace-nowrap text-sm">
                    {renderCellContent(item, column.id)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          </table>
        </div>
        
        {filteredAndSortedItems.length === 0 && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No work items found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filters.searchTerm || filters.selectedTypes.length > 0 || filters.selectedStates.length > 0
                ? 'Try adjusting your search or filters.' 
                : 'No work items available.'}
            </p>
          </div>
        )}
      </div>

      {/* Column Configuration Modal */}
      <ColumnConfiguration 
        isOpen={showColumnConfig}
        onClose={() => setShowColumnConfig(false)}
        columnConfig={columnConfig}
      />
    </div>
  );
}; 