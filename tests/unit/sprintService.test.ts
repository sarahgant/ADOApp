import { sprintService } from '../../services/sprintService';

describe('Sprint Calculation Service', () => {
  // Test Case 1: Standard two-week sprint starting on a Monday
  it('should correctly calculate sprint info for a standard two-week sprint', () => {
    const settings = {
      length: 14,
      startDate: '2024-01-01', // Monday
      namePrefix: 'Sprint',
    };
    const today = new Date('2024-01-10'); // Wednesday of week 2
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 2,
        firstSprintStartDate: settings.startDate,
      },
      today
    );

    expect(info.currentSprintNumber).toBe(1);
    expect(info.daysRemaining).toBe(5); // 14 - (10 - 1) = 5
  });

  // Test Case 2: One-week sprint starting mid-week
  it('should handle one-week sprints starting on a Wednesday', () => {
    const settings = {
      length: 7,
      startDate: '2024-01-03', // Wednesday
      namePrefix: 'Weekly',
    };
    const today = new Date('2024-01-11'); // Thursday of week 2
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 1,
        firstSprintStartDate: settings.startDate,
      },
      today
    );

    expect(info.currentSprintNumber).toBe(2);
    expect(info.daysRemaining).toBe(6); // 7 - (11-10) = 6
  });

  // Test Case 3: Three-week sprint, checking date far in the future
  it('should correctly identify a future sprint number', () => {
    const settings = {
      length: 21,
      startDate: '2024-01-01',
      namePrefix: 'Release',
    };
    const today = new Date('2024-06-17'); // 24 weeks later
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 3,
        firstSprintStartDate: settings.startDate,
      },
      today
    );
    // 24 weeks / 3 weeks/sprint = 8 sprints passed. So we are in sprint 9.
    expect(info.currentSprintNumber).toBe(9);
  });

  // Test Case 4: Date before the first sprint
  it('should return null for dates before the first sprint', () => {
    const settings = {
      length: 14,
      startDate: '2024-02-05',
      namePrefix: 'Sprint',
    };
    const today = new Date('2024-01-20'); // Before start date
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 2,
        firstSprintStartDate: settings.startDate,
      },
      today
    );

    expect(info.currentSprintNumber).toBe(0);
  });

  // Test Case 5: Today is the last day of the sprint
  it('should show 1 day remaining on the last day of the sprint', () => {
    const settings = {
      length: 14,
      startDate: '2024-01-01',
      namePrefix: 'Sprint',
    };
    const today = new Date('2024-01-14'); // Last day
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 2,
        firstSprintStartDate: settings.startDate,
      },
      today
    );
    expect(info.daysRemaining).toBe(1);
  });

  // Test Case 6: Today is the first day of a new sprint
  it('should show full duration on the first day of a new sprint', () => {
    const settings = {
      length: 7,
      startDate: '2024-01-01',
      namePrefix: 'Sprint',
    };
    const today = new Date('2024-01-08'); // First day of sprint 2
    const info = sprintService.calculateSprintMetrics(
      {
        sprintLengthInWeeks: 1,
        firstSprintStartDate: settings.startDate,
      },
      today
    );

    expect(info.daysRemaining).toBe(7);
    expect(info.currentSprintNumber).toBe(2);
  });
}); 