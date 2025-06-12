// Azure DevOps Analytics OData Service
// Leverages prebuilt calculations and server-side aggregations for optimal performance

export interface AnalyticsWorkItem {
  WorkItemId: number;
  Title: string;
  WorkItemType: string;
  State: string;
  AssignedToUserName?: string;
  CreatedDate: string;
  ChangedDate: string;
  ClosedDate?: string;
  ResolvedDate?: string;
  ActivatedDate?: string;
  StateChangeDate?: string;
  IterationPath: string;
  AreaPath: string;
  StoryPoints?: number;
  Priority?: number;
  
  // ADO Pre-calculated fields
  CycleTimeDays?: number;
  LeadTimeDays?: number;
  Age?: number;
  DateSK: number; // Date dimension key (YYYYMMDD)
  
  // State categories (pre-mapped)
  StateCategory: 'Proposed' | 'InProgress' | 'Resolved' | 'Completed' | 'Removed';
  
  // Additional analytics fields
  CompletedWork?: number;
  RemainingWork?: number;
  OriginalEstimate?: number;
  BusinessValue?: number;
  Risk?: string;
  Severity?: string;
  ValueArea?: string;
  BoardColumn?: string;
  Tags?: string;
}

export interface AnalyticsSnapshot {
  WorkItemId: number;
  Date: string;
  DateSK: number;
  State: string;
  StateCategory: string;
  StoryPoints?: number;
  CycleTimeDays?: number;
  LeadTimeDays?: number;
  IsLastRevisionOfDay: boolean;
}

export interface AnalyticsAggregation {
  totalItems: number;
  completedItems: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  avgCycleTime: number;
  avgLeadTime: number;
  p50CycleTime: number;
  p85CycleTime: number;
  p95CycleTime: number;
  throughputByWeek: Array<{
    weekStartDate: string;
    itemsCompleted: number;
    storyPointsCompleted: number;
  }>;
  velocityTrend: Array<{
    iterationPath: string;
    storyPointsCompleted: number;
    itemsCompleted: number;
  }>;
}

export interface AnalyticsResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
}

class AdoAnalyticsService {
  private getAnalyticsBaseUrl(organization: string): string {
    return `https://analytics.dev.azure.com/${organization}/_odata/v4.0-preview`;
  }

