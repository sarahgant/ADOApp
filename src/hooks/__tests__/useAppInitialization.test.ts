import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useAppInitialization } from '../useAppInitialization';

// Mock performance API
const mockPerformance = {
  now: jest.fn(),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(),
};

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const mockConsoleError = jest.fn();
const mockConsoleWarn = jest.fn();

// Mock environment variables
const originalEnv = process.env;

// Mock navigator for browser compatibility tests
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  language: 'en-US',
  onLine: true,
};

describe('useAppInitialization', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    console.error = mockConsoleError;
    console.warn = mockConsoleWarn;
    
    // Mock performance API
    global.performance = mockPerformance as any;
    mockPerformance.now.mockReturnValue(1000);
    
    // Mock navigator
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true,
    });
    
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original methods
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // Restore environment
    process.env = originalEnv;
  });

  // Happy Path Scenarios
  describe('Happy Path', () => {
    it('should initialize successfully with valid environment', async () => {
      process.env.NODE_ENV = 'development';
      process.env.REACT_APP_VERSION = '1.0.0';
      
      const { result } = renderHook(() => useAppInitialization());

      // Initially should be initializing
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.isInitializing).toBe(true);
      expect(result.current.initError).toBeNull();

      // Wait for initialization to complete
      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.isInitializing).toBe(false);
      expect(result.current.initError).toBeNull();
      expect(result.current.initializationTime).toBeGreaterThan(0);
    });

    it('should provide initialization progress updates', async () => {
      const { result } = renderHook(() => useAppInitialization());

      expect(result.current.initProgress).toBeDefined();
      expect(result.current.initProgress.current).toBe(0);
      expect(result.current.initProgress.total).toBeGreaterThan(0);
      expect(result.current.initProgress.message).toBe('Starting initialization...');

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.initProgress.current).toBe(result.current.initProgress.total);
      expect(result.current.initProgress.message).toBe('Initialization complete');
    });

    it('should detect supported browser correctly', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.browserInfo).toBeDefined();
      expect(result.current.browserInfo.isSupported).toBe(true);
      expect(result.current.browserInfo.name).toBe('Chrome');
    });
  });

  // Browser Compatibility Tests
  describe('Browser Compatibility', () => {
    it('should detect unsupported Internet Explorer', async () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko';
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.browserInfo.isSupported).toBe(false);
      expect(result.current.browserInfo.name).toBe('Internet Explorer');
      expect(result.current.browserInfo.unsupportedReason).toContain('Internet Explorer is not supported');
    });

    it('should check for required browser features', async () => {
      // Mock missing fetch API
      delete (global as any).fetch;
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.browserInfo.isSupported).toBe(false);
      expect(result.current.browserInfo.missingFeatures).toContain('fetch');
    });
  });

  // Environment Validation Tests
  describe('Environment Validation', () => {
    it('should handle missing required environment variables', async () => {
      delete process.env.NODE_ENV;
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.environmentInfo.isValid).toBe(false);
      expect(result.current.environmentInfo.missingVariables).toContain('NODE_ENV');
    });

    it('should detect development vs production environment correctly', async () => {
      process.env.NODE_ENV = 'development';
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.environmentInfo.environment).toBe('development');
      expect(result.current.environmentInfo.isDevelopment).toBe(true);
      expect(result.current.environmentInfo.isProduction).toBe(false);
    });
  });

  // Performance Monitoring Tests
  describe('Performance Monitoring', () => {
    it('should measure initialization time', async () => {
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.initializationTime).toBeGreaterThan(0);
      expect(result.current.performanceMetrics).toBeDefined();
      expect(result.current.performanceMetrics.initTime).toBeGreaterThan(0);
    });

    it('should provide performance metrics with step timings', async () => {
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.performanceMetrics).toBeDefined();
      expect(result.current.performanceMetrics.steps).toBeDefined();
      expect(result.current.performanceMetrics.steps.browserCheck).toBeGreaterThanOrEqual(0);
      expect(result.current.performanceMetrics.steps.environmentValidation).toBeGreaterThanOrEqual(0);
      expect(result.current.performanceMetrics.steps.networkCheck).toBeGreaterThanOrEqual(0);
      expect(result.current.performanceMetrics.steps.featureDetection).toBeGreaterThanOrEqual(0);
    });
  });

  // Error Handling Tests
  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock an error during browser check
      mockNavigator.userAgent = null as any;
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.initError).toBeNull(); // Should not fail completely
      expect(result.current.browserInfo.isSupported).toBe(false);
    });

    it('should handle network connectivity issues', async () => {
      mockNavigator.onLine = false;
      
      const { result } = renderHook(() => useAppInitialization());

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.networkInfo).toBeDefined();
      expect(result.current.networkInfo.isOnline).toBe(false);
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should provide screen reader friendly progress updates', async () => {
      const { result } = renderHook(() => useAppInitialization());

      expect(result.current.initProgress.ariaLabel).toBeDefined();
      expect(result.current.initProgress.ariaLabel).toContain('Initializing application');

      await waitFor(() => {
        expect(result.current.isInitialized).toBe(true);
      });

      expect(result.current.initProgress.ariaLabel).toContain('Application ready');
    });
  });
}); 