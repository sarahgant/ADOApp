// Analytics data types for the comprehensive Dashboard

export interface MetricsData {
  totalItems: number;
  completedItems: number;
  activeItems: number;
  blockedItems: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  activeStoryPoints: number;
  remainingStoryPoints: number;
  avgCycleTime: number;
  avgLeadTime: number;
  avgAge: number;
  completionRate: number;
  storyPointCompletionRate: number;
  cycleTimePercentiles: {
    p50: number;
    p70: number;
    p85: number;
    p95: number;
  };
  sortedIterations: string[];
  uniqueAssignees: string[];
  uniqueTypes: string[];
  monteCarloForecast?: MonteCarloForecast;
}

export interface MonteCarloForecast {
  p50: number;
  p70: number;
  p85: number;
  p95: number;
}

export interface VelocityData {
  iteration: string;
  completedPoints: number;
  totalPoints: number;
  committedPoints: number;
  activePoints: number;
  completionRate: number;
  itemCount: number;
  completedCount: number;
  activeCount: number;
  blockedCount: number;
  startDate: Date | null;
  endDate: Date | null;
  averageCycleTime: number;
}

export interface TeamMemberMetrics {
  assignee: string;
  totalItems: number;
  completedItems: number;
  activeItems: number;
  blockedItems: number;
  completedStoryPoints: number;
  activeStoryPoints: number;
  totalStoryPoints: number;
  avgCycleTime: number;
  avgLeadTime: number;
  medianCycleTime: number;
  throughput: number;
  completionRate: number;
  efficiency: number;
  bugRatio: number;
  averageVelocity: number;
  velocityTrend: 'increasing' | 'decreasing' | 'stable' | 'insufficient-data';
  // Bug ratio calculation details
  directBugsCount: number;
  iterationBugsCount: number;
  userStoriesCount: number;
  bugRatioExplanation: string;
  // Scope tracking
  assignedItems: number;
  assignedStoryPoints: number;
}

export interface TypeDistribution {
  type: string;
  total: number;
  completed: number;
  storyPoints: number;
  completedStoryPoints: number;
  avgCycleTime: number;
  blocked: number;
}

export interface WipByColumn {
  column: string;
  count: number;
  storyPoints: number;
  avgAge: number;
  blocked: number;
}

export interface CumulativeFlowData {
  date: string;
  [state: string]: string | number;
}

export interface ChartData {
  stateData: Array<{
    name: string;
    value: number;
    percentage: string;
  }>;
  teamData: TeamMemberMetrics[];
  velocityData: VelocityData[];
  cycleTimeData: Array<{
    range: string;
    count: number;
    percentage: string;
  }>;
  priorityData: Array<{
    name: string;
    total: number;
    blocked: number;
    storyPoints: number;
    avgAge: number;
  }>;
  wipData: WipByColumn[];
  typeTreemapData: {
    name: string;
    children: Array<{
      name: string;
      value: number;
      storyPoints: number;
      completed: number;
      avgCycleTime: number;
      blocked: number;
    }>;
  };
  burndownData: Array<{
    sprint: string;
    actual: number;
    ideal: number;
    completed: number;
  }>;
  forecastData: Array<{
    confidence: string;
    sprints: number;
    probability: number;
  }>;
  riskMatrix: Array<{
    risk: string;
    priority: string;
    count: number;
    storyPoints: number;
  }>;
}

export interface DashboardFilters {
  selectedIteration: string;
  selectedTeamMember: string;
  selectedWorkItemType: string;
  timeRange: number;
  confidenceLevel: number;
}

export interface DashboardState {
  data: any[] | null;
  loading: boolean;
  error: string | null;
  activeTab: string;
  filters: DashboardFilters;
} 