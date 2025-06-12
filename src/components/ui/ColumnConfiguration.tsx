import React, { useState } from 'react';
import { Settings, Eye, EyeOff, RotateCcw, Check, X } from 'lucide-react';
import { useColumnConfiguration, ColumnDefinition } from '../../hooks/useColumnConfiguration';

interface ColumnConfigurationProps {
  isOpen: boolean;
  onClose: () => void;
  columnConfig?: ReturnType<typeof useColumnConfiguration>;
}

const CATEGORY_LABELS = {
  basic: 'Basic Information',
  timing: 'Timing & Age Analysis',
  workflow: 'Workflow & Assignment',
  metadata: 'Metadata & Planning',
  advanced: 'Advanced Insights',
};

const CATEGORY_DESCRIPTIONS = {
  basic: 'Essential work item information',
  timing: 'Time-based metrics and analysis',
  workflow: 'Assignment and process tracking',
  metadata: 'Additional context and planning data',
  advanced: 'Business value and risk assessment',
};

export const ColumnConfiguration: React.FC<ColumnConfigurationProps> = ({ isOpen, onClose, columnConfig }) => {
  const hookConfig = useColumnConfiguration();
  const {
    visibleColumns,
    toggleColumn,
    resetToDefaults,
    getColumnsByCategory,
    availableColumns,
  } = columnConfig || hookConfig;

  const [expandedCategories, setExpandedCategories] = useState<string[]>(['basic', 'timing']);

  const columnsByCategory = getColumnsByCategory();

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const selectAllInCategory = (category: string) => {
    const categoryColumns = columnsByCategory[category] || [];
    const allVisible = categoryColumns.every(col => visibleColumns.includes(col.id));
    
    categoryColumns.forEach(col => {
      if (allVisible && visibleColumns.includes(col.id)) {
        toggleColumn(col.id);
      } else if (!allVisible && !visibleColumns.includes(col.id)) {
        toggleColumn(col.id);
      }
    });
  };

  const getVisibleCount = () => visibleColumns.length;
  const getTotalCount = () => availableColumns.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Configure Columns
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose which columns to display in the work items table ({getVisibleCount()} of {getTotalCount()} selected)
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={resetToDefaults}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset to Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <div className="space-y-6">
            {Object.entries(columnsByCategory).map(([category, columns]) => {
              const isExpanded = expandedCategories.includes(category);
              const visibleInCategory = columns.filter(col => visibleColumns.includes(col.id)).length;
              const totalInCategory = columns.length;
              const allVisible = visibleInCategory === totalInCategory;

              return (
                <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  {/* Category Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                        </h3>
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                          {visibleInCategory}/{totalInCategory}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {CATEGORY_DESCRIPTIONS[category as keyof typeof CATEGORY_DESCRIPTIONS]}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllInCategory(category);
                        }}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        {allVisible ? 'Hide All' : 'Show All'}
                      </button>
                      <div className="transform transition-transform">
                        {isExpanded ? (
                          <div className="w-5 h-5 text-gray-400">▼</div>
                        ) : (
                          <div className="w-5 h-5 text-gray-400">▶</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Category Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {columns.map((column: ColumnDefinition) => {
                          const isVisible = visibleColumns.includes(column.id);
                          return (
                            <label
                              key={column.id}
                              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            >
                              <div className="relative mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={isVisible}
                                  onChange={() => toggleColumn(column.id)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                                  isVisible
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {isVisible && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {column.label}
                                  </span>
                                  {isVisible ? (
                                    <Eye className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <EyeOff className="w-4 h-4 text-gray-400" />
                                  )}
                                  {!column.sortable && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                                      No sort
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {column.description}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium">{getVisibleCount()}</span> columns selected
            {getVisibleCount() > 8 && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                • Many columns may require horizontal scrolling
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}; 