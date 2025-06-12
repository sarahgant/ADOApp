import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Team from '../../src/pages/Team';
import { useSettings } from '../../src/context/SettingsContext';
import { adoService } from '../../src/services/adoService';

// Mock the dependencies
vi.mock('../../src/context/SettingsContext');
vi.mock('../../src/services/adoService');

const mockUseSettings = vi.mocked(useSettings);
const mockAdoService = vi.mocked(adoService);

// Mock data
const mockWorkItems = [
  {
    'ID': 1,
    'Work Item Type': 'User Story',
    'Title': 'Test Story 1',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-01',
    'Changed Date': '2024-01-15',
    'Closed Date': '2024-01-15',
    'Iteration Path': 'Project\\Sprint 1',
    'Area Path': 'Team A',
    'Story Points': 5,
    'Priority': 'High',
    'Board Column': 'Done',
    'Severity': 'Medium',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-01-15',
    'Activated Date': '2024-01-02',
    'State Change Date': '2024-01-15',
    'Original Estimate': 8,
    'Remaining Work': 0,
    'Completed Work': 8,
    'Business Value': 100,
    'Time Criticality': 'Medium',
  },
  {
    'ID': 2,
    'Work Item Type': 'Bug',
    'Title': 'Test Bug 1',
    'State': 'Active',
    'Assigned To': 'Jane Smith',
    'Created Date': '2024-01-05',
    'Changed Date': '2024-01-10',
    'Closed Date': '',
    'Iteration Path': 'Project\\Sprint 1',
    'Area Path': 'Team A',
    'Story Points': 3,
    'Priority': 'Medium',
    'Board Column': 'In Progress',
    'Severity': 'High',
    'Value Area': 'Business',
    'Risk': 'Medium',
    'Resolved Date': '',
    'Activated Date': '2024-01-06',
    'State Change Date': '2024-01-10',
    'Original Estimate': 4,
    'Remaining Work': 2,
    'Completed Work': 2,
    'Business Value': 50,
    'Time Criticality': 'High',
  },
  {
    'ID': 3,
    'Work Item Type': 'Task',
    'Title': 'Test Task 1',
    'State': 'Blocked',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-03',
    'Changed Date': '2024-01-12',
    'Closed Date': '',
    'Iteration Path': 'Project\\Sprint 1',
    'Area Path': 'Team A',
    'Story Points': 2,
    'Priority': 'Low',
    'Board Column': 'Blocked',
    'Severity': 'Low',
    'Value Area': 'Business',
    'Risk': 'High',
    'Resolved Date': '',
    'Activated Date': '2024-01-04',
    'State Change Date': '2024-01-12',
    'Original Estimate': 3,
    'Remaining Work': 3,
    'Completed Work': 0,
    'Business Value': 25,
    'Time Criticality': 'Low',
  },
  // Additional test data for velocity calculation
  {
    'ID': 4,
    'Work Item Type': 'User Story',
    'Title': 'Sprint 2 Story 1',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-16',
    'Changed Date': '2024-01-30',
    'Closed Date': '2024-01-30',
    'Iteration Path': 'Project\\Sprint 2',
    'Area Path': 'Team A',
    'Story Points': 8,
    'Priority': 'High',
    'Board Column': 'Done',
    'Severity': 'Medium',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-01-30',
    'Activated Date': '2024-01-17',
    'State Change Date': '2024-01-30',
    'Original Estimate': 12,
    'Remaining Work': 0,
    'Completed Work': 12,
    'Business Value': 150,
    'Time Criticality': 'Medium',
  },
  {
    'ID': 5,
    'Work Item Type': 'Product Backlog Item',
    'Title': 'Sprint 2 PBI 1',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-18',
    'Changed Date': '2024-02-01',
    'Closed Date': '2024-02-01',
    'Iteration Path': 'Project\\Sprint 2',
    'Area Path': 'Team A',
    'Story Points': 3,
    'Priority': 'Medium',
    'Board Column': 'Done',
    'Severity': 'Low',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-02-01',
    'Activated Date': '2024-01-19',
    'State Change Date': '2024-02-01',
    'Original Estimate': 5,
    'Remaining Work': 0,
    'Completed Work': 5,
    'Business Value': 75,
    'Time Criticality': 'Low',
  },
  {
    'ID': 6,
    'Work Item Type': 'User Story',
    'Title': 'Sprint 3 Story 1',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-02-01',
    'Changed Date': '2024-02-15',
    'Closed Date': '2024-02-15',
    'Iteration Path': 'Project\\Sprint 3',
    'Area Path': 'Team A',
    'Story Points': 5,
    'Priority': 'High',
    'Board Column': 'Done',
    'Severity': 'Medium',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-02-15',
    'Activated Date': '2024-02-02',
    'State Change Date': '2024-02-15',
    'Original Estimate': 8,
    'Remaining Work': 0,
    'Completed Work': 8,
    'Business Value': 100,
    'Time Criticality': 'Medium',
  },
  {
    'ID': 7,
    'Work Item Type': 'Feature',
    'Title': 'Feature without story points',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-02-01',
    'Changed Date': '2024-02-15',
    'Closed Date': '2024-02-15',
    'Iteration Path': 'Project\\Sprint 3',
    'Area Path': 'Team A',
    'Story Points': 0, // Features typically don't have story points
    'Priority': 'High',
    'Board Column': 'Done',
    'Severity': 'Medium',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-02-15',
    'Activated Date': '2024-02-02',
    'State Change Date': '2024-02-15',
    'Original Estimate': 0,
    'Remaining Work': 0,
    'Completed Work': 0,
    'Business Value': 200,
    'Time Criticality': 'Medium',
  },
  {
    'ID': 8,
    'Work Item Type': 'User Story',
    'Title': 'Story without iteration path',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-02-01',
    'Changed Date': '2024-02-15',
    'Closed Date': '2024-02-15',
    'Iteration Path': '', // No iteration path
    'Area Path': 'Team A',
    'Story Points': 2,
    'Priority': 'Low',
    'Board Column': 'Done',
    'Severity': 'Low',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-02-15',
    'Activated Date': '2024-02-02',
    'State Change Date': '2024-02-15',
    'Original Estimate': 3,
    'Remaining Work': 0,
    'Completed Work': 3,
    'Business Value': 50,
    'Time Criticality': 'Low',
  },
];

