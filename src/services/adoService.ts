export interface AreaPath {
  id: number;
  name: string;
  path: string;
  hasChildren: boolean;
}

export interface AdoConnectionResult {
  success: boolean;
  error?: string;
  areaPaths?: AreaPath[];
}

export interface CurrentSprint {
  id: string;
  name: string;
  startDate: string;
  finishDate: string;
  state: string;
}

// New interfaces for analytics
export interface WorkItem {
  [key: string]: any;
  'ID': number;
  'Work Item Type': string;
  'Title': string;
  'State': string;
  'Assigned To': string;
  'Created Date': string;
  'Changed Date': string;
  'Iteration Path': string;
  'Area Path': string;
  'Story Points': number;
  'Priority': string;
  'Board Column': string;
  'Severity': string;
  'Value Area': string;
  'Risk': string;
  'Resolved Date': string;
  'Closed Date': string;
  'Activated Date': string;
  'State Change Date': string;
  'Original Estimate': number;
  'Remaining Work': number;
  'Completed Work': number;
  'Business Value': number;
  'Time Criticality': string;
}

export interface WorkItemsResult {
  success: boolean;
  error?: string;
  workItems?: WorkItem[];
}

export interface Iteration {
  id: string;
  name: string;
  path: string;
  startDate: string;
  finishDate: string;
  timeFrame: string;
}

export interface IterationsResult {
  success: boolean;
  error?: string;
  iterations?: Iteration[];
}

export interface TeamMember {
  id: string;
  displayName: string;
  uniqueName: string;
}

export interface TeamMembersResult {
  success: boolean;
  error?: string;
  teamMembers?: TeamMember[];
}

export interface AnalyticsWorkItemsResult {
  success: boolean;
  data?: any[];
  aggregations?: any;
  snapshots?: any[];
  error?: string;
}

class AdoService {
  private rateLimitDelay = 100; // 100ms delay between requests
  private maxRetries = 3;

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getBaseUrl(organization: string): string {
    return `https://dev.azure.com/${organization}`;
  }

