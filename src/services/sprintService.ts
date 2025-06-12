interface SprintSettings {
  sprintLengthInWeeks: number;
  firstSprintStartDate: string;
}

export const sprintService = {
  calculateSprintMetrics: (settings: SprintSettings, today: Date) => {
    const { sprintLengthInWeeks, firstSprintStartDate } = settings;
    const startDate = new Date(firstSprintStartDate);
    
    if (isNaN(startDate.getTime())) {
      return { currentSprintNumber: 0, daysRemaining: 0, sprintStartDate: null, sprintEndDate: null };
    }

    const todayAtMidnight = new Date(today);
    todayAtMidnight.setHours(0, 0, 0, 0);

    const millisecondsInAWeek = 7 * 24 * 60 * 60 * 1000;
    const sprintLengthInMs = sprintLengthInWeeks * millisecondsInAWeek;

    const diffInMs = todayAtMidnight.getTime() - startDate.getTime();

    if (diffInMs < 0) {
      return { currentSprintNumber: 0, daysRemaining: 0, sprintStartDate: null, sprintEndDate: null };
    }

    const currentSprintNumber = Math.floor(diffInMs / sprintLengthInMs) + 1;

    const sprintStartDateMs = startDate.getTime() + (currentSprintNumber - 1) * sprintLengthInMs;
    const sprintEndDateMs = sprintStartDateMs + sprintLengthInMs;
    
    const daysRemaining = Math.ceil((sprintEndDateMs - todayAtMidnight.getTime()) / (1000 * 60 * 60 * 24));

    return {
      currentSprintNumber: currentSprintNumber,
      daysRemaining: daysRemaining,
      sprintStartDate: new Date(sprintStartDateMs),
      sprintEndDate: new Date(sprintEndDateMs - 1),
    };
  },
}; 