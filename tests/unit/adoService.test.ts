import { adoService } from '../../services/adoService';

// Mock fetch globally
global.fetch = jest.fn();

describe('AdoService Analytics Methods', () => {
  const mockOrganization = 'test-org';
  const mockProject = 'test-project';
  const mockPat = 'test-pat';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchWorkItems', () => {
    it('should fetch work items using WIQL query', async () => {
      // Mock WIQL response
      const mockWiqlResponse = {
        workItems: [
          { id: 1 },
          { id: 2 },
          { id: 3 }
        ]
      };

      // Mock work items batch response
      const mockWorkItemsResponse = {
        value: [
          {
            id: 1,
            fields: {
              'System.Id': 1,
              'System.Title': 'Test Item 1',
              'System.WorkItemType': 'User Story',
              'System.State': 'Active',
              'System.AssignedTo': { displayName: 'John Doe' },
              'System.CreatedDate': '2024-01-01T00:00:00Z',
              'System.IterationPath': 'Project\\Sprint 1',
              'Microsoft.VSTS.Scheduling.StoryPoints': 5
            }
          },
          {
            id: 2,
            fields: {
              'System.Id': 2,
              'System.Title': 'Test Item 2',
              'System.WorkItemType': 'Bug',
              'System.State': 'Closed',
              'System.AssignedTo': { displayName: 'Jane Smith' },
              'System.CreatedDate': '2024-01-02T00:00:00Z',
              'System.IterationPath': 'Project\\Sprint 1',
              'Microsoft.VSTS.Scheduling.StoryPoints': 3
            }
          }
        ]
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWiqlResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWorkItemsResponse)
        });

      const result = await adoService.fetchWorkItems(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(true);
      expect(result.workItems).toHaveLength(2);
      expect(result.workItems![0]).toMatchObject({
        'ID': 1,
        'Title': 'Test Item 1',
        'Work Item Type': 'User Story',
        'State': 'Active',
        'Assigned To': 'John Doe',
        'Story Points': 5
      });
    });

    it('should handle WIQL query failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      const result = await adoService.fetchWorkItems(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(false);
      expect(result.error).toContain('WIQL query failed');
    });

    it('should handle empty work items result', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ workItems: [] })
      });

      const result = await adoService.fetchWorkItems(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No work items found');
    });

    it('should handle batch fetching with large datasets', async () => {
      // Create mock data for 250 work items (more than batch size of 200)
      const mockWorkItemIds = Array.from({ length: 250 }, (_, i) => ({ id: i + 1 }));
      const mockWiqlResponse = { workItems: mockWorkItemIds };

      // Mock batch responses
      const mockBatch1 = {
        value: Array.from({ length: 200 }, (_, i) => ({
          id: i + 1,
          fields: {
            'System.Id': i + 1,
            'System.Title': `Item ${i + 1}`,
            'System.WorkItemType': 'User Story',
            'System.State': 'Active'
          }
        }))
      };

      const mockBatch2 = {
        value: Array.from({ length: 50 }, (_, i) => ({
          id: i + 201,
          fields: {
            'System.Id': i + 201,
            'System.Title': `Item ${i + 201}`,
            'System.WorkItemType': 'User Story',
            'System.State': 'Active'
          }
        }))
      };

      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockWiqlResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBatch1)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockBatch2)
        });

      const result = await adoService.fetchWorkItems(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(true);
      expect(result.workItems).toHaveLength(250);
      expect(fetch).toHaveBeenCalledTimes(3); // 1 WIQL + 2 batch calls
    });
  });

  describe('fetchIterations', () => {
    it('should fetch team iterations', async () => {
      const mockIterationsResponse = {
        value: [
          {
            id: 'iter1',
            name: 'Sprint 1',
            path: 'Project\\Sprint 1',
            attributes: {
              startDate: '2024-01-01T00:00:00Z',
              finishDate: '2024-01-14T00:00:00Z',
              timeFrame: 'past'
            }
          },
          {
            id: 'iter2',
            name: 'Sprint 2',
            path: 'Project\\Sprint 2',
            attributes: {
              startDate: '2024-01-15T00:00:00Z',
              finishDate: '2024-01-28T00:00:00Z',
              timeFrame: 'current'
            }
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockIterationsResponse)
      });

      const result = await adoService.fetchIterations(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(true);
      expect(result.iterations).toHaveLength(2);
      expect(result.iterations![0]).toMatchObject({
        id: 'iter1',
        name: 'Sprint 1',
        startDate: '2024-01-01T00:00:00Z',
        finishDate: '2024-01-14T00:00:00Z',
        timeFrame: 'past'
      });
    });

    it('should handle iterations fetch failure', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden'
      });

      const result = await adoService.fetchIterations(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch iterations');
    });
  });

  describe('fetchTeamMembers', () => {
    it('should fetch team members', async () => {
      const mockTeamMembersResponse = {
        value: [
          {
            identity: {
              displayName: 'John Doe',
              uniqueName: 'john.doe@company.com',
              id: 'user1'
            }
          },
          {
            identity: {
              displayName: 'Jane Smith',
              uniqueName: 'jane.smith@company.com',
              id: 'user2'
            }
          }
        ]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTeamMembersResponse)
      });

      const result = await adoService.fetchTeamMembers(mockOrganization, mockProject, mockPat);

      expect(result.success).toBe(true);
      expect(result.teamMembers).toHaveLength(2);
      expect(result.teamMembers![0]).toMatchObject({
        displayName: 'John Doe',
        uniqueName: 'john.doe@company.com',
        id: 'user1'
      });
    });
  });
}); 