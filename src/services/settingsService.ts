const SETTINGS_KEY = 'adoDashboardSettings';

interface SprintSettings {
  sprintLengthInWeeks: number;
  firstSprintStartDate: string;
}

export const settingsService = {
  saveSettings: (settings: SprintSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  getSettings: (): SprintSettings => {
    const settings = localStorage.getItem(SETTINGS_KEY);
    if (settings) {
      return JSON.parse(settings);
    }
    // Default settings if none are saved
    return {
      sprintLengthInWeeks: 2,
      firstSprintStartDate: '2024-01-01',
    };
  },
}; 