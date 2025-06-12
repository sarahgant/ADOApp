import { useState, useEffect } from 'react';

export interface ColumnDefinition {
  id: string;
  label: string;
  description: string;
  category: 'basic' | 'timing' | 'workflow' | 'metadata' | 'advanced';
  width?: string;
  sortable: boolean;
  defaultVisible: boolean;
}

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  // Basic Information
  { id: 'id', label: 'ID', description: 'Work item identifier', category: 'basic', width: 'w-20', sortable: true, defaultVisible: true },
  { id: 'title', label: 'Title', description: 'Work item title/summary', category: 'basic', sortable: true, defaultVisible: true },
  { id: 'type', label: 'Type', description: 'Work item type (Bug, Feature, etc.)', category: 'basic', width: 'w-24', sortable: true, defaultVisible: true },
  { id: 'state', label: 'State', description: 'Current state/status', category: 'basic', width: 'w-24', sortable: true, defaultVisible: true },
  
  // Workflow & Assignment
  { id: 'assignee', label: 'Assignee', description: 'Person assigned to work item', category: 'workflow', width: 'w-32', sortable: true, defaultVisible: true },
  { id: 'boardColumn', label: 'Board Column', description: 'Kanban board column', category: 'workflow', width: 'w-32', sortable: true, defaultVisible: true },
  { id: 'priority', label: 'Priority', description: 'Priority level', category: 'workflow', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'severity', label: 'Severity', description: 'Severity level (for bugs)', category: 'workflow', width: 'w-24', sortable: true, defaultVisible: false },
  
  // Effort & Planning
  { id: 'storyPoints', label: 'Story Points', description: 'Effort estimation', category: 'metadata', width: 'w-20', sortable: true, defaultVisible: true },
  { id: 'originalEstimate', label: 'Original Estimate', description: 'Initial time estimate', category: 'metadata', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'remainingWork', label: 'Remaining Work', description: 'Time left to complete', category: 'metadata', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'completedWork', label: 'Completed Work', description: 'Time already spent', category: 'metadata', width: 'w-24', sortable: true, defaultVisible: false },
  
  // Timing & Age Analysis
  { id: 'age', label: 'Age', description: 'Days since creation', category: 'timing', width: 'w-20', sortable: true, defaultVisible: true },
  { id: 'cycleTime', label: 'Cycle Time', description: 'Days in active development', category: 'timing', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'timeInCurrentState', label: 'Time in State', description: 'Days in current state', category: 'timing', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'leadTime', label: 'Lead Time', description: 'Total time from start to completion', category: 'timing', width: 'w-24', sortable: true, defaultVisible: false },
  
  // Dates
  { id: 'created', label: 'Created', description: 'Creation date', category: 'metadata', width: 'w-28', sortable: true, defaultVisible: false },
  { id: 'changed', label: 'Last Changed', description: 'Last modification date', category: 'metadata', width: 'w-28', sortable: true, defaultVisible: false },
  { id: 'resolved', label: 'Resolved', description: 'Resolution date', category: 'metadata', width: 'w-28', sortable: true, defaultVisible: false },
  { id: 'closed', label: 'Closed', description: 'Closure date', category: 'metadata', width: 'w-28', sortable: true, defaultVisible: false },
  
  // Organization
  { id: 'areaPath', label: 'Area Path', description: 'Area/team path', category: 'metadata', width: 'w-32', sortable: true, defaultVisible: false },
  { id: 'iterationPath', label: 'Iteration', description: 'Sprint/iteration path', category: 'metadata', width: 'w-32', sortable: true, defaultVisible: false },
  { id: 'tags', label: 'Tags', description: 'Associated tags/labels', category: 'metadata', width: 'w-24', sortable: true, defaultVisible: true },
  
  // Advanced Insights
  { id: 'valueArea', label: 'Value Area', description: 'Business vs Architectural value', category: 'advanced', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'risk', label: 'Risk', description: 'Risk assessment', category: 'advanced', width: 'w-20', sortable: true, defaultVisible: false },
  { id: 'businessValue', label: 'Business Value', description: 'Business value score', category: 'advanced', width: 'w-24', sortable: true, defaultVisible: false },
  { id: 'timeCriticality', label: 'Time Criticality', description: 'Time sensitivity', category: 'advanced', width: 'w-24', sortable: true, defaultVisible: false },
];

const STORAGE_KEY = 'workItemColumns';

export interface ColumnConfiguration {
  visibleColumns: string[];
  columnOrder: string[];
}

export const useColumnConfiguration = () => {
  const [config, setConfig] = useState<ColumnConfiguration>({
    visibleColumns: AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.id),
    columnOrder: AVAILABLE_COLUMNS.map(col => col.id),
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('Loading column config from localStorage:', saved);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        console.log('Parsed column config:', parsedConfig);
        setConfig(parsedConfig);
      }
      setIsLoaded(true);
    } catch (error) {
      console.warn('Failed to load column configuration:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save configuration to localStorage whenever it changes (but not on initial load)
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      console.log('Saving column config to localStorage:', config);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save column configuration:', error);
    }
  }, [config, isLoaded]);

  const updateVisibleColumns = (columnIds: string[]) => {
    setConfig(prev => ({ ...prev, visibleColumns: columnIds }));
  };

  const updateColumnOrder = (newOrder: string[]) => {
    setConfig(prev => ({ ...prev, columnOrder: newOrder }));
  };

  const toggleColumn = (columnId: string) => {
    console.log('Toggling column:', columnId);
    setConfig(prev => {
      const newConfig = {
        ...prev,
        visibleColumns: prev.visibleColumns.includes(columnId)
          ? prev.visibleColumns.filter(id => id !== columnId)
          : [...prev.visibleColumns, columnId]
      };
      console.log('New column config after toggle:', newConfig);
      return newConfig;
    });
  };

  const resetToDefaults = () => {
    setConfig({
      visibleColumns: AVAILABLE_COLUMNS.filter(col => col.defaultVisible).map(col => col.id),
      columnOrder: AVAILABLE_COLUMNS.map(col => col.id),
    });
  };

  const getVisibleColumnDefinitions = () => {
    return config.columnOrder
      .filter(id => config.visibleColumns.includes(id))
      .map(id => AVAILABLE_COLUMNS.find(col => col.id === id))
      .filter(Boolean) as ColumnDefinition[];
  };

  const getColumnsByCategory = () => {
    const categories: Record<string, ColumnDefinition[]> = {};
    AVAILABLE_COLUMNS.forEach(col => {
      if (!categories[col.category]) {
        categories[col.category] = [];
      }
      categories[col.category].push(col);
    });
    return categories;
  };

  return {
    config,
    visibleColumns: config.visibleColumns,
    columnOrder: config.columnOrder,
    updateVisibleColumns,
    updateColumnOrder,
    toggleColumn,
    resetToDefaults,
    getVisibleColumnDefinitions,
    getColumnsByCategory,
    availableColumns: AVAILABLE_COLUMNS,
  };
}; 