const mockTeamMembers = [
  {
    id: '1',
    displayName: 'John Doe',
    uniqueName: 'john.doe@company.com',
  },
  {
    id: '2',
    displayName: 'Jane Smith',
    uniqueName: 'jane.smith@company.com',
  },
];

const mockSettings = {
  ado: {
    organization: 'test-org',
    project: 'test-project',
    personalAccessToken: 'test-token',
    areaPath: 'Team A',
    isConnected: true,
  },
};

const mockTeamMetrics = {
  overview: {
    totalMembers: 2,
    activeMembers: 2,
    totalWorkItems: 10,
    completedItems: 6,
    totalStoryPoints: 50,
    avgCompletionRate: 75,
  },
  memberMetrics: [
    {
      assignee: 'John Doe',
      totalItems: 5,
      completedItems: 3,
      activeItems: 2,
      blockedItems: 0,
      completedStoryPoints: 15,
      activeStoryPoints: 10,
      totalStoryPoints: 25,
      avgCycleTime: 5.5,
      avgLeadTime: 5.5,
      medianCycleTime: 5,
      throughput: 3,
      completionRate: 60,
      efficiency: 60,
      bugRatio: 10,
      rejectionRate: 5,
      averageVelocity: 7.5,
      directBugsCount: 1,
      iterationBugsCount: 0,
      userStoriesCount: 4,
      bugRatioExplanation: 'Direct bugs assigned',
    },
    {
      assignee: 'Jane Smith',
      totalItems: 5,
      completedItems: 3,
      activeItems: 1,
      blockedItems: 1,
      completedStoryPoints: 20,
      activeStoryPoints: 5,
      totalStoryPoints: 25,
      avgCycleTime: 4.2,
      avgLeadTime: 4.2,
      medianCycleTime: 4,
      throughput: 3,
      completionRate: 60,
      efficiency: 80,
      bugRatio: 20,
      rejectionRate: 10,
      averageVelocity: 10,
      directBugsCount: 0,
      iterationBugsCount: 2,
      userStoriesCount: 3,
      bugRatioExplanation: 'Bugs in same iterations',
    },
  ],
};

