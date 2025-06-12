import React, { useState, useRef, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, LogOut, ChevronDown, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

interface ConnectionStatusProps {
  onRefresh?: () => void;
  onDisconnect?: () => void;
  isRefreshing?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  onRefresh, 
  onDisconnect, 
  isRefreshing = false 
}) => {
  const { settings, updateAdoSettings } = useSettings();
  const { ado } = settings;
  const [showAreaPathDropdown, setShowAreaPathDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAreaPathDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAreaPathChange = (newAreaPath: string) => {
    updateAdoSettings({ areaPath: newAreaPath });
    setShowAreaPathDropdown(false);
    // Trigger refresh after area path change
    if (onRefresh) {
      setTimeout(() => onRefresh(), 100);
    }
  };

  if (!ado.isConnected) {
    return (
      <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <WifiOff className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
          Not Connected
        </span>
      </div>
    );
  }

  const serverInfo = `${ado.organization}/${ado.project}`;
  const currentAreaPath = ado.areaPath || 'Default Area';
  const availableAreaPaths = ado.availableAreaPaths || [];

  return (
    <div className="flex items-center space-x-3">
      {/* Connection Status */}
      <div className="flex items-center space-x-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              {serverInfo}
            </span>
            
            {/* Area Path Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowAreaPathDropdown(!showAreaPathDropdown)}
                className="flex items-center space-x-1 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
              >
                <span className="truncate max-w-24">{currentAreaPath}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showAreaPathDropdown && availableAreaPaths.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                  <div className="py-1">
                    {/* Default/All option */}
                    <button
                      onClick={() => handleAreaPathChange('')}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span>All Areas</span>
                      {!ado.areaPath && <Check className="w-4 h-4 text-green-600" />}
                    </button>
                    
                    {/* Available area paths */}
                    {availableAreaPaths.map((areaPath) => (
                      <button
                        key={areaPath.id}
                        onClick={() => handleAreaPathChange(areaPath.name)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <span className="truncate">{areaPath.name}</span>
                        {ado.areaPath === areaPath.name && <Check className="w-4 h-4 text-green-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-1 ml-2 pl-2 border-l border-green-200 dark:border-green-700">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition-colors disabled:opacity-50"
              aria-label="Refresh data"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="p-1 text-green-600 dark:text-green-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-800/30 rounded transition-colors"
              aria-label="Disconnect"
              title="Disconnect from server"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}; 