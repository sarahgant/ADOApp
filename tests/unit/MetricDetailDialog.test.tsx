import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricDetailDialog } from '../../src/components/ui/MetricDetailDialog';
import { WorkItem } from '../../src/services/adoService';

// Mock work items for testing
const mockWorkItems: WorkItem[] = [
  {
    'ID': 1,
    'Work Item Type': 'User Story',
    'Title': 'Test Story 1',
    'State': 'Done',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-01',
    'Changed Date': '2024-01-15',
    'Iteration Path': 'Sprint 1',
    'Area Path': 'Team A',
    'Story Points': 5,
    'Priority': 'High',
    'Board Column': 'Done',
    'Severity': '',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-01-15',
    'Closed Date': '2024-01-15',
    'Activated Date': '2024-01-01',
    'State Change Date': '2024-01-15',
    'Original Estimate': 8,
    'Remaining Work': 0,
    'Completed Work': 8,
    'Business Value': 100,
    'Time Criticality': 'Medium'
  },
  {
    'ID': 2,
    'Work Item Type': 'Bug',
    'Title': 'Test Bug 1',
    'State': 'Active',
    'Assigned To': 'Jane Smith',
    'Created Date': '2024-01-05',
    'Changed Date': '2024-01-10',
    'Iteration Path': 'Sprint 1',
    'Area Path': 'Team B',
    'Story Points': 3,
    'Priority': 'Medium',
    'Board Column': 'In Progress',
    'Severity': 'High',
    'Value Area': 'Business',
    'Risk': 'Medium',
    'Resolved Date': '',
    'Closed Date': '',
    'Activated Date': '2024-01-05',
    'State Change Date': '2024-01-10',
    'Original Estimate': 4,
    'Remaining Work': 2,
    'Completed Work': 2,
    'Business Value': 50,
    'Time Criticality': 'High'
  },
  {
    'ID': 3,
    'Work Item Type': 'Task',
    'Title': 'Test Task 1',
    'State': 'Closed',
    'Assigned To': 'John Doe',
    'Created Date': '2024-01-03',
    'Changed Date': '2024-01-12',
    'Iteration Path': 'Sprint 1',
    'Area Path': 'Team A',
    'Story Points': 2,
    'Priority': 'Low',
    'Board Column': 'Done',
    'Severity': '',
    'Value Area': 'Business',
    'Risk': 'Low',
    'Resolved Date': '2024-01-12',
    'Closed Date': '2024-01-12',
    'Activated Date': '2024-01-03',
    'State Change Date': '2024-01-12',
    'Original Estimate': 3,
    'Remaining Work': 0,
    'Completed Work': 3,
    'Business Value': 25,
    'Time Criticality': 'Low'
  }
];

describe('MetricDetailDialog Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <MetricDetailDialog
        isOpen={false}
        onClose={mockOnClose}
        metricType="totalItems"
        workItems={mockWorkItems}
        title="Total Work Items"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render total items breakdown correctly', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="totalItems"
        workItems={mockWorkItems}
        title="Total Work Items"
      />
    );

    expect(screen.getByText('Total Work Items')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Hero number
    expect(screen.getByText('Total Work Items')).toBeInTheDocument(); // Hero label
    
    // Should show breakdown by type
    expect(screen.getByText('Work Item Distribution')).toBeInTheDocument();
    expect(screen.getByText('User Story')).toBeInTheDocument();
    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Task')).toBeInTheDocument();
  });

  it('should render completed items breakdown correctly', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="completedItems"
        workItems={mockWorkItems}
        title="Completed Items"
      />
    );

    expect(screen.getByText('Completed Items')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Hero number
    expect(screen.getByText('Completed Items')).toBeInTheDocument(); // Hero label
    
    // Should show completed breakdown
    expect(screen.getByText('Completed by Type')).toBeInTheDocument();
    expect(screen.getByText('Top Contributors')).toBeInTheDocument();
  });

  it('should render active items breakdown correctly', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="activeItems"
        workItems={mockWorkItems}
        title="Active Items"
      />
    );

    expect(screen.getByText('Active Items')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Hero number
    expect(screen.getByText('In Progress Items')).toBeInTheDocument(); // Hero label
    
    // Should show active breakdown
    expect(screen.getByText('Current Assignees')).toBeInTheDocument();
    expect(screen.getByText('Priority Breakdown')).toBeInTheDocument();
  });

  it('should show story points information for story points dialog', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="storyPoints"
        workItems={mockWorkItems}
        title="Story Points"
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument(); // Hero number
    expect(screen.getByText('Total Story Points')).toBeInTheDocument(); // Hero label
    expect(screen.getByText('Story Points by Type')).toBeInTheDocument();
    expect(screen.getByText('Story Point Distribution')).toBeInTheDocument();
  });

  it('should handle empty work items array', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="totalItems"
        workItems={[]}
        title="Total Work Items"
      />
    );

    expect(screen.getByText('Total Work Items')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // Hero number
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="totalItems"
        workItems={mockWorkItems}
        title="Total Work Items"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should filter work items correctly for blocked items', () => {
    const blockedWorkItems: WorkItem[] = [
      {
        ...mockWorkItems[0],
        'State': 'Blocked',
        'Tags': 'blocked,urgent'
      },
      ...mockWorkItems
    ];

    render(
      <MetricDetailDialog
        isOpen={true}
        onClose={mockOnClose}
        metricType="blockedItems"
        workItems={blockedWorkItems}
        title="Blocked Items"
      />
    );

    expect(screen.getByText('Blocked Items')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); // Hero number
    expect(screen.getByText('Priority Analysis')).toBeInTheDocument();
  });
}); 