  private getAuthHeaders(pat: string): Record<string, string> {
    return {
      'Authorization': `Basic ${btoa(`:${pat}`)}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Fetch work items with pre-calculated analytics fields
   */
  async fetchAnalyticsWorkItems(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<AnalyticsWorkItem[]>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build OData filter
      let filter = `Project/ProjectName eq '${project}'`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        filter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      // Select pre-calculated fields from Analytics
      const select = [
        'WorkItemId',
        'Title',
        'WorkItemType',
        'State',
        'StateCategory',
        'AssignedToUserName',
        'CreatedDate',
        'ChangedDate',
        'ClosedDate',
        'ResolvedDate',
        'ActivatedDate',
        'StateChangeDate',
        'IterationPath',
        'AreaPath',
        'StoryPoints',
        'Priority',
        'CycleTimeDays',    // Pre-calculated by ADO
        'LeadTimeDays',     // Pre-calculated by ADO
        'Age',              // Pre-calculated by ADO
        'DateSK',
        'CompletedWork',
        'RemainingWork',
        'OriginalEstimate',
        'BusinessValue',
        'Risk',
        'Severity',
        'ValueArea',
        'BoardColumn',
        'Tags'
      ].join(',');

      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=ChangedDate desc`;
      
      console.log('🔧 Analytics API: Fetching work items with pre-calculated fields:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.value || [],
        count: data.value?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch historical snapshots for trend analysis
   */
  async fetchWorkItemSnapshots(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<AnalyticsSnapshot[]>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      let filter = `Project/ProjectName eq '${project}' and IsLastRevisionOfDay eq true`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        filter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      const select = [
        'WorkItemId',
        'Date',
        'DateSK',
        'State',
        'StateCategory',
        'StoryPoints',
        'CycleTimeDays',
        'LeadTimeDays',
        'IsLastRevisionOfDay'
      ].join(',');

      const url = `${baseUrl}/WorkItemSnapshot?$filter=${encodeURIComponent(filter)}&$select=${select}&$orderby=DateSK desc`;
      
      console.log('🔧 Analytics API: Fetching historical snapshots:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics snapshots failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data.value || [],
        count: data.value?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get server-side aggregated analytics
   */
  async fetchAggregatedAnalytics(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<AnalyticsAggregation>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build base filter
      let baseFilter = `Project/ProjectName eq '${project}'`;
      
      if (areaPath) {
        baseFilter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        baseFilter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      // Parallel requests for different aggregations
      const requests = [
        // Basic counts and totals
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter)}&$apply=aggregate($count as TotalItems, StoryPoints with sum as TotalStoryPoints)`, { headers }),
        
        // Completed items
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter + ` and StateCategory eq 'Completed'`)}&$apply=aggregate($count as CompletedItems, StoryPoints with sum as CompletedStoryPoints)`, { headers }),
        
        // Cycle time percentiles (server-side calculation)
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter + ` and CycleTimeDays ne null`)}&$apply=aggregate(CycleTimeDays with average as AvgCycleTime)`, { headers }),
        
        // Lead time average
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter + ` and LeadTimeDays ne null`)}&$apply=aggregate(LeadTimeDays with average as AvgLeadTime)`, { headers }),
        
        // Weekly throughput
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter + ` and StateCategory eq 'Completed'`)}&$apply=groupby((CompletedDateSK),aggregate($count as ItemsCompleted, StoryPoints with sum as StoryPointsCompleted))&$orderby=CompletedDateSK desc&$top=12`, { headers }),
        
        // Velocity by iteration
        fetch(`${baseUrl}/WorkItems?$filter=${encodeURIComponent(baseFilter + ` and StateCategory eq 'Completed'`)}&$apply=groupby((IterationPath),aggregate($count as ItemsCompleted, StoryPoints with sum as StoryPointsCompleted))&$orderby=StoryPointsCompleted desc&$top=10`, { headers })
      ];

      console.log('🔧 Analytics API: Fetching server-side aggregations...');

      const responses = await Promise.all(requests);
      
      // Check if all requests succeeded
      for (let i = 0; i < responses.length; i++) {
        if (!responses[i].ok) {
          console.warn(`Analytics aggregation request ${i} failed:`, responses[i].statusText);
        }
      }

      const [
        totalData,
        completedData,
        cycleTimeData,
        leadTimeData,
        throughputData,
        velocityData
      ] = await Promise.all(responses.map(r => r.ok ? r.json() : { value: [] }));

      // Process results
      const totals = totalData.value?.[0] || { TotalItems: 0, TotalStoryPoints: 0 };
      const completed = completedData.value?.[0] || { CompletedItems: 0, CompletedStoryPoints: 0 };
      const cycleTime = cycleTimeData.value?.[0] || { AvgCycleTime: 0 };
      const leadTime = leadTimeData.value?.[0] || { AvgLeadTime: 0 };

      // Process weekly throughput
      const throughputByWeek = (throughputData.value || []).map((item: any) => ({
        weekStartDate: this.convertDateSKToDate(item.CompletedDateSK),
        itemsCompleted: item.ItemsCompleted || 0,
        storyPointsCompleted: item.StoryPointsCompleted || 0
      }));

      // Process velocity trend
      const velocityTrend = (velocityData.value || []).map((item: any) => ({
        iterationPath: item.IterationPath || 'Unknown',
        storyPointsCompleted: item.StoryPointsCompleted || 0,
        itemsCompleted: item.ItemsCompleted || 0
      }));

      const aggregation: AnalyticsAggregation = {
        totalItems: totals.TotalItems || 0,
        completedItems: completed.CompletedItems || 0,
        totalStoryPoints: totals.TotalStoryPoints || 0,
        completedStoryPoints: completed.CompletedStoryPoints || 0,
        avgCycleTime: cycleTime.AvgCycleTime || 0,
        avgLeadTime: leadTime.AvgLeadTime || 0,
        p50CycleTime: 0, // Would need additional query for percentiles
        p85CycleTime: 0,
        p95CycleTime: 0,
        throughputByWeek,
        velocityTrend
      };

      return {
        success: true,
        data: aggregation
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get cycle time percentiles using server-side calculations
   */
  async fetchCycleTimePercentiles(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<{ p50: number; p85: number; p95: number }>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      let filter = `Project/ProjectName eq '${project}' and CycleTimeDays ne null and StateCategory eq 'Completed'`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        filter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      // Get all cycle times for percentile calculation
      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$select=CycleTimeDays&$orderby=CycleTimeDays`;
      
      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Cycle time percentiles failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      const cycleTimes = (data.value || []).map((item: any) => item.CycleTimeDays).filter((time: number) => time > 0);
      
