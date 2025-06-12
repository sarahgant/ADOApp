import React, { useState, ChangeEvent } from 'react';
import { Save, RefreshCw, Eye, EyeOff, Server, Calendar, CheckCircle, XCircle, Wifi, ExternalLink } from 'lucide-react';
import { useSettings, AdoSettings } from '../context/SettingsContext';

export const Settings = () => {
  const { 
    settings, 
    updateAdoSettings, 
    updateSprintSettings, 
    resetSettings, 
    testConnection, 
    isTestingConnection 
  } = useSettings();
  
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);

  const handleAdoChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Update the field and reset connection status in a single call
    const updates: Partial<AdoSettings> = { [name]: value };
    
    // Reset connection status when credentials change
    if (['organization', 'project', 'personalAccessToken'].includes(name)) {
      updates.isConnected = false;
    }
    
    updateAdoSettings(updates);
    
    // Reset local connection status
    if (['organization', 'project', 'personalAccessToken'].includes(name)) {
      setConnectionStatus(null);
      setConnectionMessage('');
    }
  };

  const handleSprintChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'sprintDuration' ? parseInt(value, 10) : value;
    updateSprintSettings({ [name]: processedValue });
  };

  const handleTestConnection = async () => {
    setConnectionMessage('');
    setConnectionStatus(null);
    
    const result = await testConnection();
    
    if (result.success) {
      setConnectionStatus('success');
      setConnectionMessage(`Connected successfully! Found ${settings.ado.availableAreaPaths?.length || 0} area paths.`);
    } else {
      setConnectionStatus('error');
      setConnectionMessage(result.error || 'Connection failed');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // In a real app, you might want to show a toast notification here
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values?')) {
      resetSettings();
      setConnectionStatus(null);
      setConnectionMessage('');
    }
  };

  const canTestConnection = settings.ado.organization && settings.ado.project && settings.ado.personalAccessToken;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure your Azure DevOps connection and sprint settings
          </p>
        </div>

        <div className="p-6 space-y-8">
          {/* ADO Connection Settings */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Server className="w-5 h-5 text-azure-blue mr-2" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Azure DevOps Connection
                </h3>
              </div>
              
              {/* Connection Status Indicator */}
              <div className="flex items-center space-x-2">
                {settings.ado.isConnected ? (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">Not Connected</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="organization" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organization
                </label>
                <input
                  type="text"
                  id="organization"
                  name="organization"
                  value={settings.ado.organization}
                  onChange={handleAdoChange}
                  placeholder="e.g., mycompany"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project
                </label>
                <input
                  type="text"
                  id="project"
                  name="project"
                  value={settings.ado.project}
                  onChange={handleAdoChange}
                  placeholder="e.g., MyProject"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="personalAccessToken" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <div className="flex items-center">
                    Personal Access Token
                    <a 
                      href="https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      How to create
                    </a>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    id="personalAccessToken"
                    name="personalAccessToken"
                    value={settings.ado.personalAccessToken}
                    onChange={handleAdoChange}
                    placeholder="Paste your Personal Access Token here"
                    autoComplete="new-password"
                    spellCheck="false"
                    style={{
                      width: '100%',
                      padding: '8px 40px 8px 12px',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      backgroundColor: 'white',
                      color: 'black',
                      fontSize: '14px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Needs "Work Items (Read)" permission minimum
                </p>
              </div>
            </div>

            {/* Test Connection Button */}
            <div className="mt-6">
              <button
                onClick={handleTestConnection}
                disabled={!canTestConnection || isTestingConnection}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-azure-blue hover:bg-azure-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-azure-blue disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Wifi className="w-4 h-4 mr-2" />
                )}
                {isTestingConnection ? 'Testing Connection...' : 'Test Connection'}
              </button>
            </div>

            {/* Connection Message */}
            {connectionMessage && (
              <div className={`mt-3 p-3 rounded-md ${
                connectionStatus === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                <div className="flex items-center">
                  {connectionStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm">{connectionMessage}</span>
                </div>
              </div>
            )}

            {/* Area Path Selection */}
            {(settings.ado.availableAreaPaths?.length || 0) > 0 && (
              <div className="mt-4">
                <label htmlFor="areaPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Area Path (Optional)
                </label>
                <select
                  id="areaPath"
                  name="areaPath"
                  value={settings.ado.areaPath}
                  onChange={handleAdoChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontSize: '14px'
                  }}
                >
                  <option value="">All areas</option>
                  {(settings.ado.availableAreaPaths || []).map((areaPath) => (
                    <option key={areaPath.id} value={areaPath.path}>
                      {areaPath.path}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sprint Settings */}
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-azure-blue mr-2" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sprint Configuration
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="sprintDuration" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sprint Duration (weeks)
                </label>
                <input
                  type="number"
                  id="sprintDuration"
                  name="sprintDuration"
                  value={settings.sprint.sprintDuration}
                  onChange={handleSprintChange}
                  min="1"
                  max="8"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label htmlFor="sprintStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sprint Start Date
                </label>
                <input
                  type="date"
                  id="sprintStartDate"
                  name="sprintStartDate"
                  value={settings.sprint.sprintStartDate}
                  onChange={handleSprintChange}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: 'white',
                    color: 'black',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 rounded-b-lg">
          <div className="flex justify-between">
            <button
              onClick={handleReset}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-azure-blue"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Defaults
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-azure-blue hover:bg-azure-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-azure-blue disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 