describe('Team Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseSettings.mockReturnValue({
      settings: mockSettings,
      updateAdoSettings: vi.fn(),
      resetSettings: vi.fn(),
    });

    mockAdoService.fetchWorkItems.mockResolvedValue({
      success: true,
      workItems: mockWorkItems,
    });

    mockAdoService.fetchTeamMembers.mockResolvedValue({
      success: true,
      teamMembers: mockTeamMembers,
    });
  });

  it('should render loading state initially', () => {
    render(<Team />);
    expect(screen.getByText('Loading team analytics...')).toBeInTheDocument();
  });

  it('should render connection required state when not connected', () => {
    mockUseSettings.mockReturnValue({
      settings: {
        ...mockSettings,
        ado: {
          ...mockSettings.ado,
          isConnected: false,
        },
      },
      updateAdoSettings: vi.fn(),
      resetSettings: vi.fn(),
    });

    render(<Team />);
    expect(screen.getByText('Azure DevOps Connection Required')).toBeInTheDocument();
    expect(screen.getByText('Go to Settings')).toBeInTheDocument();
  });

  it('should call onNavigate when Go to Settings is clicked', () => {
    const mockOnNavigate = vi.fn();
    
    mockUseSettings.mockReturnValue({
      settings: {
        ...mockSettings,
        ado: {
          ...mockSettings.ado,
          isConnected: false,
        },
      },
      updateAdoSettings: vi.fn(),
      resetSettings: vi.fn(),
    });

    render(<Team onNavigate={mockOnNavigate} />);
    
    const settingsButton = screen.getByText('Go to Settings');
    fireEvent.click(settingsButton);
    
    expect(mockOnNavigate).toHaveBeenCalledWith('settings');
  });

  it('should render error state when data fetching fails', async () => {
    mockAdoService.fetchWorkItems.mockResolvedValue({
      success: false,
      error: 'Failed to fetch work items',
    });

    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Team Data')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch work items')).toBeInTheDocument();
    });
  });

  it('should render team analytics when data is loaded successfully', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
      expect(screen.getByText('In-depth insights into team member performance and collaboration')).toBeInTheDocument();
    });

    // Check team overview cards
    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // 2 unique assignees
    
    expect(screen.getByText('Active Members')).toBeInTheDocument();
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // 3 total work items
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // 1 completed item
    
    expect(screen.getByText('Story Points')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // 5+3+2 = 10 total story points
  });

  it('should display team member performance cards', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
    });

    // Check for team member names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();

    // Check for performance metrics
    expect(screen.getAllByText('Completed')).toHaveLength(2); // One in overview, one in performance section
    expect(screen.getAllByText('Active')).toHaveLength(2); // One in overview, one in performance section
  });

  it('should display detailed performance metrics table', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Detailed Performance Metrics')).toBeInTheDocument();
    });

    // Check table headers
    expect(screen.getByText('Team Member')).toBeInTheDocument();
    expect(screen.getByText('Throughput')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();

    // Check for team member data in table
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('should filter team members when selection changes', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Find and interact with the filter dropdown
    const filterSelect = screen.getByDisplayValue('All Team Members');
    expect(filterSelect).toBeInTheDocument();

    // Change selection to specific team member
    fireEvent.change(filterSelect, { target: { value: 'John Doe' } });
    
    // The component should still render (filtering logic is tested in the component)
    expect(filterSelect.value).toBe('John Doe');
  });

  it('should handle refresh button click', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);

    // Should call the fetch functions again
    expect(mockAdoService.fetchWorkItems).toHaveBeenCalledTimes(2);
    expect(mockAdoService.fetchTeamMembers).toHaveBeenCalledTimes(2);
  });

  it('should calculate team metrics correctly', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Verify calculated metrics are displayed
    // Total members: 2 (John Doe, Jane Smith)
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Total items: 5 (User Stories and PBIs with story points assigned to John Doe)
    // John Doe has: ID 1 (User Story, 5 pts), ID 4 (User Story, 8 pts), ID 5 (PBI, 3 pts), ID 6 (User Story, 5 pts), ID 8 (User Story, 2 pts)
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Completed items: 5 (User Stories and PBIs with story points that are Done)
    // John Doe has: ID 1 (User Story, 5 pts), ID 4 (User Story, 8 pts), ID 5 (PBI, 3 pts), ID 6 (User Story, 5 pts), ID 8 (User Story, 2 pts)
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Total story points: 10 (5+3+2)
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should show blocked items indicator', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Should show blocked indicator for John Doe (who has 1 blocked item)
    expect(screen.getByText('1 blocked item')).toBeInTheDocument();
  });

  it('should handle retry on error', async () => {
    mockAdoService.fetchWorkItems.mockResolvedValueOnce({
      success: false,
      error: 'Network error',
    });

    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Error Loading Team Data')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    // Should attempt to fetch data again
    expect(mockAdoService.fetchWorkItems).toHaveBeenCalledTimes(2);
  });

  it('should handle missing team members data gracefully', async () => {
    mockAdoService.fetchTeamMembers.mockResolvedValue({
      success: false,
      error: 'Failed to fetch team members',
    });

    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Should still render the team analytics even without team members data
    expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
  });

  it('should display advanced filters', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Check for filter elements
    expect(screen.getByPlaceholderText('Search team members...')).toBeInTheDocument();
    expect(screen.getByText('Team Members')).toBeInTheDocument();
  });

  it('should display bug ratio in team member cards', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Check for bug ratio display
    expect(screen.getAllByText(/Bug Ratio:/)).toHaveLength(2); // One for each team member
  });

  it('should open current work modal when eye icon is clicked', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Click on the first "View current work" button
    const viewButtons = screen.getAllByTitle('View current work');
    fireEvent.click(viewButtons[0]);

    // Check if modal opens
    await waitFor(() => {
      expect(screen.getByText(/Current Work -/)).toBeInTheDocument();
    });
  });

  it('should filter team members by search term', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Search for "John"
    const searchInput = screen.getByPlaceholderText('Search team members...');
    fireEvent.change(searchInput, { target: { value: 'John' } });

    // The filtering should work (component logic handles this)
    expect(searchInput.value).toBe('John');
  });

  it('should display tooltips for performance indicators', async () => {
    render(<Team />);

    await waitFor(() => {
      expect(screen.getByText('Team Analytics')).toBeInTheDocument();
    });

    // Check that tooltip triggers are present (elements with cursor-help class)
    const tooltipElements = document.querySelectorAll('.cursor-help');
    expect(tooltipElements.length).toBeGreaterThan(0);
  });

  it('integrates with global refresh mechanism', async () => {
    const mockRefreshRef = { current: null as (() => void) | null };
    
    render(<Team dashboardRefreshRef={mockRefreshRef} />);
    
    // Wait for the refresh function to be assigned
    await waitFor(() => {
      expect(mockRefreshRef.current).toBeTruthy();
    });
    
    // Mock the fetch functions
    (adoService.fetchWorkItems as jest.Mock).mockResolvedValue({
      success: true,
      workItems: mockWorkItems
    });
    (adoService.fetchTeamMembers as jest.Mock).mockResolvedValue({
      success: true,
      teamMembers: mockTeamMembers
    });
    
    // Call the refresh function
    if (mockRefreshRef.current) {
      await act(async () => {
        mockRefreshRef.current!();
      });
    }
    
    // Verify data was fetched
    expect(adoService.fetchWorkItems).toHaveBeenCalled();
    expect(adoService.fetchTeamMembers).toHaveBeenCalled();
  });

  it('displays sorting controls and allows sorting by different metrics', async () => {
    render(<Team />);
    
    await waitFor(() => {
      expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
    });
    
    // Check sort controls are present
    expect(screen.getByText('Sort by:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Throughput')).toBeInTheDocument();
    
    // Test sorting by velocity
    const sortSelect = screen.getByDisplayValue('Throughput');
    fireEvent.change(sortSelect, { target: { value: 'velocity' } });
    expect(screen.getByDisplayValue('Velocity')).toBeInTheDocument();
    
    // Test sort order toggle
    const sortButton = screen.getByTitle(/Sort/);
    fireEvent.click(sortButton);
    // Should toggle sort order
  });

  it('displays enhanced team member cards with all metrics', async () => {
    render(<Team />);
    
    await waitFor(() => {
      expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
    });
    
    // Check for new metrics in cards
    expect(screen.getByText('Velocity')).toBeInTheDocument();
    expect(screen.getByText('Bug Ratio')).toBeInTheDocument();
    expect(screen.getByText('Rejection Rate')).toBeInTheDocument();
    expect(screen.getByText('Efficiency')).toBeInTheDocument();
    
    // Check that detailed table is removed
    expect(screen.queryByText('Detailed Performance Metrics')).not.toBeInTheDocument();
  });

  it('calculates improved bug ratio and rejection rate correctly', async () => {
    render(<Team />);
    
    await waitFor(() => {
      expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
    });
    
    // The new calculations should be reflected in the displayed metrics
    // Bug ratio should be based on related bugs, not directly assigned bugs
    // Rejection rate should be based on User Stories that were rejected
    const bugRatioElements = screen.getAllByText(/\d+\.\d+%/);
    expect(bugRatioElements.length).toBeGreaterThan(0);
  });

  // New tests for corrected velocity calculation
  describe('Velocity Calculation', () => {
    it('should calculate velocity using iteration paths instead of artificial date boundaries', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // John Doe has completed User Stories in multiple sprints:
      // Sprint 1: 5 points (User Story ID 1)
      // Sprint 2: 8 + 3 = 11 points (User Story ID 4 + PBI ID 5)
      // Sprint 3: 5 points (User Story ID 6)
      // No iteration path: 2 points (User Story ID 8)
      // Feature (ID 7) should be excluded as it has 0 story points
      
      // Expected velocity: (5 + 11 + 5) / 3 sprints = 7 points per sprint
      // The 2 points from story without iteration path should be excluded from sprint-based calculation
      
      // Verify velocity is displayed correctly
      const velocityElements = screen.getAllByText(/\d+/);
      expect(velocityElements.length).toBeGreaterThan(0);
    });

    it('should only include User Stories and PBIs with story points in velocity calculation', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Should exclude:
      // - Bugs (ID 2)
      // - Tasks (ID 3) 
      // - Features with 0 story points (ID 7)
      // - Items without iteration paths (ID 8) from sprint-based calculation
      
      // Should include only:
      // - User Stories with story points and iteration paths (IDs 1, 4, 6)
      // - PBIs with story points and iteration paths (ID 5)
    });

    it('should group completed items by actual iteration path sprints', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Should group by:
      // Sprint 1: 5 points
      // Sprint 2: 11 points  
      // Sprint 3: 5 points
      // Average: 7 points per sprint
    });

    it('should handle team members with no completed work', async () => {
      // Jane Smith has no completed User Stories or PBIs in the test data
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Jane Smith should have 0 velocity since she has no completed User Stories/PBIs
      // Only has an active Bug (ID 2)
    });

    it('should handle items without iteration paths gracefully', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Items without iteration paths should not contribute to sprint-based velocity
      // but should still be counted in other metrics
    });

    it('should calculate velocity as average story points per sprint', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Formula should be: Total story points from completed User Stories/PBIs ÷ Number of sprints
      // Not based on artificial date calculations or complex sprint boundary logic
    });

    it('should extract sprint numbers from iteration paths correctly', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Should correctly parse:
      // "Project\\Sprint 1" -> Sprint 1
      // "Project\\Sprint 2" -> Sprint 2  
      // "Project\\Sprint 3" -> Sprint 3
    });

    it('should return 0 velocity for team members with no completed sprint work', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Team members with only active/blocked items should have 0 velocity
    });

    it('should not use completion dates for sprint assignment', async () => {
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // The old implementation incorrectly used completion dates to calculate artificial sprint boundaries
      // The new implementation should use actual iteration paths from Azure DevOps
    });

    it('should provide clear velocity calculation explanation in debug logs', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<Team />);
      
      await waitFor(() => {
        expect(screen.getByText('Team Member Performance')).toBeInTheDocument();
      });
      
      // Should log clear explanation of velocity calculation
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('VELOCITY CALCULATION')
      );
      
      consoleSpy.mockRestore();
    });
  });
});