import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Filter } from 'lucide-react';

interface WorkItemFiltersProps {
  uniqueTypes: string[];
  uniqueStates: string[];
  selectedTypes: string[];
  selectedStates: string[];
  searchTerm: string;
  onTypesChange: (types: string[]) => void;
  onStatesChange: (states: string[]) => void;
  onSearchChange: (search: string) => void;
  onClearAll: () => void;
  totalItems: number;
  filteredItems: number;
}

export const WorkItemFilters: React.FC<WorkItemFiltersProps> = ({
  uniqueTypes,
  uniqueStates,
  selectedTypes,
  selectedStates,
  searchTerm,
  onTypesChange,
  onStatesChange,
  onSearchChange,
  onClearAll,
  totalItems,
  filteredItems,
}) => {
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeDropdownRef.current && !typeDropdownRef.current.contains(event.target as Node)) {
        setShowTypeDropdown(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    onTypesChange(newTypes);
  };

  const handleStateToggle = (state: string) => {
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates, state];
    onStatesChange(newStates);
  };

  const selectAllTypes = () => {
    onTypesChange(uniqueTypes);
  };

  const clearAllTypes = () => {
    onTypesChange([]);
  };

  const selectAllStates = () => {
    onStatesChange(uniqueStates);
  };

  const clearAllStates = () => {
    onStatesChange([]);
  };

  const hasActiveFilters = selectedTypes.length > 0 || selectedStates.length > 0 || searchTerm.length > 0;

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredItems} of {totalItems} work items
          </span>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdowns and Search on same row */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4">
          {/* Work Item Types Filter */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                selectedTypes.length > 0
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>
                Work Item Types
                {selectedTypes.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                    {selectedTypes.length}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showTypeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <button
                      onClick={selectAllTypes}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllTypes}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {uniqueTypes.map(type => (
                    <label
                      key={type}
                      className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTypes.includes(type)}
                          onChange={() => handleTypeToggle(type)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          selectedTypes.includes(type)
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedTypes.includes(type) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* States Filter */}
          <div className="relative" ref={stateDropdownRef}>
            <button
              onClick={() => setShowStateDropdown(!showStateDropdown)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                selectedStates.length > 0
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              <span>
                States
                {selectedStates.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs">
                    {selectedStates.length}
                  </span>
                )}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showStateDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showStateDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <button
                      onClick={selectAllStates}
                      className="text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearAllStates}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {uniqueStates.map(state => (
                    <label
                      key={state}
                      className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedStates.includes(state)}
                          onChange={() => handleStateToggle(state)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                          selectedStates.includes(state)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedStates.includes(state) && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{state}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search - now on same row as filters, positioned to the right */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search work items..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-80"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedTypes.map(type => (
            <span
              key={`type-${type}`}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
            >
              Type: {type}
              <button
                onClick={() => handleTypeToggle(type)}
                className="ml-1 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedStates.map(state => (
            <span
              key={`state-${state}`}
              className="inline-flex items-center px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full"
            >
              State: {state}
              <button
                onClick={() => handleStateToggle(state)}
                className="ml-1 hover:text-green-600 dark:hover:text-green-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {searchTerm && (
            <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
              Search: "{searchTerm}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-gray-600 dark:hover:text-gray-400"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}; 