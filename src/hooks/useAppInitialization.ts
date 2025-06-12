import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Browser information interface
 */
interface BrowserInfo {
  name: string;
  version: string;
  isSupported: boolean;
  unsupportedReason?: string;
  missingFeatures: string[];
}

/**
 * Environment information interface
 */
interface EnvironmentInfo {
  environment: 'development' | 'production' | 'test';
  isValid: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  missingVariables: string[];
  invalidVariables: string[];
}

/**
 * Network information interface
 */
interface NetworkInfo {
  isOnline: boolean;
  connectionType?: string;
}

/**
 * Security information interface
 */
interface SecurityInfo {
  isSecureContext: boolean;
  protocol: string;
}

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  initTime: number;
  steps: {
    browserCheck: number;
    environmentValidation: number;
    networkCheck: number;
    featureDetection: number;
  };
}

/**
 * Initialization progress interface
 */
interface InitProgress {
  current: number;
  total: number;
  message: string;
  ariaLabel: string;
}

/**
 * Configuration options for initialization
 */
interface InitializationConfig {
  skipBrowserCheck?: boolean;
  enablePerformanceMonitoring?: boolean;
  healthCheckTimeout?: number;
  requiredFeatures?: string[];
}

/**
 * Return type for useAppInitialization hook
 */
interface UseAppInitializationReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
  initializationTime: number;
  initProgress: InitProgress;
  browserInfo: BrowserInfo;
  environmentInfo: EnvironmentInfo;
  networkInfo: NetworkInfo;
  securityInfo?: SecurityInfo;
  performanceMetrics?: PerformanceMetrics;
  announcements: string[];
}

/**
 * Detects browser information and compatibility
 */
const detectBrowser = (): BrowserInfo => {
  const userAgent = navigator?.userAgent || '';
  const missingFeatures: string[] = [];
  
  // Check for required browser features
  if (typeof fetch === 'undefined') {
    missingFeatures.push('fetch');
  }
  if (typeof Promise === 'undefined') {
    missingFeatures.push('Promise');
  }
  if (typeof Map === 'undefined') {
    missingFeatures.push('Map');
  }
  if (typeof Set === 'undefined') {
    missingFeatures.push('Set');
  }

  // Detect browser name and version
  let name = 'Unknown';
  let version = 'Unknown';
  let isSupported = true;
  let unsupportedReason = '';

  // Handle null or undefined userAgent
  if (!userAgent) {
    isSupported = false;
    unsupportedReason = 'Unable to detect browser information';
  } else if (userAgent.includes('Chrome')) {
    name = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    // Chrome 70+ required
    if (match && parseInt(match[1]) < 70) {
      isSupported = false;
      unsupportedReason = 'Chrome version is outdated. Please update to Chrome 70 or later.';
    }
  } else if (userAgent.includes('Firefox')) {
    name = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    // Firefox 65+ required
    if (match && parseInt(match[1]) < 65) {
      isSupported = false;
      unsupportedReason = 'Firefox version is outdated. Please update to Firefox 65 or later.';
    }
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    version = match ? match[1] : 'Unknown';
    // Safari 12+ required
    if (match && parseInt(match[1]) < 12) {
      isSupported = false;
      unsupportedReason = 'Safari version is outdated. Please update to Safari 12 or later.';
    }
  } else if (userAgent.includes('Edge')) {
    name = 'Edge';
    const match = userAgent.match(/Edge\/(\d+)/);
    version = match ? match[1] : 'Unknown';
  } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
    name = 'Internet Explorer';
    isSupported = false;
    unsupportedReason = 'Internet Explorer is not supported. Please use a modern browser like Chrome, Firefox, or Edge.';
  }

  // Check for missing features
  if (missingFeatures.length > 0) {
    isSupported = false;
    if (!unsupportedReason) {
      unsupportedReason = `Missing required browser features: ${missingFeatures.join(', ')}`;
    }
  }

  return {
    name,
    version,
    isSupported,
    unsupportedReason,
    missingFeatures,
  };
};

/**
 * Validates environment variables and configuration
 */