  private getAuthHeaders(pat: string): HeadersInit {
    const encodedPat = btoa(`:${pat}`);
    return {
      'Authorization': `Basic ${encodedPat}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Test connection to Azure DevOps and fetch available area paths
   */
  async testConnection(organization: string, project: string, pat: string): Promise<AdoConnectionResult> {
    if (!organization || !project || !pat) {
      return {
        success: false,
        error: 'Organization, project, and personal access token are required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // First, test basic connectivity by getting project info
      const projectResponse = await fetch(
        `${baseUrl}/_apis/projects/${project}?api-version=7.0`,
        { headers }
      );

      if (!projectResponse.ok) {
        if (projectResponse.status === 401) {
          return {
            success: false,
            error: 'Invalid personal access token or insufficient permissions',
          };
        } else if (projectResponse.status === 404) {
          return {
            success: false,
            error: 'Project not found. Please check the organization and project names.',
          };
        } else {
          return {
            success: false,
            error: `Connection failed: ${projectResponse.statusText}`,
          };
        }
      }

      // If project access is successful, fetch area paths
      const areaPathsResponse = await fetch(
        `${baseUrl}/${project}/_apis/wit/classificationnodes/Areas?$depth=2&api-version=7.0`,
        { headers }
      );

      if (!areaPathsResponse.ok) {
        return {
          success: false,
          error: 'Connected successfully, but failed to fetch area paths',
        };
      }

      const areaPathsData = await areaPathsResponse.json();
      console.log('Area paths API response:', areaPathsData); // Debug log
      const areaPaths = this.parseAreaPaths(areaPathsData);
      console.log('Parsed area paths:', areaPaths); // Debug log

      return {
        success: true,
        areaPaths,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Parse area paths from ADO API response
   */
  private parseAreaPaths(data: any): AreaPath[] {
    const areaPaths: AreaPath[] = [];

    const parseNode = (node: any, parentPath = '') => {
      const currentPath = parentPath ? `${parentPath}\\${node.name}` : node.name;
      
      areaPaths.push({
        id: node.id,
        name: node.name,
        path: currentPath,
        hasChildren: node.hasChildren || false,
      });

      if (node.children) {
        node.children.forEach((child: any) => parseNode(child, currentPath));
      }
    };

    if (data.children) {
      data.children.forEach((child: any) => parseNode(child));
    }

    return areaPaths;
  }

  /**
   * Get current sprint for a team/area path
   */
  async getCurrentSprint(organization: string, project: string, pat: string, teamName?: string): Promise<CurrentSprint | null> {
    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);
      
      // Use default team if no team specified
      const team = teamName || project;
      
      const response = await fetch(
        `${baseUrl}/${project}/${team}/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.0`,
        { headers }
      );

      if (!response.ok) {
        console.warn('Failed to fetch current sprint:', response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (data.value && data.value.length > 0) {
        const sprint = data.value[0];
        return {
          id: sprint.id,
          name: sprint.name,
          startDate: sprint.attributes?.startDate || '',
          finishDate: sprint.attributes?.finishDate || '',
          state: sprint.attributes?.timeFrame || 'current',
        };
      }

      return null;
    } catch (error) {
      console.warn('Error fetching current sprint:', error);
      return null;
    }
  }

  /**
   * Fetch work items using WIQL query and batch API
   */
  async fetchWorkItems(organization: string, project: string, pat: string, areaPath?: string): Promise<WorkItemsResult> {
    if (!organization || !project || !pat) {
      return {
        success: false,
        error: 'Organization, project, and personal access token are required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);

      // Step 1: Query for work item IDs using WIQL with optional area path filter
      let whereClause = `[System.TeamProject] = '${project}'`;
      
      // Add area path filter if specified
      if (areaPath && areaPath.trim() !== '') {
        // Handle both exact match and "under" match for area paths
        whereClause += ` AND ([System.AreaPath] = '${project}\\${areaPath}' OR [System.AreaPath] UNDER '${project}\\${areaPath}')`;
      }

      const wiqlQuery = {
        query: `
          SELECT [System.Id] 
          FROM WorkItems 
          WHERE ${whereClause}
          ORDER BY [System.CreatedDate] DESC
        `
      };

      console.log('WIQL Query:', wiqlQuery.query); // Debug log

      const wiqlResponse = await fetch(
        `${baseUrl}/${project}/_apis/wit/wiql?api-version=7.1`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(wiqlQuery)
        }
      );

      if (!wiqlResponse.ok) {
        return {
          success: false,
          error: `WIQL query failed: ${wiqlResponse.status} ${wiqlResponse.statusText}`,
        };
      }

      const wiqlResult = await wiqlResponse.json();
      
      if (!wiqlResult.workItems || wiqlResult.workItems.length === 0) {
        return {
          success: false,
          error: areaPath ? `No work items found in area path '${areaPath}'` : 'No work items found in the project',
        };
      }

      const workItemIds = wiqlResult.workItems.map((wi: any) => wi.id);
      console.log(`Found ${workItemIds.length} work items${areaPath ? ` in area path '${areaPath}'` : ''}`);

      // Step 2: Batch fetch work item details
      const batchSize = 200;
      const allWorkItems: any[] = [];

      for (let i = 0; i < workItemIds.length; i += batchSize) {
        const batch = workItemIds.slice(i, i + batchSize);
        
        const batchRequest = {
          ids: batch,
          fields: [
            'System.Id',
            'System.Title',
            'System.WorkItemType',
            'System.State',
            'System.AssignedTo',
            'System.CreatedDate',
            'System.ChangedDate',
            'System.IterationPath',
            'System.AreaPath',
            'System.TeamProject',
            'Microsoft.VSTS.Scheduling.StoryPoints',
            'Microsoft.VSTS.Common.Priority',
            'Microsoft.VSTS.Common.Severity',
            'Microsoft.VSTS.Common.ValueArea',
            'Microsoft.VSTS.Common.Risk',
            'Microsoft.VSTS.Common.ActivatedDate',
            'Microsoft.VSTS.Common.ResolvedDate',
            'Microsoft.VSTS.Common.ClosedDate',
            'Microsoft.VSTS.Common.StateChangeDate',
            'Microsoft.VSTS.Scheduling.OriginalEstimate',
            'Microsoft.VSTS.Scheduling.RemainingWork',
            'Microsoft.VSTS.Scheduling.CompletedWork',
            'Microsoft.VSTS.Common.BusinessValue',
            'Microsoft.VSTS.Common.TimeCriticality',
            'System.Tags',
            'System.BoardColumn',
            'System.BoardColumnDone',
            'Microsoft.VSTS.Common.BacklogPriority',
            'Microsoft.VSTS.Scheduling.TargetDate',
            'System.Reason',
            'System.Description'
          ]
        };

        const batchResponse = await fetch(
          `${baseUrl}/_apis/wit/workitemsbatch?api-version=7.1`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(batchRequest)
          }
        );

        if (!batchResponse.ok) {
          return {
            success: false,
            error: `Batch request failed: ${batchResponse.status} ${batchResponse.statusText}`,
          };
        }

        const batchResult = await batchResponse.json();
        allWorkItems.push(...batchResult.value);
        
        console.log(`Fetched ${allWorkItems.length} of ${workItemIds.length} work items`);
      }

      // Step 3: Transform the data to match expected format
      const transformedData: WorkItem[] = allWorkItems.map(workItem => {
        const fields = workItem.fields || {};
        
        return {
          'ID': fields['System.Id'],
          'Work Item Type': fields['System.WorkItemType'],
          'Title': fields['System.Title'],
          'State': fields['System.State'],
          'Assigned To': fields['System.AssignedTo']?.displayName || fields['System.AssignedTo'] || 'Unassigned',
          'Created Date': fields['System.CreatedDate'],
          'Changed Date': fields['System.ChangedDate'],
          'Iteration Path': fields['System.IterationPath'],
          'Area Path': fields['System.AreaPath'],
          'Team Project': fields['System.TeamProject'],
          'Story Points': fields['Microsoft.VSTS.Scheduling.StoryPoints'] || 0,
          'Priority': fields['Microsoft.VSTS.Common.Priority'] || 'Unknown',
          'Severity': fields['Microsoft.VSTS.Common.Severity'] || 'Unknown',
          'Value Area': fields['Microsoft.VSTS.Common.ValueArea'] || 'Business',
          'Risk': fields['Microsoft.VSTS.Common.Risk'] || 'Medium',
          'Activated Date': fields['Microsoft.VSTS.Common.ActivatedDate'],
          'Resolved Date': fields['Microsoft.VSTS.Common.ResolvedDate'],
          'Closed Date': fields['Microsoft.VSTS.Common.ClosedDate'],
          'State Change Date': fields['Microsoft.VSTS.Common.StateChangeDate'],
          'Original Estimate': fields['Microsoft.VSTS.Scheduling.OriginalEstimate'] || 0,
          'Remaining Work': fields['Microsoft.VSTS.Scheduling.RemainingWork'] || 0,
          'Completed Work': fields['Microsoft.VSTS.Scheduling.CompletedWork'] || 0,
          'Business Value': fields['Microsoft.VSTS.Common.BusinessValue'] || 0,
          'Time Criticality': fields['Microsoft.VSTS.Common.TimeCriticality'] || 'Unknown',
          'Tags': fields['System.Tags'] || '',
          'Board Column': fields['System.BoardColumn'] || '',
          'Board Column Done': fields['System.BoardColumnDone'],
          'Backlog Priority': fields['Microsoft.VSTS.Common.BacklogPriority'],
          'Target Date': fields['Microsoft.VSTS.Scheduling.TargetDate'],
          'Reason': fields['System.Reason'],
          'Description': fields['System.Description']
        };
      });

      console.log(`Successfully transformed ${transformedData.length} work items`);
      
      return {
        success: true,
        workItems: transformedData,
      };
    } catch (error) {
      console.error('Error fetching work items:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch team iterations
   */
  async fetchIterations(organization: string, project: string, pat: string, teamName?: string): Promise<IterationsResult> {
    if (!organization || !project || !pat) {
      return {
        success: false,
        error: 'Organization, project, and personal access token are required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);
      const team = teamName || project;

      const response = await fetch(
        `${baseUrl}/${project}/${team}/_apis/work/teamsettings/iterations?api-version=7.0`,
        { headers }
      );

      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch iterations: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      const iterations: Iteration[] = (data.value || []).map((iteration: any) => ({
        id: iteration.id,
        name: iteration.name,
        path: iteration.path,
        startDate: iteration.attributes?.startDate || '',
        finishDate: iteration.attributes?.finishDate || '',
        timeFrame: iteration.attributes?.timeFrame || 'unknown',
      }));

      return {
        success: true,
        iterations,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch team members
   */
  async fetchTeamMembers(organization: string, project: string, pat: string, teamName?: string): Promise<TeamMembersResult> {
    if (!organization || !project || !pat) {
      return {
        success: false,
        error: 'Organization, project, and personal access token are required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);
      const team = teamName || project;

      // Fix: Use correct URL format for team members API
      const response = await fetch(
        `${baseUrl}/${project}/_apis/projects/${project}/teams/${team}/members?api-version=7.0`,
        { headers }
      );

      if (!response.ok) {
        // If the specific team doesn't exist, try with just the project as team
        if (response.status === 404 && teamName) {
          console.log(`Team '${teamName}' not found, trying with project name '${project}'`);
          const fallbackResponse = await fetch(
            `${baseUrl}/${project}/_apis/projects/${project}/teams/${project}/members?api-version=7.0`,
            { headers }
          );
          
          if (!fallbackResponse.ok) {
            return {
              success: false,
              error: `Failed to fetch team members: ${fallbackResponse.status} ${fallbackResponse.statusText}`,
            };
          }
          
          const fallbackData = await fallbackResponse.json();
          const teamMembers: TeamMember[] = (fallbackData.value || []).map((member: any) => ({
            id: member.identity.id,
            displayName: member.identity.displayName,
            uniqueName: member.identity.uniqueName,
          }));

          return {
            success: true,
            teamMembers,
          };
        }
        
        return {
          success: false,
          error: `Failed to fetch team members: ${response.status} ${response.statusText}`,
        };
      }

      const data = await response.json();
      
      const teamMembers: TeamMember[] = (data.value || []).map((member: any) => ({
        id: member.identity.id,
        displayName: member.identity.displayName,
        uniqueName: member.identity.uniqueName,
      }));

      return {
        success: true,
        teamMembers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch work item relationships (parent-child links)
   */
  async fetchWorkItemRelations(organization: string, project: string, pat: string, workItemIds: number[]): Promise<{ success: boolean; relations?: any[]; error?: string }> {
    if (!organization || !project || !pat || !workItemIds.length) {
      return {
        success: false,
        error: 'Organization, project, PAT, and work item IDs are required',
      };
    }

    try {
      const baseUrl = this.getBaseUrl(organization);
      const headers = this.getAuthHeaders(pat);
      
      console.log(`🔧 ADO API: Fetching relations for ${workItemIds.length} work items`);
      
      // Fetch work items with relations using correct batch format
      const batchSize = 200;
      const allRelations: any[] = [];

      for (let i = 0; i < workItemIds.length; i += batchSize) {
        const batch = workItemIds.slice(i, i + batchSize);
        
        // Add rate limiting delay
        if (i > 0) {
          await this.delay(this.rateLimitDelay);
        }
        
        // Fix: Use correct batch request format
        const batchRequest = {
          ids: batch,
          fields: [
            'System.Id',
            'System.Title',
            'System.WorkItemType',
            'System.AssignedTo'
          ],
          $expand: 'Relations'
        };

        console.log(`🔧 ADO API: Batch request for ${batch.length} items (batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(workItemIds.length/batchSize)}):`, batchRequest);

        const batchResponse = await fetch(
          `${baseUrl}/${project}/_apis/wit/workitemsbatch?api-version=7.1`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify(batchRequest)
          }
        );

        if (!batchResponse.ok) {
          console.error(`🔧 ADO API: Batch request failed: ${batchResponse.status} ${batchResponse.statusText}`);
          
          // Try with a simpler request format if the first fails
          if (batchResponse.status === 400) {
            console.log('🔧 ADO API: Trying simplified batch request format...');
            
            const simplifiedRequest = {
              ids: batch,
              $expand: 'Relations'
            };
            
            const retryResponse = await fetch(
              `${baseUrl}/${project}/_apis/wit/workitemsbatch?api-version=7.0`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify(simplifiedRequest)
              }
            );
            
            if (!retryResponse.ok) {
              console.error(`🔧 ADO API: Simplified batch request also failed: ${retryResponse.status} ${retryResponse.statusText}`);
              continue; // Skip this batch and continue with next
            }
            
            const retryResult = await retryResponse.json();
            console.log(`🔧 ADO API: Simplified batch result for ${batch.length} items:`, retryResult);
            
            if (retryResult.value) {
              allRelations.push(...retryResult.value);
            }
            continue;
          }
          
          // For other errors, continue with next batch
          continue;
        }

        const batchResult = await batchResponse.json();
        console.log(`🔧 ADO API: Batch result for ${batch.length} items:`, batchResult);
        
        if (batchResult.value) {
          allRelations.push(...batchResult.value);
        }
      }

      console.log(`🔧 ADO API: Total relations fetched: ${allRelations.length}`);
      
      // Debug: Show items with relations
      const itemsWithRelations = allRelations.filter(item => item.relations && item.relations.length > 0);
      console.log(`🔧 ADO API: ${itemsWithRelations.length} items have relations`);
      
      if (itemsWithRelations.length > 0) {
        console.log('🔧 ADO API: Sample item with relations:', itemsWithRelations[0]);
      }

      return {
        success: true,
        relations: allRelations,
      };
    } catch (error) {
      console.error('Error fetching work item relations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Fetch work items using Analytics API with prebuilt calculations
   */
  async fetchAnalyticsWorkItems(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<AnalyticsWorkItemsResult> {
    try {
      // Import analytics service dynamically to avoid circular dependencies
      const { adoAnalyticsService } = await import('./adoAnalyticsService');

      // Test Analytics API connection first
      const connectionTest = await adoAnalyticsService.testAnalyticsConnection(organization, project, pat);
      if (!connectionTest.success) {
        console.warn('Analytics API not available, falling back to REST API:', connectionTest.error);
        // Fallback to regular REST API
        const restResult = await this.fetchWorkItems(organization, project, pat, areaPath);
        if (restResult.success && restResult.workItems) {
          return {
            success: true,
            data: restResult.workItems,
            error: 'Using REST API fallback - Analytics features limited'
          };
        }
        return {
          success: false,
          error: restResult.error || 'Both Analytics and REST API failed'
        };
      }

      // Fetch data using Analytics API with parallel requests
      const [workItemsResult, aggregationsResult, snapshotsResult] = await Promise.all([
        adoAnalyticsService.fetchAnalyticsWorkItems(organization, project, pat, areaPath, dateRange),
        adoAnalyticsService.fetchAggregatedAnalytics(organization, project, pat, areaPath, dateRange),
        dateRange ? adoAnalyticsService.fetchWorkItemSnapshots(organization, project, pat, areaPath, dateRange) : Promise.resolve({ success: true, data: [] })
      ]);

      if (!workItemsResult.success) {
        console.warn('Analytics work items fetch failed, falling back to REST API:', workItemsResult.error);
        // Fallback to regular REST API
        const restResult = await this.fetchWorkItems(organization, project, pat, areaPath);
        if (restResult.success && restResult.workItems) {
          return {
            success: true,
            data: restResult.workItems,
            error: 'Using REST API fallback - Analytics features limited'
          };
        }
        return {
          success: false,
          error: workItemsResult.error || 'Analytics fetch failed'
        };
      }

      // Transform Analytics data to match existing WorkItem interface
      const transformedData = (workItemsResult.data || []).map(item => ({
        'ID': item.WorkItemId,
        'Work Item Type': item.WorkItemType,
        'Title': item.Title,
        'State': item.State,
        'Assigned To': item.AssignedToUserName || 'Unassigned',
        'Created Date': item.CreatedDate,
        'Changed Date': item.ChangedDate,
        'Iteration Path': item.IterationPath,
        'Area Path': item.AreaPath,
        'Story Points': item.StoryPoints || 0,
        'Priority': item.Priority?.toString() || 'Unknown',
        'Board Column': item.BoardColumn || '',
        'Severity': item.Severity || 'Unknown',
        'Value Area': item.ValueArea || 'Business',
        'Risk': item.Risk || 'Medium',
        'Resolved Date': item.ResolvedDate || '',
        'Closed Date': item.ClosedDate || '',
        'Activated Date': item.ActivatedDate || '',
        'State Change Date': item.StateChangeDate || '',
        'Original Estimate': item.OriginalEstimate || 0,
        'Remaining Work': item.RemainingWork || 0,
        'Completed Work': item.CompletedWork || 0,
        'Business Value': item.BusinessValue || 0,
        'Time Criticality': item.Risk || 'Unknown',
        'Tags': item.Tags || '',
        
        // Add Analytics-specific fields
        'CycleTimeDays': item.CycleTimeDays,
        'LeadTimeDays': item.LeadTimeDays,
        'Age': item.Age,
        'StateCategory': item.StateCategory,
        'DateSK': item.DateSK
      }));

      console.log(`🔧 Analytics API: Successfully fetched ${transformedData.length} work items with prebuilt calculations`);

      return {
        success: true,
        data: transformedData,
        aggregations: aggregationsResult.success ? aggregationsResult.data : undefined,
        snapshots: snapshotsResult.success ? snapshotsResult.data : undefined
      };
    } catch (error) {
      console.error('Analytics fetch error:', error);
      
      // Fallback to regular REST API
      console.warn('Falling back to REST API due to Analytics error');
      const restResult = await this.fetchWorkItems(organization, project, pat, areaPath);
      if (restResult.success && restResult.workItems) {
        return {
          success: true,
          data: restResult.workItems,
          error: 'Using REST API fallback - Analytics features limited'
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get enhanced analytics with prebuilt calculations
   */
  async getEnhancedAnalytics(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { adoAnalyticsService } = await import('./adoAnalyticsService');

      // Fetch aggregated analytics and cycle time percentiles in parallel
      const [aggregationsResult, percentilesResult] = await Promise.all([
        adoAnalyticsService.fetchAggregatedAnalytics(organization, project, pat, areaPath, dateRange),
        adoAnalyticsService.fetchCycleTimePercentiles(organization, project, pat, areaPath, dateRange)
      ]);

      if (!aggregationsResult.success) {
        return {
          success: false,
          error: aggregationsResult.error || 'Failed to fetch analytics aggregations'
        };
      }

      const enhancedData = {
        ...aggregationsResult.data,
        cycleTimePercentiles: percentilesResult.success ? percentilesResult.data : { p50: 0, p85: 0, p95: 0 }
      };

      return {
        success: true,
        data: enhancedData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get team member metrics using Analytics API with server-side aggregations
   */
  async getTeamMemberMetrics(
    organization: string,
    project: string,
    pat: string,
    areaPath?: string,
    dateRange?: { startDate: string; endDate: string }
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { adoAnalyticsService } = await import('./adoAnalyticsService');

      const result = await adoAnalyticsService.fetchTeamMemberMetrics(
        organization,
        project,
        pat,
        areaPath,
        dateRange
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to fetch team member metrics'
        };
      }

      return {
        success: true,
        data: result.data || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const adoService = new AdoService(); 