      if (cycleTimes.length === 0) {
        return {
          success: true,
          data: { p50: 0, p85: 0, p95: 0 }
        };
      }

      // Calculate percentiles
      const getPercentile = (arr: number[], percentile: number) => {
        const index = Math.ceil((percentile / 100) * arr.length) - 1;
        return arr[Math.max(0, index)];
      };

      return {
        success: true,
        data: {
          p50: getPercentile(cycleTimes, 50),
          p85: getPercentile(cycleTimes, 85),
          p95: getPercentile(cycleTimes, 95)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Convert DateSK (YYYYMMDD) to readable date
   */
  private convertDateSKToDate(dateSK: number): string {
    const dateStr = dateSK.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }

  /**
   * Test Analytics API connection
   */
  async testAnalyticsConnection(
    organization: string,
    project: string,
    pat: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      const response = await fetch(
        `${baseUrl}/WorkItems?$filter=Project/ProjectName eq '${project}'&$top=1&$select=WorkItemId`,
        { headers }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API connection failed: ${response.status} ${response.statusText}`
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch team member metrics using server-side aggregations
   */
  async fetchTeamMemberMetrics(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<Array<{
    assignedTo: string;
    totalItems: number;
    completedItems: number;
    activeItems: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    avgCycleTime: number;
    avgLeadTime: number;
    completionRate: number;
  }>>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build OData filter
      let filter = `Project/ProjectName eq '${project}' and AssignedToUserName ne null`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        filter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      // Server-side grouping by assignee with aggregations
      const apply = `groupby((AssignedToUserName),aggregate(
        $count as TotalItems,
        StoryPoints with sum as TotalStoryPoints,
        CycleTimeDays with average as AvgCycleTime,
        LeadTimeDays with average as AvgLeadTime
      ))`;

      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$apply=${encodeURIComponent(apply)}`;
      
      console.log('Analytics API: Fetching team member metrics with server-side grouping:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Transform the grouped data
      const teamMetrics = (data.value || []).map((group: any) => ({
        assignedTo: group.AssignedToUserName || 'Unassigned',
        totalItems: group.TotalItems || 0,
        completedItems: 0, // Will need separate query for completed items
        activeItems: 0, // Will need separate query for active items
        totalStoryPoints: group.TotalStoryPoints || 0,
        completedStoryPoints: 0, // Will need separate query for completed story points
        avgCycleTime: group.AvgCycleTime || 0,
        avgLeadTime: group.AvgLeadTime || 0,
        completionRate: 0 // Will be calculated after getting completed items
      }));

      // Fetch completed items count for each team member
      for (const member of teamMetrics) {
        try {
          let completedFilter = `Project/ProjectName eq '${project}' and AssignedToUserName eq '${member.assignedTo}' and StateCategory eq 'Completed'`;
          
          if (areaPath) {
            completedFilter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
          }
          
          if (dateRange) {
            const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
            const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
            completedFilter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
          }

          const completedApply = `aggregate($count as CompletedItems, StoryPoints with sum as CompletedStoryPoints)`;
          const completedUrl = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(completedFilter)}&$apply=${encodeURIComponent(completedApply)}`;
          
          const completedResponse = await fetch(completedUrl, { headers });
          if (completedResponse.ok) {
            const completedData = await completedResponse.json();
            if (completedData.value && completedData.value.length > 0) {
              member.completedItems = completedData.value[0].CompletedItems || 0;
              member.completedStoryPoints = completedData.value[0].CompletedStoryPoints || 0;
            }
          }

          // Fetch active items count
          let activeFilter = `Project/ProjectName eq '${project}' and AssignedToUserName eq '${member.assignedTo}' and StateCategory eq 'InProgress'`;
          
          if (areaPath) {
            activeFilter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
          }
          
          if (dateRange) {
            const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
            const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
            activeFilter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
          }

          const activeApply = `aggregate($count as ActiveItems)`;
          const activeUrl = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(activeFilter)}&$apply=${encodeURIComponent(activeApply)}`;
          
          const activeResponse = await fetch(activeUrl, { headers });
          if (activeResponse.ok) {
            const activeData = await activeResponse.json();
            if (activeData.value && activeData.value.length > 0) {
              member.activeItems = activeData.value[0].ActiveItems || 0;
            }
          }

          // Calculate completion rate
          member.completionRate = member.totalItems > 0 ? (member.completedItems / member.totalItems) * 100 : 0;
        } catch (error) {
          console.warn(`Failed to fetch additional metrics for ${member.assignedTo}:`, error);
        }
      }
      
      return {
        success: true,
        data: teamMetrics,
        count: teamMetrics.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch velocity trends using server-side grouping by iteration
   */
  async fetchVelocityTrends(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<Array<{
    iterationPath: string;
    storyPointsCompleted: number;
    itemsCompleted: number;
    startDate: string;
    endDate: string;
  }>>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build OData filter for completed items
      let filter = `Project/ProjectName eq '${project}' and StateCategory eq 'Completed'`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        const startDateSK = parseInt(dateRange.startDate.replace(/-/g, ''));
        const endDateSK = parseInt(dateRange.endDate.replace(/-/g, ''));
        filter += ` and DateSK ge ${startDateSK} and DateSK le ${endDateSK}`;
      }

      // Server-side grouping by iteration with aggregations
      const apply = `groupby((IterationPath),aggregate(
        $count as ItemsCompleted,
        StoryPoints with sum as StoryPointsCompleted
      ))`;

      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$apply=${encodeURIComponent(apply)}&$orderby=IterationPath`;
      
      console.log('Analytics API: Fetching velocity trends with server-side grouping:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Transform the grouped data
      const velocityTrends = (data.value || []).map((group: any) => ({
        iterationPath: group.IterationPath || 'Unknown',
        storyPointsCompleted: group.StoryPointsCompleted || 0,
        itemsCompleted: group.ItemsCompleted || 0,
        startDate: '', // Would need additional query to get iteration dates
        endDate: ''
      }));
      
      return {
        success: true,
        data: velocityTrends,
        count: velocityTrends.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch throughput analysis using server-side date grouping
   */
  async fetchThroughputAnalysis(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsResult<Array<{
    weekStartDate: string;
    itemsCompleted: number;
    storyPointsCompleted: number;
  }>>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build OData filter for completed items
      let filter = `Project/ProjectName eq '${project}' and StateCategory eq 'Completed' and ClosedDate ne null`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }
      
      if (dateRange) {
        filter += ` and ClosedDate ge ${dateRange.startDate}Z and ClosedDate le ${dateRange.endDate}Z`;
      }

      // Server-side grouping by week using ClosedDate
      const apply = `groupby((year(ClosedDate), weekofyear(ClosedDate)),aggregate(
        $count as ItemsCompleted,
        StoryPoints with sum as StoryPointsCompleted
      ))`;

      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$apply=${encodeURIComponent(apply)}`;
      
      console.log('Analytics API: Fetching throughput analysis with server-side date grouping:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Transform the grouped data
      const throughputData = (data.value || []).map((group: any) => ({
        weekStartDate: `${group.year || new Date().getFullYear()}-W${group.weekofyear || 1}`,
        itemsCompleted: group.ItemsCompleted || 0,
        storyPointsCompleted: group.StoryPointsCompleted || 0
      }));
      
      return {
        success: true,
        data: throughputData,
        count: throughputData.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Fetch work item aging analysis using server-side calculations
   */
  async fetchAgingAnalysis(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string
  ): Promise<AnalyticsResult<Array<{
    ageRange: string;
    count: number;
    avgStoryPoints: number;
  }>>> {
    try {
      const baseUrl = this.getAnalyticsBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Build OData filter for non-completed items
      let filter = `Project/ProjectName eq '${project}' and StateCategory ne 'Completed' and Age gt 0`;
      
      if (areaPath) {
        filter += ` and startswith(AreaPath, '${project}\\${areaPath}')`;
      }

      // Server-side grouping by age ranges
      const apply = `groupby((
        case(Age le 7: '0-7 days',
             Age le 14: '8-14 days', 
             Age le 30: '15-30 days',
             Age le 60: '31-60 days',
             '60+ days')
      ),aggregate(
        $count as Count,
        StoryPoints with average as AvgStoryPoints
      ))`;

      const url = `${baseUrl}/WorkItems?$filter=${encodeURIComponent(filter)}&$apply=${encodeURIComponent(apply)}`;
      
      console.log('Analytics API: Fetching aging analysis with server-side age grouping:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        return {
          success: false,
          error: `Analytics API failed: ${response.status} ${response.statusText}`
        };
      }

      const data = await response.json();
      
      // Transform the grouped data
      const agingData = (data.value || []).map((group: any) => ({
        ageRange: group.ageRange || 'Unknown',
        count: group.Count || 0,
        avgStoryPoints: group.AvgStoryPoints || 0
      }));
      
      return {
        success: true,
        data: agingData,
        count: agingData.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const adoAnalyticsService = new AdoAnalyticsService(); 