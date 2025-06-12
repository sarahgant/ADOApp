import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId: string;
}

/**
 * Props for the ErrorFallback component
 */
interface ErrorFallbackProps {
  error?: Error;
  errorId: string;
  onRetry: () => void;
}

/**
 * Default fallback UI component displayed when an error occurs
 */
const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorId, onRetry }) => {
  return (
    <div 
      className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900"
      data-testid="error-fallback"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          We apologize for the inconvenience. Please try refreshing the page.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={onRetry}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Try again"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            aria-label="Refresh page"
          >
            Refresh Page
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
              Error Details (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
              <div className="mb-2">
                <strong>Error ID:</strong> {errorId}
              </div>
              <div className="mb-2">
                <strong>Message:</strong> {error.message}
              </div>
              <div>
                <strong>Stack:</strong>
                <pre className="whitespace-pre-wrap mt-1">{error.stack}</pre>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Generates a unique error ID for tracking purposes
 */
const generateErrorId = (): string => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Sanitizes error messages to prevent XSS and remove sensitive information
 */
const sanitizeErrorMessage = (message: string): string => {
  // Remove potential XSS content
  const sanitized = message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '[JAVASCRIPT_REMOVED]');
  
  // Remove potential sensitive information patterns
  const sensitivePatterns = [
    /password[:\s]*[^\s]+/gi,
    /token[:\s]*[^\s]+/gi,
    /key[:\s]*[^\s]+/gi,
    /secret[:\s]*[^\s]+/gi,
    /api[_-]?key[:\s]*[^\s]+/gi,
  ];
  
  let cleanMessage = sanitized;
  sensitivePatterns.forEach(pattern => {
    cleanMessage = cleanMessage.replace(pattern, '[SENSITIVE_INFO_REMOVED]');
  });
  
  return cleanMessage;
};

/**
 * React Error Boundary component that catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * Features:
 * - Catches and handles React component errors
 * - Provides user-friendly error fallback UI
 * - Logs errors for debugging (development) and monitoring (production)
 * - Prevents error propagation to parent components
 * - Includes security measures to prevent sensitive data exposure
 * - Supports accessibility with proper ARIA attributes
 * - Optimized for performance with minimal overhead
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorId: '',
    };
  }

  /**
   * Static method called when an error is thrown during rendering
   * Updates state to trigger error UI
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId(),
    };
  }

  /**
   * Called when an error is caught by the error boundary
   * Handles error logging and reporting
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { onError } = this.props;
    const { errorId } = this.state;

    // Update state with error info
    this.setState({ errorInfo });

    // Sanitize error message for logging
    const sanitizedMessage = sanitizeErrorMessage(error.message);
    const sanitizedError = new Error(sanitizedMessage);
    sanitizedError.stack = error.stack;

    // Log error for debugging/monitoring
    console.error('React Error Boundary caught an error:', sanitizedError, errorInfo);

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(sanitizedError, errorInfo);
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // In production, you might want to send error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error monitoring service
      // errorMonitoringService.captureException(sanitizedError, {
      //   errorId,
      //   componentStack: errorInfo.componentStack,
      //   extra: { timestamp: new Date().toISOString() }
      // });
      console.log(`Error ID: ${errorId} - Error logged for monitoring`);
    }
  }

  /**
   * Cleanup method called before component unmounts
   */
  componentWillUnmount(): void {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Handles retry functionality
   * Resets error state to attempt re-rendering
   */
  handleRetry = (): void => {
    // Clear any existing timeout
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    // Add small delay to prevent rapid retry loops
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        errorId: '',
      });
    }, 100);
  };

  /**
   * Renders the component
   */
  render(): ReactNode {
    const { children, fallback } = this.props;
    const { hasError, error, errorId } = this.state;

    if (hasError) {
      // Render custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Render default error fallback
      return (
        <ErrorFallback
          error={error}
          errorId={errorId}
          onRetry={this.handleRetry}
        />
      );
    }

    // Render children normally when no error
    return children;
  }
}

/**
 * Hook for using ErrorBoundary in functional components
 * Returns a function to manually trigger error boundary
 */
export const useErrorHandler = () => {
  return (error: Error, errorInfo?: string) => {
    // In a real implementation, this would integrate with the nearest ErrorBoundary
    // For now, we'll just throw the error to be caught by ErrorBoundary
    throw error;
  };
};

/**
 * Higher-order component that wraps a component with ErrorBoundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default ErrorBoundary; 