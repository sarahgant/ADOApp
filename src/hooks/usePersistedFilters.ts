import { useState, useEffect } from 'react';

interface FilterState {
  selectedTypes: string[];
  selectedStates: string[];
  searchTerm: string;
}

const STORAGE_KEY = 'workItemFilters';

export const usePersistedFilters = () => {
  const [filters, setFilters] = useState<FilterState>({
    selectedTypes: [],
    selectedStates: [],
    searchTerm: '',
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      console.log('Loading filters from localStorage:', saved);
      if (saved) {
        const parsedFilters = JSON.parse(saved);
        console.log('Parsed filters:', parsedFilters);
        setFilters(parsedFilters);
      }
      setIsLoaded(true);
    } catch (error) {
      console.warn('Failed to load saved filters:', error);
      setIsLoaded(true);
    }
  }, []);

  // Save filters to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (!isLoaded) return;
    
    try {
      console.log('Saving filters to localStorage:', filters);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn('Failed to save filters:', error);
    }
  }, [filters, isLoaded]);

  const updateFilters = (updates: Partial<FilterState>) => {
    console.log('Updating filters with:', updates);
    setFilters(prev => {
      const newFilters = { ...prev, ...updates };
      console.log('New filter state:', newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    console.log('Clearing all filters');
    setFilters({
      selectedTypes: [],
      selectedStates: [],
      searchTerm: '',
    });
  };

  return {
    filters,
    updateFilters,
    clearAllFilters,
  };
}; 