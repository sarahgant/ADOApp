import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X, Check, Filter, Users } from 'lucide-react';

export interface TeamFilterOptions {
  selectedMembers: string[];
  searchTerm: string;
}

interface TeamFiltersProps {
  uniqueMembers: string[];
  filters: TeamFilterOptions;
  onFiltersChange: (filters: TeamFilterOptions) => void;
  onClearAll: () => void;
  totalMembers: number;
  filteredMembers: number;
}

export const TeamFilters: React.FC<TeamFiltersProps> = ({
  uniqueMembers,
  filters,
  onFiltersChange,
  onClearAll,
  totalMembers,
  filteredMembers,
}) => {
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (memberDropdownRef.current && !memberDropdownRef.current.contains(event.target as Node)) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateFilters = (updates: Partial<TeamFilterOptions>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleMemberToggle = (member: string) => {
    const newMembers = filters.selectedMembers.includes(member)
      ? filters.selectedMembers.filter(m => m !== member)
      : [...filters.selectedMembers, member];
    updateFilters({ selectedMembers: newMembers });
  };

  const selectAllMembers = () => updateFilters({ selectedMembers: uniqueMembers });
  const clearAllMembers = () => updateFilters({ selectedMembers: [] });

  const hasActiveFilters = 
    filters.selectedMembers.length > 0 || 
    filters.searchTerm.length > 0;

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredMembers} of {totalMembers} team members
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search team members..."
          value={filters.searchTerm}
          onChange={(e) => updateFilters({ searchTerm: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
      </div>

      {/* Team Members Filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative" ref={memberDropdownRef}>
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
              filters.selectedMembers.length > 0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>
              Team Members
              {filters.selectedMembers.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                  {filters.selectedMembers.length}
                </span>
              )}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showMemberDropdown && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <button
                    onClick={selectAllMembers}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAllMembers}
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto p-2">
                {uniqueMembers.map(member => (
                  <label
                    key={member}
                    className="flex items-center space-x-2 py-2 px-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.selectedMembers.includes(member)}
                        onChange={() => handleMemberToggle(member)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        filters.selectedMembers.includes(member)
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {filters.selectedMembers.includes(member) && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">{member}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};