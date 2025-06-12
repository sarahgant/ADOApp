# Azure DevOps Boards API Reference Guide

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Work Items](#work-items)
4. [Fields](#fields)
5. [Pre-Calculated Fields](#pre-calculated-fields)
6. [Common Queries](#common-queries)
7. [Boards](#boards)
8. [Backlogs](#backlogs)
9. [Queries](#queries)
10. [Comments and History](#comments-and-history)
11. [Attachments](#attachments)
12. [Links and Relationships](#links-and-relationships)
13. [Teams and Iterations](#teams-and-iterations)
14. [Areas](#areas)
15. [Work Item Types](#work-item-types)
16. [Process Configuration](#process-configuration)
17. [Taskboard](#taskboard)
18. [Analytics Integration](#analytics-integration)
19. [API Version Matrix](#api-version-matrix)

## Overview

The Azure DevOps Boards REST API provides comprehensive access to work tracking data including work items, boards, backlogs, queries, and more. The API follows RESTful principles and returns data in JSON format.

### Base URL Patterns
```
# REST API
https://dev.azure.com/{organization}/{project}/_apis/{area}/{resource}?api-version={version}

# Analytics OData
https://analytics.dev.azure.com/{organization}/_odata/v4.0-preview/{entity}
```

### Current API Version
The latest stable API version is **7.1** as of 2025.

## Authentication

Azure DevOps supports multiple authentication methods:

1. **Personal Access Tokens (PATs)**
   - Most common for API access
   - Basic authentication with Base64 encoding
   ```bash
   curl -u {username}:{PAT} https://dev.azure.com/{organization}/_apis/projects?api-version=7.1
   ```

2. **OAuth 2.0**
   - Authorization URL: `https://app.vssps.visualstudio.com/oauth2/authorize`
   - Token URL: `https://app.vssps.visualstudio.com/oauth2/token`

3. **Microsoft Authentication Library (MSAL)**
   - For interactive applications

### Required Scopes
- `vso.work` - Work items (read)
- `vso.work_write` - Work items (read/write)
- `vso.analytics` - Analytics data

## Work Items

### Core Work Item Operations

#### 1. Create Work Item
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/${type}?api-version=7.1
```

**Request Body:**
```json
[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "Sample task"
  }
]
```

#### 2. Get Work Item
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
```

**Optional Parameters:**
- `fields`: Comma-separated list of field names
- `asOf`: DateTime to get historical data
- `$expand`: Include additional data (All, Relations, Fields, Links, None)

#### 3. Update Work Item
```
PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
```

#### 4. Delete Work Item
```
DELETE https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
```

#### 5. List Work Items
```
GET https://dev.azure.com/{organization}/_apis/wit/workitems?ids={ids}&api-version=7.1
```
- Maximum 200 work items per request

#### 6. Get Work Items Batch
```
POST https://dev.azure.com/{organization}/_apis/wit/workitemsbatch?api-version=7.1
```

### Available Work Item Data

**Core Fields:**
- `System.Id`: Unique identifier
- `System.Title`: Work item title
- `System.Description`: Full description
- `System.WorkItemType`: Type (Bug, Task, User Story, etc.)
- `System.State`: Current state
- `System.Reason`: Reason for state
- `System.AreaPath`: Area classification
- `System.IterationPath`: Iteration classification
- `System.AssignedTo`: Assigned user
- `System.CreatedDate`: Creation date
- `System.CreatedBy`: Creator
- `System.ChangedDate`: Last modified date
- `System.ChangedBy`: Last modifier
- `System.Rev`: Revision number
- `System.History`: Change history
- `System.Tags`: Tags
- `System.BoardColumn`: Board column
- `System.BoardColumnDone`: Column completion status
- `System.BoardLane`: Board lane

**Link-Related Fields:**
- `System.RelatedLinkCount`: Count of related links
- `System.AttachedFileCount`: Count of attachments
- `System.CommentCount`: Count of comments
- `System.ExternalLinkCount`: Count of external links
- `System.HyperLinkCount`: Count of hyperlinks
- `System.RemoteLinkCount`: Count of remote links (cross-organization)
- `System.Parent`: Parent work item ID

**Process-Specific Fields:**
- `Microsoft.VSTS.Common.Priority`: Priority level (1-4)
- `Microsoft.VSTS.Common.Severity`: Severity level
- `Microsoft.VSTS.Common.Activity`: Activity type
- `Microsoft.VSTS.Common.ClosedDate`: Closure date
- `Microsoft.VSTS.Common.ClosedBy`: Closed by user
- `Microsoft.VSTS.Common.ResolvedDate`: Resolution date
- `Microsoft.VSTS.Common.ResolvedBy`: Resolved by user
- `Microsoft.VSTS.Common.ActivatedDate`: Activation date
- `Microsoft.VSTS.Common.ActivatedBy`: Activated by user
- `Microsoft.VSTS.Common.ValueArea`: Business value area
- `Microsoft.VSTS.Scheduling.RemainingWork`: Remaining work hours
- `Microsoft.VSTS.Scheduling.OriginalEstimate`: Original estimate
- `Microsoft.VSTS.Scheduling.CompletedWork`: Completed work hours
- `Microsoft.VSTS.Scheduling.StoryPoints`: Story points (Agile)
- `Microsoft.VSTS.Scheduling.Effort`: Effort (Scrum)
- `Microsoft.VSTS.Scheduling.Size`: Size (CMMI)
- `Microsoft.VSTS.Build.FoundIn`: Build where found
- `Microsoft.VSTS.Build.IntegrationBuild`: Integration build

## Fields

### List All Fields
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/fields?api-version=7.1
```

**Optional Parameters:**
- `$expand`: extensionFields

**Response includes:**
- Field name
- Reference name
- Type (string, integer, double, dateTime, plainText, html, treePath, identity)
- Usage (workItem, workItemLink, tree, workItemTypeExtension)
- Read-only status
- Supported operations
- Is identity field
- Is picklist
- Is picklist suggested

### Get Field Details
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/fields/{fieldNameOrRefName}?api-version=7.1
```

### Field Attributes
- **name**: Display name
- **referenceName**: Internal reference name
- **type**: Data type
- **usage**: Field usage context
- **readOnly**: Whether field is read-only
- **supportedOperations**: Query operators supported
- **isIdentity**: Whether field contains identity
- **isPicklist**: Whether field has predefined values
- **isPicklistSuggested**: Whether field suggests values
- **isQueryable**: Whether field can be queried
- **canSortBy**: Whether field supports sorting

## Pre-Calculated Fields

### Analytics Service Calculations
The Analytics service provides pre-calculated fields that are automatically maintained:

#### Time-Based Calculations
- **CycleTimeDays**: Days from first 'Active' state to 'Closed'
- **LeadTimeDays**: Days from creation to closure
- **StateChangeDate**: Last state transition timestamp
- **DateSK**: Date dimension key (format: YYYYMMDD as integer)

#### Work Item Aging
- **Age**: Current age in days (for non-closed items)
- **TimeInState**: Duration in current state

#### Aggregated Metrics (via OData)
- **StoryPointsCompleted**: Sum of story points for closed items
- **AverageClosureRate**: Average items closed per day
- **WorkItemThroughput**: Count of items by state over time

### State Categories (Pre-defined)
All work item types map to these categories:
- **Proposed**: New, To Do, Proposed
- **InProgress**: Active, Committed, In Progress, Doing
- **Resolved**: Resolved, Done
- **Completed**: Closed, Completed
- **Removed**: Removed, Cut

## Common Queries

### 1. Active Work by Team
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo] 
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.AreaPath] UNDER '{teamAreaPath}'
           AND [System.State] IN ('Active', 'In Progress', 'Committed')
           ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate]"
}
```

### 2. Sprint Backlog
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.WorkItemType], 
                  [Microsoft.VSTS.Scheduling.RemainingWork]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.IterationPath] = '{sprintPath}'
           AND [System.State] <> 'Removed'
           ORDER BY [Microsoft.VSTS.Common.BacklogPriority]"
}
```

### 3. Bugs by Priority
```json
{
  "query": "SELECT [System.Id], [System.Title], [Microsoft.VSTS.Common.Priority], 
                  [System.State], [System.AssignedTo]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.WorkItemType] = 'Bug'
           AND [System.State] NOT IN ('Closed', 'Resolved', 'Removed')
           ORDER BY [Microsoft.VSTS.Common.Priority], [System.CreatedDate]"
}
```

### 4. Recently Updated Items
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.ChangedDate], 
                  [System.ChangedBy]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.ChangedDate] >= @Today - 7
           ORDER BY [System.ChangedDate] DESC"
}
```

### 5. Unassigned Work
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.WorkItemType], 
                  [System.State]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.AssignedTo] = ''
           AND [System.State] IN ('New', 'Active', 'In Progress')
           ORDER BY [System.CreatedDate]"
}
```

### 6. Parent-Child Hierarchy
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.WorkItemType]
           FROM WorkItemLinks
           WHERE ([Source].[System.TeamProject] = @project
           AND [Source].[System.WorkItemType] IN ('Epic', 'Feature'))
           AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward')
           AND ([Target].[System.State] <> 'Removed')
           MODE (Recursive)"
}
```

### 7. Completed This Sprint
```json
{
  "query": "SELECT [System.Id], [System.Title], [Microsoft.VSTS.Scheduling.StoryPoints]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.IterationPath] = '{currentSprint}'
           AND [System.State] IN ('Closed', 'Done', 'Resolved')
           AND [Microsoft.VSTS.Common.ClosedDate] >= @StartOfIteration
           AND [Microsoft.VSTS.Common.ClosedDate] <= @EndOfIteration"
}
```

### 8. Blocked Items
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.AssignedTo], 
                  [System.Tags]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND ([System.Tags] CONTAINS 'Blocked' 
                OR [System.Tags] CONTAINS 'Impediment')
           AND [System.State] <> 'Closed'"
}
```

### 9. High Priority Bugs Aging
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.CreatedDate], 
                  [Microsoft.VSTS.Common.Priority]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.WorkItemType] = 'Bug'
           AND [Microsoft.VSTS.Common.Priority] <= 2
           AND [System.State] NOT IN ('Closed', 'Resolved')
           AND [System.CreatedDate] < @Today - 30"
}
```

### 10. Work Items Without Story Points
```json
{
  "query": "SELECT [System.Id], [System.Title], [System.State]
           FROM WorkItems 
           WHERE [System.TeamProject] = @project 
           AND [System.WorkItemType] IN ('User Story', 'Product Backlog Item')
           AND [Microsoft.VSTS.Scheduling.StoryPoints] = ''
           AND [System.State] NOT IN ('Removed', 'Closed')"
}
```

## Boards

### List Boards
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/boards?api-version=7.1
```

### Get Board
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/boards/{id}?api-version=7.1
```

**Board Data Available:**
- Board ID and name
- Board columns
- Board rows (swimlanes)
- Column fields
- Row fields
- Card settings
- Card rules
- Board chart settings

### Board Columns
Each column includes:
- Column ID
- Name
- Item limit
- State mappings
- Column type
- Is split
- Description

### Board Rows
Each row includes:
- Row ID
- Name

### Update Board Column
```
PUT https://dev.azure.com/{organization}/{project}/{team}/_apis/work/boards/{board}/columns?api-version=7.1
```

## Backlogs

### List Backlogs
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/backlogs?api-version=7.1
```

**Backlog Levels:**
- Portfolio backlogs (Epics, Features)
- Requirement backlog (User Stories, PBIs)
- Iteration backlog (Tasks)

**Backlog Data:**
- Backlog ID
- Name
- Rank
- Work item count limit
- Work item types
- Add panel fields
- Column fields
- Default work item type
- Parent backlog

### Get Backlog Work Items
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/backlogs/{backlogId}/workitems?api-version=7.1
```

## Queries

### Query Operations
Azure DevOps supports Work Item Query Language (WIQL) for complex queries.

#### Execute WIQL Query
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/wiql?api-version=7.1
```

**Request Body:**
```json
{
  "query": "SELECT [System.Id], [System.Title] FROM WorkItems WHERE [System.State] = 'Active'"
}
```

### Query Types
1. **Flat queries**: Simple list of work items
2. **Tree queries**: Hierarchical parent-child relationships
3. **One-hop queries**: Work items and their direct links

### Queryable Fields
Most system and custom fields support queries with operators:
- `=`, `<>`, `>`, `<`, `>=`, `<=`
- `In`, `Not In`
- `Contains`, `Does Not Contain`
- `Under`, `Not Under` (for tree fields)
- `Was Ever` (for historical queries)

### Special Query Macros
- `@Project` - Current project
- `@Me` - Current user
- `@Today` - Current date
- `@StartOfDay`, `@StartOfWeek`, `@StartOfMonth`, `@StartOfYear`
- `@CurrentIteration` - Team's current iteration
- `@TeamAreas` - Team's area paths

## Comments and History

### Get Comments
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workItems/{workItemId}/comments?api-version=7.1-preview.4
```

**Parameters:**
- `$top`: Number of comments to return
- `continuationToken`: For pagination
- `includeDeleted`: Include deleted comments
- `$expand`: Expand additional properties
- `order`: Sort order

**Comment Data:**
- Comment ID
- Comment text
- Created by (user identity)
- Created date
- Modified by
- Modified date
- Version
- Rendered text (HTML)

### Add Comment
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/workItems/{workItemId}/comments?api-version=7.1-preview.4
```

### Update Comment
```
PATCH https://dev.azure.com/{organization}/{project}/_apis/wit/workItems/{workItemId}/comments/{commentId}?api-version=7.1-preview.4
```

### History
The History field contains:
- All discussion comments
- Field change audit trail
- State transitions
- Assignment changes

**Note:** History field is queryable for text search but doesn't support queries on specific field changes.

## Attachments

### Upload Attachment
```
POST https://dev.azure.com/{organization}/{project}/_apis/wit/attachments?api-version=7.1
```

**Parameters:**
- `fileName`: Name of the file
- `uploadType`: Simple or chunked
- `areaPath`: Optional area path

**Limits:**
- Standard: 130MB per file
- Maximum 100 attachments per work item

### Chunked Upload (for large files)
1. Start chunked upload
2. Upload chunks
3. Complete upload

### Get Attachment
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/attachments/{id}?api-version=7.1
```

### Download Attachment
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/attachments/{id}?fileName={fileName}&download=true&api-version=7.1
```

## Links and Relationships

### Link Types
1. **Work Item Links:**
   - `System.LinkTypes.Hierarchy-Forward` (Parent → Child)
   - `System.LinkTypes.Hierarchy-Reverse` (Child → Parent)
   - `System.LinkTypes.Related` (Related)
   - `System.LinkTypes.Dependency-Forward` (Predecessor)
   - `System.LinkTypes.Dependency-Reverse` (Successor)
   - `Microsoft.VSTS.Common.Affects-Forward` (Affects)
   - `Microsoft.VSTS.Common.Affects-Reverse` (Affected By)
   - `System.LinkTypes.Duplicate-Forward` (Duplicate Of)
   - `System.LinkTypes.Duplicate-Reverse` (Duplicate)
   - `Microsoft.VSTS.TestCase.SharedStepReferencedBy` (Test Related)

2. **External Links:**
   - Hyperlinks
   - Versioned items (commits, branches)
   - Build links
   - Pull request links
   - Wiki page links
   - Test result links

3. **Remote Links:**
   - Cross-organization links
   - Consumes From/Produced For

### Get Work Item Relations
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}?$expand=Relations&api-version=7.1
```

### Add Link
Include in work item update:
```json
{
  "op": "add",
  "path": "/relations/-",
  "value": {
    "rel": "System.LinkTypes.Related",
    "url": "https://dev.azure.com/{organization}/_apis/wit/workItems/{targetId}",
    "attributes": {
      "comment": "Related to implementation"
    }
  }
}
```

### Remove Link
```json
{
  "op": "remove",
  "path": "/relations/{index}"
}
```

## Teams and Iterations

### List Teams
```
GET https://dev.azure.com/{organization}/_apis/teams?api-version=7.1
```

### Get Team Settings
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings?api-version=7.1
```

**Team Settings Include:**
- Backlog iteration
- Default iteration
- Working days
- Bug behavior settings
- Default area path

### List Iterations
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations?api-version=7.1
```

**Iteration Data:**
- Iteration ID
- Name
- Path
- Start date
- Finish date
- Time frame (past, current, future)

### Get Iteration Capacity
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/capacities?api-version=7.1
```

**Capacity Data:**
- Team member
- Activities
- Capacity per day
- Days off

### Get Iteration Work Items
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/iterations/{iterationId}/workitems?api-version=7.1
```

## Areas

### Get Areas
```
GET https://dev.azure.com/{organization}/{project}/_apis/work/teamsettings/teamfieldvalues?api-version=7.1
```

### Area Data
- Area path
- Include sub-areas flag
- Default area
- Area ID

### Update Team Areas
```
PATCH https://dev.azure.com/{organization}/{project}/{team}/_apis/work/teamsettings/teamfieldvalues?api-version=7.1
```

## Work Item Types

### List Work Item Types
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitemtypes?api-version=7.1
```

### Get Work Item Type
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitemtypes/{type}?api-version=7.1
```

**Work Item Type Data:**
- Name
- Reference name
- Description
- Fields
- Field rules
- Transitions
- States
- Icon
- Color
- Is disabled

### Work Item Type Fields
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitemtypes/{type}/fields?api-version=7.1
```

**Field Information:**
- Always required
- Allowed values
- Default value
- Read-only for type
- Help text
- Dependent fields

### Work Item Type States
```
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitemtypes/{type}/states?api-version=7.1
```

## Process Configuration

### Get Process Configuration
```
GET https://dev.azure.com/{organization}/{project}/_apis/work/processconfiguration?api-version=7.1
```

**Process Data:**
- Bug work item type configuration
- Portfolio backlogs
- Requirement backlog
- Task backlog
- Type fields
- Weekend days

## Taskboard

### Get Taskboard Work Items
```
GET https://dev.azure.com/{organization}/{project}/{team}/_apis/work/taskboardworkitems/{iterationId}?api-version=7.1
```

**Taskboard Data:**
- Work item details
- Column assignments
- Remaining work
- Parent relationships
- Task ownership

### Update Taskboard Work Item
```
PATCH https://dev.azure.com/{organization}/{project}/{team}/_apis/work/taskboardworkitems/{iterationId}?api-version=7.1
```

## Analytics Integration

### Analytics OData Endpoints
For advanced reporting and calculations, use the Analytics service:

#### Base URL
```
https://analytics.dev.azure.com/{organization}/_odata/v4.0-preview/
```

#### Key Entities
- **WorkItems**: Current state with pre-calculated metrics
- **WorkItemSnapshot**: Historical snapshots
- **WorkItemBoardSnapshot**: Board state history
- **Areas**: Area path dimensions
- **Iterations**: Sprint/iteration dimensions
- **Teams**: Team configurations
- **Projects**: Project metadata

#### Example: Team Velocity
```
GET https://analytics.dev.azure.com/{organization}/_odata/v4.0-preview/WorkItems?
$filter=WorkItemType eq 'User Story' 
  and State eq 'Closed' 
  and ClosedDate ge 2024-01-01Z 
  and AreaPath eq '{teamAreaPath}'
&$apply=aggregate(StoryPoints with sum as TotalVelocity)
```

#### Example: Cycle Time Distribution
```
GET https://analytics.dev.azure.com/{organization}/_odata/v4.0-preview/WorkItems?
$filter=WorkItemType eq 'User Story' 
  and State eq 'Closed'
  and AreaPath eq '{teamAreaPath}'
&$apply=groupby((CycleTimeDays),aggregate($count as Count))
&$orderby=CycleTimeDays
```

### Key Pre-Calculated Analytics Fields
- **CycleTimeDays**: Auto-calculated cycle time
- **LeadTimeDays**: Auto-calculated lead time
- **StateChangeDate**: Last state transition
- **DateSK**: Date dimension key (YYYYMMDD)
- **IsLastRevisionOfDay**: For daily snapshots
- **CompletedDateSK**: Completion date key

## API Version Matrix

| Azure DevOps Version | REST API Version | Analytics Version | Supported Since |
|---------------------|------------------|-------------------|-----------------|
| Azure DevOps Services | 7.2 | v4.0-preview | Latest |
| Azure DevOps Server 2022.1 | 7.1 | v4.0-preview | 19.225.34309.2 |
| Azure DevOps Server 2022 | 7.0 | v3.0-preview | 19.205.33122.1 |
| Azure DevOps Server 2020 | 6.0 | v2.0 | 18.170.30525.1 |
| Azure DevOps Server 2019 | 5.0 | v1.0 | 17.143.28621.4 |

## Performance Best Practices

### 1. Field Selection
Always specify only required fields:
```
GET /_apis/wit/workitems/{id}?fields=System.Id,System.Title,System.State&api-version=7.1
```

### 2. Batch Operations
Use batch API for multiple operations:
```
POST /_apis/wit/workitemsbatch?api-version=7.1
{
  "ids": [1,2,3,4,5],
  "fields": ["System.Id", "System.Title", "System.State"]
}
```

### 3. Pagination
Handle large result sets:
```
GET /_apis/wit/workitems?ids=1,2,3&$top=50&continuationToken={token}&api-version=7.1
```

### 4. Use Analytics for Aggregations
Instead of fetching all items and calculating client-side:
```
# Good - Server-side aggregation
GET /analytics.dev.azure.com/{org}/_odata/v4.0-preview/WorkItems?
$apply=aggregate(StoryPoints with sum as Total)

# Avoid - Client-side calculation
GET /_apis/wit/workitems?ids=1,2,3,4,5...
```

### 5. Cache Static Data
Cache these for performance:
- Field definitions
- Work item types
- Area/Iteration paths
- Team configurations

### 6. Use Continuation Tokens
For queries returning many results:
```json
{
  "queryType": "flat",
  "queryResultType": "workItem",
  "asOf": "2024-01-15T00:00:00Z",
  "continuationToken": "{token}"
}
```

## Error Handling

### Common HTTP Status Codes
- **200**: Success
- **201**: Created
- **204**: No Content (successful delete)
- **400**: Bad Request (invalid query/data)
- **401**: Unauthorized
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

### Rate Limits
- **REST API**: 
  - Anonymous: 150 requests per minute
  - Authenticated: 1,000 requests per minute
- **Analytics**: 
  - 200 requests per minute per user

### Error Response Format
```json
{
  "$id": "1",
  "innerException": null,
  "message": "The field 'System.Id' is read only and cannot be set.",
  "typeName": "Microsoft.TeamFoundation.WorkItemTracking.Server.WorkItemFieldInvalidException",
  "typeKey": "WorkItemFieldInvalidException",
  "errorCode": 600171,
  "eventId": 3200
}
```

## Additional Resources

- [Official Azure DevOps REST API Documentation](https://docs.microsoft.com/en-us/rest/api/azure/devops/)
- [Azure DevOps SDK](https://github.com/Microsoft/azure-devops-node-api)
- [WIQL Reference](https://docs.microsoft.com/en-us/azure/devops/boards/queries/wiql-syntax)
- [Analytics OData Documentation](https://docs.microsoft.com/en-us/azure/devops/report/extend-analytics/quick-ref)
- [Azure DevOps CLI](https://docs.microsoft.com/en-us/azure/devops/cli/)