const validateEnvironment = (): EnvironmentInfo => {
  const environment = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const missingVariables: string[] = [];
  const invalidVariables: string[] = [];

  // Check required environment variables
  if (!process.env.NODE_ENV) {
    missingVariables.push('NODE_ENV');
  }

  // Validate environment variable formats
  if (process.env.REACT_APP_API_VERSION && !/^\d+\.\d+$/.test(process.env.REACT_APP_API_VERSION)) {
    invalidVariables.push('REACT_APP_API_VERSION');
  }

  // Check for potential security issues
  if (process.env.REACT_APP_API_KEY) {
    console.warn('Potential security issue: API keys should not be exposed in client-side environment variables');
  }

  const isValid = missingVariables.length === 0 && invalidVariables.length === 0;

  return {
    environment,
    isValid,
    isDevelopment: environment === 'development',
    isProduction: environment === 'production',
    missingVariables,
    invalidVariables,
  };
};

/**
 * Checks network connectivity
 */
const checkNetwork = (): NetworkInfo => {
  const isOnline = navigator?.onLine ?? true;
  
  if (!isOnline) {
    console.warn('No network connection detected. Some features may not work properly.');
  }

  return {
    isOnline,
    connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
  };
};

/**
 * Checks security context
 */
const checkSecurity = (): SecurityInfo => {
  const protocol = (typeof window !== 'undefined' && window.location?.protocol) || 'https:';
  const isSecureContext = protocol === 'https:' || protocol === 'file:' || 
                          (typeof window !== 'undefined' && window.location?.hostname === 'localhost');

  return {
    isSecureContext,
    protocol,
  };
};

/**
 * Custom hook for application initialization with health checks
 * 
 * Features:
 * - Browser compatibility detection
 * - Environment variable validation
 * - Network connectivity checks
 * - Performance monitoring
 * - Accessibility support
 * - Progressive initialization with status updates
 */
