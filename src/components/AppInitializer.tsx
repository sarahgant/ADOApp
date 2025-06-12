import React, { ReactNode } from 'react';
import { AlertTriangle, Wifi, WifiOff, Monitor, Clock, CheckCircle } from 'lucide-react';
import { useAppInitialization } from '../hooks/useAppInitialization';

/**
 * Props for the AppInitializer component
 */
interface AppInitializerProps {
  children: ReactNode;
  onInitializationComplete?: () => void;
  onInitializationError?: (error: string) => void;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 ${sizeClasses[size]}`} />
  );
};

/**
 * Progress bar component
 */
const ProgressBar: React.FC<{
  current: number;
  total: number;
  message: string;
  ariaLabel: string;
}> = ({ current, total, message, ariaLabel }) => {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {message}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {current}/{total}
        </span>
      </div>
      <div 
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={ariaLabel}
      >
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Browser compatibility warning component
 */
const BrowserWarning: React.FC<{
  browserInfo: {
    name: string;
    isSupported: boolean;
    unsupportedReason?: string;
    missingFeatures: string[];
  };
}> = ({ browserInfo }) => {
  if (browserInfo.isSupported) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
            Browser Compatibility Issue
          </h3>
          <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
            {browserInfo.unsupportedReason}
          </p>
          {browserInfo.missingFeatures.length > 0 && (
            <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
              Missing features: {browserInfo.missingFeatures.join(', ')}
            </p>
          )}
          <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
            For the best experience, please update your browser or use Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Network status indicator component
 */
const NetworkStatus: React.FC<{
  networkInfo: {
    isOnline: boolean;
    connectionType?: string;
  };
}> = ({ networkInfo }) => {
  return (
    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-4">
      {networkInfo.isOnline ? (
        <>
          <Wifi className="h-4 w-4 mr-2 text-green-500" />
          <span>Connected</span>
          {networkInfo.connectionType && networkInfo.connectionType !== 'unknown' && (
            <span className="ml-1">({networkInfo.connectionType})</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 mr-2 text-red-500" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

/**
 * Initialization error component
 */
const InitializationError: React.FC<{
  error: string;
  onRetry: () => void;
}> = ({ error, onRetry }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Initialization Failed
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {error}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Main loading screen component
 */
const LoadingScreen: React.FC<{
  initProgress: {
    current: number;
    total: number;
    message: string;
    ariaLabel: string;
  };
  browserInfo: {
    name: string;
    isSupported: boolean;
    unsupportedReason?: string;
    missingFeatures: string[];
  };
  networkInfo: {
    isOnline: boolean;
    connectionType?: string;
  };
  performanceMetrics?: {
    initTime: number;
  };
}> = ({ initProgress, browserInfo, networkInfo, performanceMetrics }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <LoadingSpinner size="lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Monitor className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Work Item Analytics
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400">
            Initializing your dashboard...
          </p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <ProgressBar
            current={initProgress.current}
            total={initProgress.total}
            message={initProgress.message}
            ariaLabel={initProgress.ariaLabel}
          />
        </div>

        {/* System Information */}
        <div className="space-y-4">
          {/* Browser Info */}
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Monitor className="h-4 w-4 mr-2" />
            <span>Browser: {browserInfo.name}</span>
            {browserInfo.isSupported && (
              <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
            )}
          </div>

          {/* Network Status */}
          <NetworkStatus networkInfo={networkInfo} />

          {/* Performance Info */}
          {performanceMetrics && (
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 mr-2" />
              <span>Load time: {Math.round(performanceMetrics.initTime)}ms</span>
            </div>
          )}
        </div>

        {/* Browser Warning */}
        <BrowserWarning browserInfo={browserInfo} />

        {/* Accessibility Announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {initProgress.ariaLabel}
        </div>
      </div>
    </div>
  );
};

/**
 * AppInitializer component that handles application initialization
 * 
 * Features:
 * - Progressive loading with visual feedback
 * - Browser compatibility checking
 * - Network connectivity monitoring
 * - Performance metrics display
 * - Accessibility support with screen reader announcements
 * - Error handling with retry mechanisms
 * - Professional loading UI with system information
 */
export const AppInitializer: React.FC<AppInitializerProps> = ({
  children,
  onInitializationComplete,
  onInitializationError,
}) => {
  const {
    isInitialized,
    isInitializing,
    initError,
    initProgress,
    browserInfo,
    networkInfo,
    performanceMetrics,
    announcements,
  } = useAppInitialization();

  // Handle initialization completion
  React.useEffect(() => {
    if (isInitialized && onInitializationComplete) {
      onInitializationComplete();
    }
  }, [isInitialized, onInitializationComplete]);

  // Handle initialization errors
  React.useEffect(() => {
    if (initError && onInitializationError) {
      onInitializationError(initError);
    }
  }, [initError, onInitializationError]);

  // Handle retry
  const handleRetry = () => {
    window.location.reload();
  };

  // Show error screen if initialization failed
  if (initError) {
    return (
      <InitializationError
        error={initError}
        onRetry={handleRetry}
      />
    );
  }

  // Show loading screen while initializing
  if (isInitializing || !isInitialized) {
    return (
      <LoadingScreen
        initProgress={initProgress}
        browserInfo={browserInfo}
        networkInfo={networkInfo}
        performanceMetrics={performanceMetrics}
      />
    );
  }

  // Render children when initialization is complete
  return (
    <>
      {children}
      
      {/* Accessibility announcements */}
      <div className="sr-only" aria-live="polite">
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
    </>
  );
}; 