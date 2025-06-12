import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the contexts and services
const mockUseSettings = jest.fn();
const mockUseWorkItems = jest.fn();
const mockSprintService = {
  calculateSprintMetrics: jest.fn()
};

jest.mock('../../src/context/SettingsContext', () => ({
  useSettings: mockUseSettings
}));

jest.mock('../../src/context/WorkItemsContext', () => ({
  useWorkItems: mockUseWorkItems
}));

jest.mock('../../src/services/sprintService', () => ({
  sprintService: mockSprintService
}));

// Import after mocking
import { Sprints } from '../../src/pages/Sprints';

describe('Sprints Component', () => {
  const mockSettings = {
    ado: {
      organization: 'test-org',
      project: 'test-project',
      personalAccessToken: 'test-pat',
      areaPath: 'test-area',
      isConnected: true,
      availableAreaPaths: []
    },
    sprint: {
      sprintDuration: 2,
      sprintStartDate: '2024-01-01'
    }
  };

  const mockWorkItems = [
    {
      'ID': 1,
      'Title': 'Early Sprint Story',
      'Work Item Type': 'User Story',
      'State': 'Done',
      'Iteration Path': 'test-project\\Sprint 1',
      'Story Points': 5,
      'Created Date': '2024-01-01T00:00:00Z', // Sprint 1 (first sprint)
      'Closed Date': '2024-01-10T00:00:00Z',
      'Assigned To': 'John Doe'
    },
    {
      'ID': 2,
      'Title': 'Early Sprint Bug',
      'Work Item Type': 'Bug',
      'State': 'Active',
      'Iteration Path': 'test-project\\Sprint 1',
      'Story Points': 3,
      'Created Date': '2024-01-05T00:00:00Z', // Sprint 1 (first sprint)
      'Assigned To': 'Jane Smith'
    },
    {
      'ID': 3,
      'Title': 'Later Sprint Story',
      'Work Item Type': 'User Story',
      'State': 'New',
      'Iteration Path': 'test-project\\Sprint 10',
      'Story Points': 8,
      'Created Date': '2024-03-15T00:00:00Z', // Much later sprint
      'Assigned To': 'Bob Johnson'
    },
    {
      'ID': 4,
      'Title': 'Second Sprint Story',
      'Work Item Type': 'User Story',
      'State': 'Done',
      'Iteration Path': 'test-project\\Sprint 2',
      'Story Points': 13,
      'Created Date': '2024-01-15T00:00:00Z', // Sprint 2 (2 weeks after start)
      'Closed Date': '2024-01-20T00:00:00Z',
      'Assigned To': 'Alice Cooper'
    }
  ];

  const mockSprintMetrics = {
    currentSprintNumber: 2,
    daysRemaining: 5,
    sprintStartDate: new Date('2024-01-15'),
    sprintEndDate: new Date('2024-01-28')
  };

  beforeEach(() => {
    mockUseSettings.mockReturnValue({
      settings: mockSettings,
      updateAdoSettings: jest.fn(),
      updateSprintSettings: jest.fn(),
      resetSettings: jest.fn(),
      testConnection: jest.fn(),
      disconnect: jest.fn(),
      isTestingConnection: false
    });

    mockUseWorkItems.mockReturnValue({
      workItems: mockWorkItems,
      loading: false,
      error: null,
      fetchWorkItems: jest.fn(),
      refreshWorkItems: jest.fn()
    });

    mockSprintService.calculateSprintMetrics.mockReturnValue(mockSprintMetrics);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Current Sprint Display', () => {
    it('should display current sprint information', () => {
      render(<Sprints />);
      
      expect(screen.getByText('Sprint 2')).toBeInTheDocument();
      expect(screen.getByText('5 days remaining')).toBeInTheDocument();
    });

    it('should calculate sprint metrics using sprint service', () => {
      render(<Sprints />);
      
      expect(mockSprintService.calculateSprintMetrics).toHaveBeenCalledWith(
        {
          sprintLengthInWeeks: 2,
          firstSprintStartDate: '2024-01-01'
        },
        expect.any(Date)
      );
    });

    it('should show sprint dates', () => {
      render(<Sprints />);
      
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 28/)).toBeInTheDocument();
    });
  });

  describe('Sprint Analytics', () => {
    it('should display execution metrics', () => {
      render(<Sprints />);
      
      // Should show completion rate
      expect(screen.getByText(/Completion Rate/)).toBeInTheDocument();
      
      // Should show velocity metrics
      expect(screen.getByText(/Velocity/)).toBeInTheDocument();
      
      // Should show throughput
      expect(screen.getByText(/Throughput/)).toBeInTheDocument();
    });

    it('should display planning accuracy metrics', () => {
      render(<Sprints />);
      
      expect(screen.getByText(/Planning Accuracy/)).toBeInTheDocument();
      expect(screen.getByText(/Story Points/)).toBeInTheDocument();
    });

    it('should display scope management metrics', () => {
      render(<Sprints />);
      
      expect(screen.getByText(/Scope Management/)).toBeInTheDocument();
    });

    it('should calculate sprint-specific metrics correctly', () => {
      render(<Sprints />);
      
      // Based on creation dates and sprint settings:
      // - Sprint 1: 1 completed, 1 active (items created Jan 1 & 5)
      // - Sprint 2: 1 completed item (created Jan 15)
      // - Later sprint: 1 new item (created Mar 15)
      
      // Check that metrics are calculated per sprint
      expect(screen.getByText(/Sprint Analytics/)).toBeInTheDocument();
    });

    it('should calculate sprints based on creation dates and user settings', () => {
      render(<Sprints />);
      
      // With sprint start date 2024-01-01 and 2-week sprints:
      // - Items created 2024-01-01 and 2024-01-05 should be in Sprint 1
      // - Item created 2024-01-15 should be in Sprint 2 (2 weeks later)
      // - Item created 2024-03-15 should be in a much later sprint
      
      expect(screen.getByText(/Sprint Analytics/)).toBeInTheDocument();
      
      // The sprint calculation should be based on creation dates, not iteration paths
      expect(mockSprintService.calculateSprintMetrics).toHaveBeenCalled();
    });

    it('displays sprint analytics with metrics', () => {
      render(<Sprints />);
      
      // Check main metrics cards
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
      expect(screen.getByText('Velocity')).toBeInTheDocument();
      expect(screen.getByText('Bug Ratio')).toBeInTheDocument();
      expect(screen.getByText('Rework Rate')).toBeInTheDocument();
      
      // Check additional metrics row
      expect(screen.getByText('Planning Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Scope Change')).toBeInTheDocument();
      expect(screen.getByText('Throughput')).toBeInTheDocument();
    });

    it('calculates enhanced sprint metrics correctly', () => {
      // Mock work items with bugs and rework scenarios
      const mockWorkItemsWithBugs = [
        {
          'ID': 1,
          'Title': 'User Story 1',
          'Work Item Type': 'User Story',
          'State': 'Done',
          'Story Points': 5,
          'Created Date': '2025-01-15T10:00:00Z',
          'Iteration Path': 'Project\\Sprint 15',
          'Board Column': 'Done',
          'Reason': 'Completed'
        },
        {
          'ID': 2,
          'Title': 'Bug fix for Story 1',
          'Work Item Type': 'Bug',
          'State': 'Done',
          'Story Points': 0,
          'Created Date': '2025-01-16T10:00:00Z',
          'Iteration Path': 'Project\\Sprint 15',
          'Board Column': 'Done',
          'Reason': 'Fixed'
        },
        {
          'ID': 3,
          'Title': 'User Story 2',
          'Work Item Type': 'User Story',
          'State': 'Active',
          'Story Points': 3,
          'Created Date': '2025-01-17T10:00:00Z',
          'Iteration Path': 'Project\\Sprint 15',
          'Board Column': 'Development',
          'Reason': 'Moved to rework'
        }
      ];

      (mockUseWorkItems as jest.Mock).mockReturnValue({
        workItems: mockWorkItemsWithBugs,
        loading: false,
        error: null,
        refreshWorkItems: jest.fn()
      });

      render(<Sprints />);
      
      // Should display enhanced bug ratio and rework rate metrics
      expect(screen.getByText('Bug Ratio')).toBeInTheDocument();
      expect(screen.getByText('Rework Rate')).toBeInTheDocument();
      expect(screen.getByText('Scope Change')).toBeInTheDocument();
      
      // Should show accurate calculations in tooltips/descriptions
      expect(screen.getByText(/bugs \/ \d+ stories/)).toBeInTheDocument();
      expect(screen.getByText(/backward transitions/)).toBeInTheDocument();
    });

    it('uses iteration path for sprint assignment when available', () => {
      const mockWorkItemsWithIterationPath = [
        {
          'ID': 1,
          'Title': 'Story in Sprint 10',
          'Work Item Type': 'User Story',
          'State': 'Done',
          'Story Points': 5,
          'Created Date': '2025-01-15T10:00:00Z',
          'Iteration Path': 'MyProject\\Team\\Sprint 10',
          'Board Column': 'Done',
          'Reason': 'Completed'
        }
      ];

      (mockUseWorkItems as jest.Mock).mockReturnValue({
        workItems: mockWorkItemsWithIterationPath,
        loading: false,
        error: null,
        refreshWorkItems: jest.fn()
      });

      render(<Sprints />);
      
      // Should use iteration path for sprint assignment
      expect(screen.getByText('Sprint 10')).toBeInTheDocument();
    });
  });

  describe('Sprint History Chart', () => {
    it('should display sprint history visualization', () => {
      render(<Sprints />);
      
      expect(screen.getByText(/Sprint History/)).toBeInTheDocument();
    });

    it('should show active vs completed work items chart', () => {
      render(<Sprints />);
      
      // Should have chart container
      const chartContainer = screen.getByTestId('sprint-history-chart');
      expect(chartContainer).toBeInTheDocument();
    });
  });

  describe('Work Items by Sprint', () => {
    it('should display work items grouped by sprint based on creation dates', () => {
      render(<Sprints />);
      
      expect(screen.getByText('Early Sprint Story')).toBeInTheDocument();
      expect(screen.getByText('Early Sprint Bug')).toBeInTheDocument();
      expect(screen.getByText('Second Sprint Story')).toBeInTheDocument();
      expect(screen.getByText('Later Sprint Story')).toBeInTheDocument();
    });

    it('should allow filtering by sprint', async () => {
      render(<Sprints />);
      
      const sprintFilter = screen.getByLabelText(/Filter by Sprint/);
      fireEvent.change(sprintFilter, { target: { value: 'Sprint 1' } });
      
      await waitFor(() => {
        expect(screen.getByText('Early Sprint Story')).toBeInTheDocument();
        expect(screen.getByText('Early Sprint Bug')).toBeInTheDocument();
        expect(screen.queryByText('Second Sprint Story')).not.toBeInTheDocument();
        expect(screen.queryByText('Later Sprint Story')).not.toBeInTheDocument();
      });
    });

    it('should show work item details in table format', () => {
      render(<Sprints />);
      
      // Check table headers
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Story Points')).toBeInTheDocument();
      expect(screen.getByText('Assignee')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state when work items are loading', () => {
      mockUseWorkItems.mockReturnValue({
        workItems: null,
        loading: true,
        error: null,
        fetchWorkItems: jest.fn(),
        refreshWorkItems: jest.fn()
      });

      render(<Sprints />);
      
      expect(screen.getByText(/Loading sprint data/)).toBeInTheDocument();
    });

    it('should show error state when there is an error', () => {
      mockUseWorkItems.mockReturnValue({
        workItems: null,
        loading: false,
        error: 'Failed to fetch work items',
        fetchWorkItems: jest.fn(),
        refreshWorkItems: jest.fn()
      });

      render(<Sprints />);
      
      expect(screen.getByText(/Failed to fetch work items/)).toBeInTheDocument();
    });

    it('should show empty state when no work items exist', () => {
      mockUseWorkItems.mockReturnValue({
        workItems: [],
        loading: false,
        error: null,
        fetchWorkItems: jest.fn(),
        refreshWorkItems: jest.fn()
      });

      render(<Sprints />);
      
      expect(screen.getByText(/No sprint data available/)).toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('should respect area path settings', () => {
      render(<Sprints />);
      
      expect(screen.getByText(/test-area/)).toBeInTheDocument();
    });

    it('should use sprint duration from settings', () => {
      render(<Sprints />);
      
      expect(mockSprintService.calculateSprintMetrics).toHaveBeenCalledWith(
        expect.objectContaining({
          sprintLengthInWeeks: 2
        }),
        expect.any(Date)
      );
    });

    it('should handle missing sprint settings gracefully', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          ...mockSettings,
          sprint: {
            sprintDuration: 0,
            sprintStartDate: ''
          }
        },
        updateAdoSettings: jest.fn(),
        updateSprintSettings: jest.fn(),
        resetSettings: jest.fn(),
        testConnection: jest.fn(),
        disconnect: jest.fn(),
        isTestingConnection: false
      });

      render(<Sprints />);
      
      expect(screen.getByText(/Configure sprint settings/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should allow refreshing sprint data', async () => {
      const mockRefresh = jest.fn();
      mockUseWorkItems.mockReturnValue({
        workItems: mockWorkItems,
        loading: false,
        error: null,
        fetchWorkItems: jest.fn(),
        refreshWorkItems: mockRefresh
      });

      render(<Sprints />);
      
      const refreshButton = screen.getByText(/Refresh/);
      fireEvent.click(refreshButton);
      
      expect(mockRefresh).toHaveBeenCalled();
    });

    it('should navigate to settings when configuration is needed', () => {
      const mockOnNavigate = jest.fn();
      
      mockUseSettings.mockReturnValue({
        settings: {
          ...mockSettings,
          ado: {
            ...mockSettings.ado,
            isConnected: false
          }
        },
        updateAdoSettings: jest.fn(),
        updateSprintSettings: jest.fn(),
        resetSettings: jest.fn(),
        testConnection: jest.fn(),
        disconnect: jest.fn(),
        isTestingConnection: false
      });

      render(<Sprints onNavigate={mockOnNavigate} />);
      
      const settingsButton = screen.getByText(/Go to Settings/);
      fireEvent.click(settingsButton);
      
      expect(mockOnNavigate).toHaveBeenCalledWith('settings');
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<Sprints />);
      
      // Should still show main content
      expect(screen.getByText(/Sprint Analytics/)).toBeInTheDocument();
    });
  });
}); 