export const useAppInitialization = (config: InitializationConfig = {}): UseAppInitializationReturn => {
  const {
    skipBrowserCheck = false,
    enablePerformanceMonitoring = true,
    healthCheckTimeout = 5000,
  } = config;

  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [initializationTime, setInitializationTime] = useState(0);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    name: 'Unknown',
    version: 'Unknown',
    isSupported: true,
    missingFeatures: [],
  });
  const [environmentInfo, setEnvironmentInfo] = useState<EnvironmentInfo>({
    environment: 'development',
    isValid: true,
    isDevelopment: true,
    isProduction: false,
    missingVariables: [],
    invalidVariables: [],
  });
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: true,
  });
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | undefined>();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | undefined>();
  const [initProgress, setInitProgress] = useState<InitProgress>({
    current: 0,
    total: 4,
    message: 'Starting initialization...',
    ariaLabel: 'Initializing application, please wait...',
  });
  const [announcements, setAnnouncements] = useState<string[]>([]);

  // Refs for performance tracking
  const startTimeRef = useRef<number>(0);
  const stepTimesRef = useRef<Record<string, number>>({});

  /**
   * Updates initialization progress
   */
  const updateProgress = useCallback((current: number, message: string) => {
    setInitProgress(prev => ({
      ...prev,
      current,
      message,
      ariaLabel: current === prev.total ? 'Application ready' : `Initializing application, step ${current} of ${prev.total}: ${message}`,
    }));
  }, []);

  /**
   * Adds an announcement for screen readers
   */
  const addAnnouncement = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
  }, []);

  /**
   * Performs browser compatibility check
   */
  const performBrowserCheck = useCallback(async (): Promise<void> => {
    const stepStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    
    try {
      updateProgress(1, 'Checking browser compatibility...');
      
      if (!skipBrowserCheck) {
        const browser = detectBrowser();
        setBrowserInfo(browser);
        
        if (!browser.isSupported) {
          console.warn(`Browser compatibility issue: ${browser.unsupportedReason}`);
        }
      } else {
        // When skipping browser check, don't set browser info
        setBrowserInfo(undefined as any);
      }
      
      if (enablePerformanceMonitoring) {
        const stepEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        stepTimesRef.current.browserCheck = stepEnd - stepStart;
      }
    } catch (error) {
      console.error('Error during browser check:', error);
      setBrowserInfo(prev => ({
        ...prev,
        isSupported: false,
        unsupportedReason: 'Error during browser compatibility check',
      }));
    }
  }, [skipBrowserCheck, enablePerformanceMonitoring, updateProgress]);

  /**
   * Performs environment validation
   */
  const performEnvironmentValidation = useCallback(async (): Promise<void> => {
    const stepStart = performance?.now() || Date.now();
    
    try {
      updateProgress(2, 'Validating environment...');
      
      const env = validateEnvironment();
      setEnvironmentInfo(env);
      
      if (!env.isValid) {
        console.warn('Environment validation issues detected:', {
          missing: env.missingVariables,
          invalid: env.invalidVariables,
        });
      }
      
      if (enablePerformanceMonitoring) {
        stepTimesRef.current.environmentValidation = (performance?.now() || Date.now()) - stepStart;
      }
    } catch (error) {
      console.error('Error during environment validation:', error);
      setEnvironmentInfo(prev => ({
        ...prev,
        isValid: false,
      }));
    }
  }, [enablePerformanceMonitoring, updateProgress]);

  /**
   * Performs network connectivity check
   */
  const performNetworkCheck = useCallback(async (): Promise<void> => {
    const stepStart = performance?.now() || Date.now();
    
    try {
      updateProgress(3, 'Checking network connectivity...');
      
      const network = checkNetwork();
      setNetworkInfo(network);
      
      if (enablePerformanceMonitoring) {
        stepTimesRef.current.networkCheck = (performance?.now() || Date.now()) - stepStart;
      }
    } catch (error) {
      console.error('Error during network check:', error);
      setNetworkInfo({
        isOnline: false,
      });
    }
  }, [enablePerformanceMonitoring, updateProgress]);

  /**
   * Performs security checks
   */
  const performSecurityCheck = useCallback(async (): Promise<void> => {
    const stepStart = performance?.now() || Date.now();
    
    try {
      updateProgress(4, 'Checking security context...');
      
      const security = checkSecurity();
      setSecurityInfo(security);
      
      if (enablePerformanceMonitoring) {
        stepTimesRef.current.featureDetection = (performance?.now() || Date.now()) - stepStart;
      }
    } catch (error) {
      console.error('Error during security check:', error);
    }
  }, [enablePerformanceMonitoring, updateProgress]);

  /**
   * Main initialization function
   */
  const initialize = useCallback(async (): Promise<void> => {
    try {
      startTimeRef.current = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      setIsInitializing(true);
      setInitError(null);
      
      // Reset progress to 0
      updateProgress(0, 'Starting initialization...');

      // Small delay to ensure tests can see initial state
      await new Promise(resolve => setTimeout(resolve, 1));

      // Perform initialization steps
      await performBrowserCheck();
      await performEnvironmentValidation();
      await performNetworkCheck();
      await performSecurityCheck();

      // Calculate total initialization time
      const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const totalTime = endTime - startTimeRef.current;
      setInitializationTime(totalTime);

      // Set performance metrics
      if (enablePerformanceMonitoring) {
        setPerformanceMetrics({
          initTime: totalTime,
          steps: {
            browserCheck: stepTimesRef.current.browserCheck || 0,
            environmentValidation: stepTimesRef.current.environmentValidation || 0,
            networkCheck: stepTimesRef.current.networkCheck || 0,
            featureDetection: stepTimesRef.current.featureDetection || 0,
          },
        });

        // Warn about slow initialization
        if (totalTime > 3000) {
          console.warn(`Slow initialization detected: ${totalTime}ms`);
        }
      }

      // Update final progress
      updateProgress(4, 'Initialization complete');
      addAnnouncement('Application initialized successfully');

      // Mark as initialized
      setIsInitialized(true);
      setIsInitializing(false);

      console.log(`Application initialized successfully in ${totalTime}ms`);
    } catch (error) {
      console.error('Initialization failed:', error);
      setInitError(error instanceof Error ? error.message : 'Unknown initialization error');
      setIsInitializing(false);
    }
  }, [
    performBrowserCheck,
    performEnvironmentValidation,
    performNetworkCheck,
    performSecurityCheck,
    enablePerformanceMonitoring,
    updateProgress,
    addAnnouncement,
  ]);

  // Start initialization on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    isInitialized,
    isInitializing,
    initError,
    initializationTime,
    initProgress,
    browserInfo,
    environmentInfo,
    networkInfo,
    securityInfo,
    performanceMetrics,
    announcements,
  };
}; 