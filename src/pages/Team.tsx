import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Users, TrendingUp, Clock, Target, Award, Activity, AlertCircle, CheckCircle, Settings, Bug, Eye, HelpCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { adoService, WorkItem, TeamMember } from '../services/adoService';
import { TeamMemberMetrics } from '../types/analytics';
import { TeamFilters, TeamFilterOptions } from '../components/ui/TeamFilters';
import { Tooltip } from '../components/ui/Tooltip';
import { CurrentWorkModal } from '../components/ui/CurrentWorkModal';

interface TeamProps {
  onNavigate?: (view: string) => void;
  dashboardRefreshRef?: React.RefObject<(() => void) | null>;
}

const Team: React.FC<TeamProps> = ({ onNavigate, dashboardRefreshRef }) => {
  const { settings } = useSettings();
  
  // State management
  const [workItems, setWorkItems] = useState<WorkItem[] | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<TeamFilterOptions>({
    selectedMembers: [],
    searchTerm: '',
  });

  // Modal state
  const [currentWorkModal, setCurrentWorkModal] = useState<{
    isOpen: boolean;
    memberName: string;
    currentWork: WorkItem[];
    recentWork: WorkItem[];
  }>({
    isOpen: false,
    memberName: '',
    currentWork: [],
    recentWork: [],
  });

  // Sort state
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [showCurrentWork, setShowCurrentWork] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'throughput' | 'completionRate' | 'velocity' | 'bugRatio'>('throughput');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Check if user has configured settings
  const hasValidConnection = settings.ado.organization && 
                            settings.ado.project && 
                            settings.ado.personalAccessToken && 
                            settings.ado.isConnected;

  const handleGoToSettings = () => {
    if (onNavigate) {
      onNavigate('settings');
    }
  };

  // Fetch team data from Azure DevOps
  const fetchTeamData = useCallback(async () => {
    if (!hasValidConnection) {
      setError('Please configure your Azure DevOps connection in Settings first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch work items and team members in parallel
      const [workItemsResult, teamMembersResult] = await Promise.all([
        adoService.fetchWorkItems(
          settings.ado.organization,
          settings.ado.project,
          settings.ado.personalAccessToken,
          settings.ado.areaPath
        ),
        adoService.fetchTeamMembers(
          settings.ado.organization,
          settings.ado.project,
          settings.ado.personalAccessToken
        )
      ]);

      if (workItemsResult.success && workItemsResult.workItems) {
        setWorkItems(workItemsResult.workItems);
        // Reset relations cache when new work items are loaded
        setRelationsCache(null);
        setRelationsFetchAttempted(false);
      } else {
        setError(workItemsResult.error || 'Failed to fetch work items');
        return;
      }

      if (teamMembersResult.success && teamMembersResult.teamMembers) {
        setTeamMembers(teamMembersResult.teamMembers);
      } else {
        console.warn('Failed to fetch team members:', teamMembersResult.error);
        // Continue without team members data
      }

    } catch (err) {
      console.error('Error fetching team data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [hasValidConnection, settings.ado.organization, settings.ado.project, settings.ado.personalAccessToken, settings.ado.areaPath]);

  // Auto-load data when connection is established
  useEffect(() => {
    if (hasValidConnection && !workItems && !loading) {
      fetchTeamData();
    }
  }, [hasValidConnection, workItems, loading, fetchTeamData]);

  // Expose refresh function to parent component
  useEffect(() => {
    if (dashboardRefreshRef) {
      dashboardRefreshRef.current = fetchTeamData;
    }
  }, [dashboardRefreshRef, fetchTeamData]);

  // Helper functions for data processing
  const getColumnValue = useCallback((row: any, possibleNames: string[]) => {
    if (!row || !possibleNames) return null;
    for (const name of possibleNames) {
      if (row[name] !== undefined) return row[name];
    }
    return null;
  }, []);

  const getAssignedTo = (row: WorkItem) => {
    const assignee = getColumnValue(row, ['Assigned To', 'AssignedTo', 'Assignee']) || 'Unassigned';
    // Debug: Log assignment for first few items to verify logic
    if (Math.random() < 0.01) { // Log ~1% of items to avoid spam
      console.log(`🔍 Assignment check:`, {
        id: row.ID,
        title: row.Title?.substring(0, 30) + '...',
        assignedTo: assignee,
        rawFields: {
          'Assigned To': row['Assigned To'],
          'AssignedTo': row['AssignedTo'], 
          'Assignee': row['Assignee']
        }
      });
    }
    return assignee;
  };
  const getState = (row: WorkItem) => getColumnValue(row, ['State', 'Status']);
  const getStoryPoints = (row: WorkItem) => {
    const points = getColumnValue(row, ['Story Points', 'StoryPoints', 'Points', 'Effort', 'Size']);
    return parseFloat(points) || 0;
  };
  const getCreatedDate = (row: WorkItem) => getColumnValue(row, ['Created Date', 'CreatedDate']);
  const getClosedDate = (row: WorkItem) => getColumnValue(row, ['Closed Date', 'ClosedDate', 'Resolved Date']);

  const isCompleted = (row: WorkItem) => {
    const state = getState(row);
    return ['Closed', 'Done', 'Completed', 'Resolved', 'Accepted'].includes(state);
  };

  const isActive = (row: WorkItem) => {
    const state = getState(row);
    return ['Active', 'In Progress', 'Committed', 'Open', 'In Development', 'In Review', 'Testing'].includes(state);
  };

  const isBlocked = (row: WorkItem) => {
    const tags = getColumnValue(row, ['Tags', 'Labels']) || '';
    const state = getState(row);
    return getColumnValue(row, ['Blocked']) === true || 
           tags.toLowerCase().includes('blocked') ||
           state === 'Blocked';
  };

  // Calculate cycle time in days
  const calculateCycleTime = (row: WorkItem): number => {
    const createdDate = getCreatedDate(row);
    const closedDate = getClosedDate(row);
    
    if (!createdDate || !closedDate) return 0;
    
    const created = new Date(createdDate);
    const closed = new Date(closedDate);
    const diffTime = Math.abs(closed.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Team member metrics state
  const [memberMetrics, setMemberMetrics] = useState<TeamMemberMetrics[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [relationsCache, setRelationsCache] = useState<any[] | null>(null);
  const [relationsFetchAttempted, setRelationsFetchAttempted] = useState(false);

  // Calculate team member metrics with async bug ratio calculation
  const calculateMemberMetrics = useCallback(async () => {
    if (!workItems || workItems.length === 0) {
      setMemberMetrics([]);
      return;
    }

    setMetricsLoading(true);
    
    try {
             // Get unique assignees
       const assignees = Array.from(new Set(workItems.map(getAssignedTo))).filter(a => a !== 'Unassigned');
       
       console.log('🔍 PROCESSING ASSIGNEES:', {
         totalWorkItems: workItems.length,
         uniqueAssignees: assignees,
         assigneeCount: assignees.length
       });
      
             // Fetch work item relationships once for all work items (only for User Stories to reduce API load)
       let workItemRelations: any[] = [];
       
       // Use cached relations if available, otherwise fetch once
       if (relationsCache) {
         workItemRelations = relationsCache;
         console.log(`🔍 Using cached relations data (${workItemRelations.length} items)`);
       } else if (!relationsFetchAttempted && settings?.ado?.organization && settings?.ado?.project && settings?.ado?.personalAccessToken) {
         setRelationsFetchAttempted(true);
         
         // Only fetch relations for User Stories to reduce API calls
         const userStoryIds = workItems
           .filter(item => item['Work Item Type'] === 'User Story')
           .map(item => item.ID);
         
         if (userStoryIds.length > 0) {
           console.log(`🔍 Fetching relations for ${userStoryIds.length} user stories (reduced from ${workItems.length} total work items)...`);
           
           try {
             const relationsResult = await adoService.fetchWorkItemRelations(
               settings.ado.organization,
               settings.ado.project,
               settings.ado.personalAccessToken,
               userStoryIds
             );
             
             console.log('🔍 Relations API Result:', relationsResult);
             
             if (relationsResult.success && relationsResult.relations) {
               workItemRelations = relationsResult.relations;
               setRelationsCache(workItemRelations); // Cache for future use
               console.log(`🔍 Found ${workItemRelations.length} work items with potential relations`);
               
               // Debug: Show sample relations data
               const itemsWithRelations = workItemRelations.filter(item => item.relations && item.relations.length > 0);
               console.log(`🔍 ${itemsWithRelations.length} work items have relations`);
               
               if (itemsWithRelations.length > 0) {
                 console.log('🔍 Sample work item with relations:', itemsWithRelations[0]);
               }
             } else {
               console.log('🔍 No relations data returned or API call failed - continuing with fallback bug calculation');
             }
           } catch (error) {
             console.error('🔍 Error fetching relations:', error);
             console.log('🔍 Continuing with fallback bug calculation');
           }
         } else {
           console.log('🔍 No user stories found - skipping relations API call');
         }
       } else if (relationsFetchAttempted) {
         console.log('🔍 Relations fetch already attempted, using fallback calculation');
       }
       
       // Calculate metrics for each team member
       const metrics: TeamMemberMetrics[] = assignees.map((assignee) => {
         const memberItems = workItems.filter(item => getAssignedTo(item) === assignee);
         
         // Filter to only include User Stories and PBIs with story points (velocity-contributing items)
         const velocityEligibleItems = memberItems.filter(item => {
           const workItemType = item['Work Item Type'] || '';
           const velocityTypes = ['User Story', 'Product Backlog Item'];
           const hasStoryPoints = getStoryPoints(item) > 0;
           
           return velocityTypes.includes(workItemType) && hasStoryPoints;
         });
         
         // Filter completed items from velocity-eligible items
         const completedItems = velocityEligibleItems.filter(item => {
           const isCompleted = ['Done', 'Closed', 'Completed', 'Resolved'].includes(item['State'] || '');
           return isCompleted;
         });
         
         const activeItems = memberItems.filter(isActive);
         const blockedItems = memberItems.filter(isBlocked);
         
         // Debug: Show what items we're counting for this person
         console.log(`[${assignee}] 📊 WORK ITEM BREAKDOWN:`, {
           allAssigned: memberItems.length,
           velocityEligible: velocityEligibleItems.length,
           velocityEligibleNote: 'User Stories and PBIs with story points',
           completed: completedItems.length,
           completedNote: 'Completed velocity-eligible items',
           active: activeItems.length,
           blocked: blockedItems.length,
           allWorkItemTypes: memberItems.reduce((acc, item) => {
             const type = item['Work Item Type'] || 'Unknown';
             acc[type] = (acc[type] || 0) + 1;
             return acc;
           }, {} as Record<string, number>),
           velocityEligibleTypes: velocityEligibleItems.reduce((acc, item) => {
             const type = item['Work Item Type'] || 'Unknown';
             acc[type] = (acc[type] || 0) + 1;
             return acc;
           }, {} as Record<string, number>),
           completedItemDetails: completedItems.map(item => ({
             id: item.ID,
             title: item.Title?.substring(0, 30) + '...',
             type: item['Work Item Type'],
             storyPoints: getStoryPoints(item),
             state: item['State']
           }))
         });
         
         const totalStoryPoints = velocityEligibleItems.reduce((sum, item) => sum + getStoryPoints(item), 0);
         const completedStoryPoints = completedItems.reduce((sum, item) => sum + getStoryPoints(item), 0);
         
         // Calculate cycle time for completed items
         const cycleTimeSum = completedItems.reduce((sum, item) => {
           const activated = item['Activated Date'] ? new Date(item['Activated Date']) : null;
           const resolved = item['Resolved Date'] ? new Date(item['Resolved Date']) : null;
           
           if (activated && resolved) {
             const diffTime = Math.abs(resolved.getTime() - activated.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             return sum + diffDays;
           }
           return sum;
         }, 0);

         const averageCycleTime = completedItems.length > 0 ? Math.round(cycleTimeSum / completedItems.length) : 0;



         // Calculate velocity: Total completed story points ÷ Total sprint count (17 sprints)
         const calculateSprintVelocity = (completedItems: WorkItem[]) => {
           // Filter to only include completed User Stories and PBIs with story points
           const velocityEligibleItems = completedItems.filter(item => {
             const workItemType = item['Work Item Type'] || '';
             const velocityTypes = ['User Story', 'Product Backlog Item'];
             const hasStoryPoints = getStoryPoints(item) > 0;
             const isCompleted = ['Done', 'Closed', 'Completed', 'Resolved'].includes(item['State'] || '');
             
             return velocityTypes.includes(workItemType) && hasStoryPoints && isCompleted;
           });
           
           // Calculate total story points from completed eligible items
           const totalCompletedStoryPoints = velocityEligibleItems.reduce((sum, item) => sum + getStoryPoints(item), 0);
           
           // Calculate total sprint count dynamically
           const calculateTotalSprintCount = () => {
             // Method 1: Calculate from sprint settings if available
             if (settings?.sprint?.sprintStartDate && settings?.sprint?.sprintDuration) {
               const startDate = new Date(settings.sprint.sprintStartDate);
               const currentDate = new Date();
               const sprintDurationWeeks = settings.sprint.sprintDuration;
               const sprintDurationMs = sprintDurationWeeks * 7 * 24 * 60 * 60 * 1000;
               
               const timeDiff = currentDate.getTime() - startDate.getTime();
               if (timeDiff > 0) {
                 return Math.ceil(timeDiff / sprintDurationMs);
               }
             }
             
             // Method 2: Extract unique sprint numbers from all work items' iteration paths
             const sprintNumbers = new Set<number>();
             workItems?.forEach(item => {
               const iterationPath = item['Iteration Path'];
               if (iterationPath) {
                 const pathParts = iterationPath.split('\\');
                 const lastPart = pathParts[pathParts.length - 1];
                 const sprintMatch = lastPart.match(/Sprint\s*(\d+)/i);
                 if (sprintMatch) {
                   sprintNumbers.add(parseInt(sprintMatch[1]));
                 }
               }
             });
             
             if (sprintNumbers.size > 0) {
               return Math.max(...Array.from(sprintNumbers));
             }
             
             // Method 3: Fallback - estimate based on project duration
             const oldestItem = workItems?.reduce((oldest, item) => {
               const created = item['Created Date'];
               if (!created) return oldest;
               const createdDate = new Date(created);
               return !oldest || createdDate < oldest ? createdDate : oldest;
             }, null as Date | null);
             
             if (oldestItem) {
               const projectDurationMs = new Date().getTime() - oldestItem.getTime();
               const estimatedSprints = Math.ceil(projectDurationMs / (2 * 7 * 24 * 60 * 60 * 1000)); // Assume 2-week sprints
               return Math.max(1, estimatedSprints);
             }
             
             // Final fallback
             return 1;
           };
           
           const totalSprintCount = calculateTotalSprintCount();
           
           // Calculate velocity: Total story points ÷ Total sprints
           const velocity = totalSprintCount > 0 ? totalCompletedStoryPoints / totalSprintCount : 0;
           
           // Debug logging for transparency
           console.log(`[${assignee}] 🔍 VELOCITY CALCULATION (Total Points ÷ Total Sprints):`, {
             workItemCounts: {
               totalCompleted: completedItems.length,
               velocityEligible: velocityEligibleItems.length
             },
             storyPointTotals: {
               totalCompletedStoryPoints: totalCompletedStoryPoints,
               fromAllCompleted: completedStoryPoints
             },
             sprintCountCalculation: {
               method: settings?.sprint?.sprintStartDate ? 'sprint_settings' : 
                      workItems?.some(item => item['Iteration Path']?.includes('Sprint')) ? 'iteration_paths' : 'project_duration',
               totalSprintCount: totalSprintCount,
               sprintSettings: settings?.sprint ? {
                 startDate: settings.sprint.sprintStartDate,
                 duration: settings.sprint.sprintDuration
               } : 'not_configured'
             },
             calculation: {
               velocity: velocity.toFixed(1),
               formula: `${totalCompletedStoryPoints} points ÷ ${totalSprintCount} sprints = ${velocity.toFixed(1)}`
             }
           });
           
           // Show sample eligible items for verification
           if (velocityEligibleItems.length > 0) {
             console.log(`[${assignee}] 📋 Sample eligible items:`, 
               velocityEligibleItems.slice(0, 3).map(item => ({
                 id: item.ID,
                 title: item.Title?.substring(0, 50) + '...',
                 type: item['Work Item Type'],
                 storyPoints: getStoryPoints(item),
                 state: item['State']
               }))
             );
           }
           
           return Math.round(velocity * 10) / 10; // Round to 1 decimal place
         };
         
         const averageVelocity = calculateSprintVelocity(completedItems);

         // Calculate bug ratio: bugs that are children of user stories assigned to this developer
         const userStories = memberItems.filter(item => item['Work Item Type'] === 'User Story');
         let bugRatio = 0;
         let bugRatioExplanation = 'No user stories assigned to calculate bug ratio';
         let directBugsCount = 0;
         let iterationBugsCount = 0;
         let userStoriesCount = userStories.length;

         console.log(`[${assignee}] Calculating bug ratio for ${userStoriesCount} user stories`);

         // Use the pre-fetched relationships to calculate bug ratio
         if (workItemRelations.length > 0 && userStoriesCount > 0) {
           // Step 1: Get user stories assigned to this developer
           const developerUserStories = userStories.filter(story => 
             getAssignedTo(story) === assignee
           );
           
           console.log(`[${assignee}] Found ${developerUserStories.length} user stories assigned to developer`);
           
           // Step 2: For each user story, find child bugs
           let totalBugsFromUserStories = 0;
           
           developerUserStories.forEach(userStory => {
             const userStoryRelations = workItemRelations.find(rel => rel.id === userStory.ID);
             if (userStoryRelations?.relations) {
                               const childBugs = userStoryRelations.relations.filter((relation: any) => {
                  if (relation.rel === 'System.LinkTypes.Hierarchy-Forward') {
                    const childId = parseInt(relation.url.split('/').pop());
                    const childWorkItem = workItems.find(item => item.ID === childId);
                    return childWorkItem && childWorkItem['Work Item Type'] === 'Bug';
                  }
                  return false;
                });
               
               totalBugsFromUserStories += childBugs.length;
               if (childBugs.length > 0) {
                 console.log(`[${assignee}] User Story ${userStory.ID} (${userStory.Title}) has ${childBugs.length} child bugs`);
               }
             }
           });
           
           console.log(`[${assignee}] Total bugs from user stories: ${totalBugsFromUserStories}`);
           
           // Step 3: Calculate ratio
           if (developerUserStories.length > 0) {
             bugRatio = Math.round((totalBugsFromUserStories / developerUserStories.length) * 100);
             bugRatioExplanation = `${totalBugsFromUserStories} bugs found as children of ${developerUserStories.length} user stories assigned to developer (${bugRatio}%)`;
             iterationBugsCount = totalBugsFromUserStories;
             userStoriesCount = developerUserStories.length; // Update to actual count
             console.log(`[${assignee}] ✅ FINAL BUG RATIO: ${bugRatio}% (${totalBugsFromUserStories} bugs / ${developerUserStories.length} user stories)`);
           } else {
             bugRatioExplanation = 'No user stories assigned to this developer';
             console.log(`[${assignee}] ⚠️ No user stories assigned - cannot calculate bug ratio`);
           }
         } else {
           // Fallback: count bugs directly assigned to developer
           const directBugs = memberItems.filter(item => item['Work Item Type'] === 'Bug');
           directBugsCount = directBugs.length;
           
           if (memberItems.length > 0) {
             bugRatio = Math.round((directBugsCount / memberItems.length) * 100);
             bugRatioExplanation = `Fallback: ${directBugsCount} bugs directly assigned out of ${memberItems.length} total items (${bugRatio}%)`;
           }
         }

         const completionRate = velocityEligibleItems.length > 0 ? Math.round((completedItems.length / velocityEligibleItems.length) * 100) : 0;
         const efficiency = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

         // Determine performance level
         let performanceLevel: 'high' | 'medium' | 'low' = 'medium';
         if (completionRate >= 80 && efficiency >= 80 && bugRatio <= 15) {
           performanceLevel = 'high';
         } else if (completionRate < 60 || efficiency < 60 || bugRatio > 30) {
           performanceLevel = 'low';
         }

         return {
           assignee: assignee,
           totalItems: velocityEligibleItems.length,
           completedItems: completedItems.length,
           activeItems: activeItems.length,
           blockedItems: blockedItems.length,
           completedStoryPoints,
           activeStoryPoints: activeItems.reduce((sum, item) => sum + getStoryPoints(item), 0),
           totalStoryPoints,
           avgCycleTime: averageCycleTime,
           avgLeadTime: averageCycleTime, // Using cycle time as lead time approximation
           medianCycleTime: averageCycleTime, // Using average as median approximation
           throughput: completedItems.length,
           completionRate,
           efficiency,
           bugRatio,
           averageVelocity,
           velocityTrend: 'stable' as const, // Will be calculated properly in next enhancement
           directBugsCount,
           iterationBugsCount,
           userStoriesCount,
           bugRatioExplanation,
           // Additional fields for compatibility
           name: assignee,
           performanceLevel,
           storyPoints: completedStoryPoints,
           // Scope tracking
           assignedItems: velocityEligibleItems.length,
           assignedStoryPoints: totalStoryPoints
         };
       });

       console.log('✅ METRICS CALCULATION COMPLETE:', {
         assigneesProcessed: assignees.length,
         metricsGenerated: metrics.length,
         metricsByAssignee: metrics.map(m => ({ name: m.assignee, completed: m.completedItems, total: m.totalItems }))
       });
       
       setMemberMetrics(metrics);
     } catch (error) {
       console.error('Error calculating member metrics:', error);
       setMemberMetrics([]);
     } finally {
       setMetricsLoading(false);
     }
   }, [workItems, settings?.ado?.organization, settings?.ado?.project, settings?.ado?.personalAccessToken, getAssignedTo, getStoryPoints, isCompleted, isActive, isBlocked]);

   // Calculate member metrics when work items change
   useEffect(() => {
     if (workItems && workItems.length > 0) {
       calculateMemberMetrics();
     }
   }, [calculateMemberMetrics, workItems]);

   // Team overview metrics
   const teamOverview = useMemo(() => {
     if (!workItems || workItems.length === 0 || memberMetrics.length === 0) return null;

     const assignees = Array.from(new Set(workItems.map(getAssignedTo))).filter(a => a !== 'Unassigned');
     
     return {
       totalMembers: assignees.length,
       activeMembers: memberMetrics.filter(m => m.activeItems > 0 || m.completedItems > 0).length,
       totalWorkItems: workItems.length,
       completedItems: workItems.filter(isCompleted).length,
       totalStoryPoints: workItems.reduce((sum, item) => sum + getStoryPoints(item), 0),
       avgCompletionRate: memberMetrics.length > 0 ? Math.round(memberMetrics.reduce((sum, m) => sum + m.completionRate, 0) / memberMetrics.length) : 0,
     };
   }, [workItems, memberMetrics, getAssignedTo, getStoryPoints, isCompleted]);

  // Combined team metrics for easier access
  const teamMetrics = useMemo(() => {
    if (!teamOverview) return null;
    
    return {
      overview: teamOverview,
      memberMetrics: memberMetrics
    };
  }, [teamOverview, memberMetrics]);

  // Filter and sort team members based on filters and sort settings
  const filteredAndSortedMembers = useMemo(() => {
    if (!teamMetrics) return [];
    
    let filtered = teamMetrics.memberMetrics;
    
    // Filter by selected members
    if (filters.selectedMembers.length > 0) {
      filtered = filtered.filter(member => filters.selectedMembers.includes(member.assignee));
    }
    
    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(member => 
        member.assignee.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      
      switch (sortBy) {
        case 'name':
          aValue = a.assignee;
          bValue = b.assignee;
          break;
        case 'throughput':
          aValue = a.throughput;
          bValue = b.throughput;
          break;
        case 'completionRate':
          aValue = a.completionRate;
          bValue = b.completionRate;
          break;
        case 'velocity':
          aValue = a.averageVelocity;
          bValue = b.averageVelocity;
          break;
        case 'bugRatio':
          aValue = a.bugRatio;
          bValue = b.bugRatio;
          break;
        default:
          aValue = a.throughput;
          bValue = b.throughput;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      const numA = Number(aValue);
      const numB = Number(bValue);
      return sortOrder === 'asc' ? numA - numB : numB - numA;
    });
    
    return sorted;
  }, [memberMetrics, filters, sortBy, sortOrder]);

  // Helper functions for current work
  const getCurrentWork = (memberName: string): WorkItem[] => {
    if (!workItems) return [];
    return workItems.filter(item => {
      const assignee = getAssignedTo(item);
      const state = getState(item);
      return assignee === memberName && isActive(item);
    });
  };

  const getRecentWork = (memberName: string): WorkItem[] => {
    if (!workItems) return [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // Default to last 30 days
    
    return workItems
      .filter(item => {
        const assignee = getAssignedTo(item);
        const changedDate = getColumnValue(item, ['Changed Date', 'ChangedDate']);
        if (!changedDate) return false;
        
        const itemDate = new Date(changedDate);
        return assignee === memberName && itemDate >= cutoffDate;
      })
      .sort((a, b) => {
        const dateA = new Date(getColumnValue(a, ['Changed Date', 'ChangedDate']) || 0);
        const dateB = new Date(getColumnValue(b, ['Changed Date', 'ChangedDate']) || 0);
        return dateB.getTime() - dateA.getTime();
      });
  };

  const handleViewCurrentWork = (memberName: string) => {
    const currentWork = getCurrentWork(memberName);
    const recentWork = getRecentWork(memberName);
    
    setCurrentWorkModal({
      isOpen: true,
      memberName,
      currentWork,
      recentWork,
    });
  };

  const handleCloseCurrentWork = () => {
    setCurrentWorkModal({
      isOpen: false,
      memberName: '',
      currentWork: [],
      recentWork: [],
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading team analytics...</span>
        </div>
      </div>
    );
  }

  // Render connection required state
  if (!hasValidConnection) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Azure DevOps Connection Required
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please configure your Azure DevOps connection to view team analytics.
          </p>
          <button
            onClick={handleGoToSettings}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Error Loading Team Data
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTeamData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render main team analytics
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitor team performance, velocity, and quality metrics
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <TeamFilters
              filters={filters}
              onFiltersChange={setFilters}
              uniqueMembers={memberMetrics.map(m => m.assignee) || []}
              onClearAll={() => setFilters({ selectedMembers: [], searchTerm: '' })}
              totalMembers={teamMetrics?.memberMetrics.length || 0}
              filteredMembers={filteredAndSortedMembers.length}
            />
            <button
              onClick={fetchTeamData}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </>
              ) : (
                'Refresh Data'
              )}
            </button>
          </div>
        </div>
      </div>



      {/* Team Overview Cards */}
      {teamMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: 'Total Members',
              value: teamMetrics.overview.totalMembers,
              icon: Users,
              color: 'text-blue-600 dark:text-blue-400',
              bgColor: 'bg-blue-100 dark:bg-blue-900',
            },
            {
              title: 'Active Members',
              value: teamMetrics.overview.activeMembers,
              icon: Activity,
              color: 'text-green-600 dark:text-green-400',
              bgColor: 'bg-green-100 dark:bg-green-900',
            },
            {
              title: 'Total Work Items',
              value: teamMetrics.overview.totalWorkItems,
              icon: Target,
              color: 'text-purple-600 dark:text-purple-400',
              bgColor: 'bg-purple-100 dark:bg-purple-900',
            },
            {
              title: 'Completed Items',
              value: teamMetrics.overview.completedItems,
              icon: CheckCircle,
              color: 'text-emerald-600 dark:text-emerald-400',
              bgColor: 'bg-emerald-100 dark:bg-emerald-900',
            },
            {
              title: 'Story Points',
              value: teamMetrics.overview.totalStoryPoints,
              icon: TrendingUp,
              color: 'text-indigo-600 dark:text-indigo-400',
              bgColor: 'bg-indigo-100 dark:bg-indigo-900',
            },
            {
              title: 'Avg Completion Rate',
              value: `${teamMetrics.overview.avgCompletionRate.toFixed(1)}%`,
              icon: Award,
              color: 'text-orange-600 dark:text-orange-400',
              bgColor: 'bg-orange-100 dark:bg-orange-900',
            },
          ].map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.title}
                    </p>
                    <p className={`text-2xl font-bold ${metric.color}`}>
                      {metric.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team Member Performance Cards */}
      {filteredAndSortedMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          {/* Header with integrated controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Performance</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredAndSortedMembers.length} team member{filteredAndSortedMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {/* Compact Sort Controls */}
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="throughput">Sort by Throughput</option>
                <option value="completionRate">Sort by Completion Rate</option>
                <option value="velocity">Sort by Velocity</option>
                <option value="bugRatio">Sort by Bug Ratio</option>
                <option value="name">Sort by Name</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              >
                {sortOrder === 'asc' ? (
                  <ArrowUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ArrowDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Clean Team Member Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedMembers.map((member) => (
              <div key={member.assignee} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {member.assignee}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {/* Performance Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.completionRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        member.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {member.completionRate >= 80 ? 'High Performer' :
                         member.completionRate >= 60 ? 'On Track' : 'Needs Attention'}
                      </span>
                      {/* Status Indicators */}
                      {member.blockedItems > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {member.blockedItems} blocked
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewCurrentWork(member.assignee)}
                    className="ml-3 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="View current work"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Primary Metrics - Dashboard Style */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Velocity - Primary Metric */}
                  <Tooltip content={`Sprint velocity: Average story points per sprint over the entire project duration. Formula: Total Story Points Completed ÷ Total Sprint Count (dynamically calculated). Only counts completed User Stories and PBIs with story points in Done/Closed/Completed/Resolved states.`}>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 cursor-help">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Velocity</p>
                          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {member.averageVelocity > 0 ? member.averageVelocity.toFixed(1) : '0'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tooltip>

                  {/* Throughput */}
                  <Tooltip content={`Completed items: Count of User Stories and Product Backlog Items with story points that are in Done/Closed/Completed/Resolved states. Only counts work items that contribute to velocity calculation.`}>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 cursor-help">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                          <p className="text-xl font-bold text-green-600 dark:text-green-400">
                            {member.throughput}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Tooltip>
                </div>

                {/* Supporting Metrics */}
                <div className="space-y-3 mb-4">
                  {/* Story Points Progress */}
                  <div>
                    <Tooltip content={`Story points progress: Shows how many story points have been completed out of total assigned. Only includes User Stories and Product Backlog Items that contribute to team velocity.`}>
                      <div className="flex items-center justify-between cursor-help">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Story Points</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.completedStoryPoints}/{member.assignedStoryPoints}
                        </span>
                      </div>
                    </Tooltip>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${member.assignedStoryPoints > 0 ? (member.completedStoryPoints / member.assignedStoryPoints) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Work Items Progress */}
                  <div>
                    <Tooltip content={`Work items progress: Shows how many User Stories and Product Backlog Items have been completed out of total assigned. Only counts items that have story points and contribute to velocity.`}>
                      <div className="flex items-center justify-between cursor-help">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Work Items</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.completedItems}/{member.assignedItems}
                        </span>
                      </div>
                    </Tooltip>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${member.assignedItems > 0 ? (member.completedItems / member.assignedItems) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Active Work */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Active Items</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.activeItems}
                    </span>
                  </div>

                  {/* Cycle Time */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Avg Cycle Time</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {member.avgCycleTime > 0 ? `${member.avgCycleTime.toFixed(1)}d` : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Quality Metrics */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-center">
                    {/* Bug Ratio */}
                    <div className="text-center">
                      <Tooltip content={`Bug ratio: ${member.directBugsCount > 0 ? 
                        `${member.directBugsCount} bugs directly assigned out of ${member.totalItems} total items` :
                        member.userStoriesCount > 0 && member.iterationBugsCount > 0 ?
                        `${member.iterationBugsCount} bugs found as children of ${member.userStoriesCount} user stories` :
                        'No bugs found related to this person\'s work'
                      }`}>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                          member.bugRatio > 30 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          member.bugRatio > 15 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          <Bug className="w-3 h-3 mr-1" />
                          {member.bugRatio.toFixed(1)}% bugs
                        </div>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Work Modal */}
      <CurrentWorkModal
        isOpen={currentWorkModal.isOpen}
        onClose={handleCloseCurrentWork}
        memberName={currentWorkModal.memberName}
        currentWork={currentWorkModal.currentWork}
        recentWork={currentWorkModal.recentWork}
      />
    </div>
  );
};

export default Team;