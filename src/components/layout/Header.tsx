import React from 'react';
import { Settings, BarChart3 } from 'lucide-react';
import { ThemeSwitcher } from '../ui/ThemeSwitcher';
import { ConnectionStatus } from '../ui/ConnectionStatus';

interface HeaderProps {
  onSettingsClick?: () => void;
  onRefreshData?: () => void;
  onDisconnect?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  onSettingsClick, 
  onRefreshData, 
  onDisconnect, 
  isRefreshing 
}) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center h-16">
        {/* Far Left - App Name (positioned above sidebar area) */}
        <div className="w-64 flex items-center space-x-2 px-4 border-r border-gray-200 dark:border-gray-700">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              Work Item Analytics
            </h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Azure DevOps Dashboard
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Far Right - All Controls */}
        <div className="flex items-center space-x-4 px-4">
          {/* Connection Status */}
          <ConnectionStatus 
            onRefresh={onRefreshData}
            onDisconnect={onDisconnect}
            isRefreshing={isRefreshing}
          />
          
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* Settings Button */}
          {onSettingsClick && (
            <button
              onClick={onSettingsClick}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Open settings"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}; 