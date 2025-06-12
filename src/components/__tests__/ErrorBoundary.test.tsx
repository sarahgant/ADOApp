import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '../ErrorBoundary';

// Mock console methods to test error logging
const originalConsoleError = console.error;
const mockConsoleError = jest.fn();

// Test component that throws errors on demand
interface ThrowErrorProps {
  shouldThrow?: boolean;
  errorType?: 'TypeError' | 'ReferenceError' | 'Custom';
  errorMessage?: string;
}

const ThrowError: React.FC<ThrowErrorProps> = ({ 
  shouldThrow = false, 
  errorType = 'TypeError',
  errorMessage = 'Test error'
}) => {
  if (shouldThrow) {
    switch (errorType) {
      case 'TypeError':
        throw new TypeError(errorMessage);
      case 'ReferenceError':
        throw new ReferenceError(errorMessage);
      case 'Custom':
        throw new Error(errorMessage);
      default:
        throw new Error(errorMessage);
    }
  }
  return <div data-testid="child-component">Child rendered successfully</div>;
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    console.error = mockConsoleError;
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // Happy Path Scenarios
  describe('Happy Path', () => {
    it('should render children normally when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-component')).toBeInTheDocument();
      expect(screen.getByText('Child rendered successfully')).toBeInTheDocument();
    });

    it('should render multiple children without errors', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByTestId('child-component')).toBeInTheDocument();
    });

    it('should maintain normal React lifecycle when no errors occur', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      // Re-render to test lifecycle maintenance
      rerender(
        <ErrorBoundary>
          <div data-testid="updated-child">Updated child</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('updated-child')).toBeInTheDocument();
    });
  });

  // Error Conditions
  describe('Error Handling', () => {
    it('should catch and display TypeError errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="TypeError" errorMessage="Type error occurred" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('We apologize for the inconvenience. Please try refreshing the page.')).toBeInTheDocument();
    });

    it('should catch and display ReferenceError errors', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="ReferenceError" errorMessage="Reference error occurred" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should catch and display custom Error objects', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorType="Custom" errorMessage="Custom error occurred" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should log errors to console when they occur', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Test logging error" />
        </ErrorBoundary>
      );

      expect(mockConsoleError).toHaveBeenCalledWith(
        'React Error Boundary caught an error:',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should prevent error propagation to parent components', () => {
      const ParentComponent = () => {
        return (
          <div data-testid="parent-component">
            <ErrorBoundary>
              <ThrowError shouldThrow={true} />
            </ErrorBoundary>
            <div data-testid="sibling-component">Sibling still renders</div>
          </div>
        );
      };

      render(<ParentComponent />);

      expect(screen.getByTestId('parent-component')).toBeInTheDocument();
      expect(screen.getByTestId('sibling-component')).toBeInTheDocument();
      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    });
  });

  // Security Considerations
  describe('Security', () => {
    it('should not expose sensitive information in error messages', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Database password: secret123" />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      // Should show generic message, not the sensitive error
      expect(screen.queryByText('Database password: secret123')).not.toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should sanitize error output for display', () => {
      const xssError = '<script>alert("xss")</script>';
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage={xssError} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
      // Should not render script tags
      expect(screen.queryByText(xssError)).not.toBeInTheDocument();
    });
  });

  // Accessibility Tests
  describe('Accessibility', () => {
    it('should have proper ARIA attributes in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const errorFallback = screen.getByTestId('error-fallback');
      expect(errorFallback).toHaveAttribute('role', 'alert');
      expect(errorFallback).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper heading structure in error state', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Something went wrong');
    });
  });
}); 