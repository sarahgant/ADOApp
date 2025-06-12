import React, { createContext, useContext, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { adoService, AreaPath, AdoConnectionResult } from '../services/adoService';

export interface AdoSettings {
  organization: string;
  project: string;
  personalAccessToken: string;
  areaPath: string;
  isConnected: boolean;
  availableAreaPaths: AreaPath[];
}

export interface SprintSettings {
  sprintDuration: number; // in weeks
  sprintStartDate: string;
}

export interface AppSettings {
  ado: AdoSettings;
  sprint: SprintSettings;
}

interface SettingsContextType {
  settings: AppSettings;
  updateAdoSettings: (adoSettings: Partial<AdoSettings>) => void;
  updateSprintSettings: (sprintSettings: Partial<SprintSettings>) => void;
  resetSettings: () => void;
  testConnection: () => Promise<AdoConnectionResult>;
  disconnect: () => void;
  isTestingConnection: boolean;
}

const defaultSettings: AppSettings = {
  ado: {
    organization: '',
    project: '',
    personalAccessToken: '',
    areaPath: '',
    isConnected: false,
    availableAreaPaths: [],
  },
  sprint: {
    sprintDuration: 2,
    sprintStartDate: '',
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: React.ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', defaultSettings);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Ensure all values are always strings (never undefined) to prevent controlled/uncontrolled input warnings
  const safeSettings: AppSettings = {
    ado: {
      organization: settings.ado?.organization || '',
      project: settings.ado?.project || '',
      personalAccessToken: settings.ado?.personalAccessToken || '',
      areaPath: settings.ado?.areaPath || '',
      isConnected: settings.ado?.isConnected || false,
      availableAreaPaths: settings.ado?.availableAreaPaths || [],
    },
    sprint: {
      sprintDuration: settings.sprint?.sprintDuration || 2,
      sprintStartDate: settings.sprint?.sprintStartDate || '',
    },
  };

  const updateAdoSettings = (adoSettings: Partial<AdoSettings>) => {
    setSettings(prev => ({
      ...prev,
      ado: { ...prev.ado, ...adoSettings }
    }));
  };

  const updateSprintSettings = (sprintSettings: Partial<SprintSettings>) => {
    setSettings(prev => ({
      ...prev,
      sprint: { ...prev.sprint, ...sprintSettings }
    }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  const testConnection = async (): Promise<AdoConnectionResult> => {
    setIsTestingConnection(true);
    
    try {
      const result = await adoService.testConnection(
        safeSettings.ado.organization,
        safeSettings.ado.project,
        safeSettings.ado.personalAccessToken
      );

      if (result.success && result.areaPaths) {
        updateAdoSettings({ 
          isConnected: true,
          availableAreaPaths: result.areaPaths
        });
      } else {
        updateAdoSettings({ 
          isConnected: false,
          availableAreaPaths: []
        });
      }

      return result;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const disconnect = () => {
    updateAdoSettings({ 
      isConnected: false,
      availableAreaPaths: []
    });
  };

  const value = {
    settings: safeSettings,
    updateAdoSettings,
    updateSprintSettings,
    resetSettings,
    testConnection,
    disconnect,
    isTestingConnection,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 