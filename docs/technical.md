# Technical Specifications

This document outlines the technical details, architecture, and standards for the ADO Dashboard API project.

## 1. Technology Stack

- **Framework**: React (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Testing**: Vitest / React Testing Library

## 2. Architecture

The application follows a clean, component-based architecture.

- **`src/components`**: Contains reusable UI components.
  - **`layout/`**: Components that define the main structure of the app (e.g., `AppLayout`, `Header`, `Sidebar`).
  - **`ui/`**: Generic, reusable UI elements (e.g., `Button`, `Input`, `Card`).
- **`src/pages`**: Components that represent full pages or views (e.g., `Dashboard`, `Settings`).
- **`src/context`**: Houses React Context providers for global state management (e.g., `ThemeContext`, `SettingsContext`).
- **`src/hooks`**: Custom React hooks for reusable logic (e.g., `useLocalStorage`).
- **`src/services`**: For logic that interacts with external APIs, like the Azure DevOps API.
  - **`adoService.ts`**: Handles Azure DevOps API calls for connection testing, area path fetching, and sprint data retrieval.

## 3. State Management

- **Theme State**: The current theme (`light` or `dark`) is managed by `ThemeContext`. This allows any component to access the theme and the function to toggle it.
- **Settings State**: User-specific settings (ADO Connection, Sprint Settings) are managed by `SettingsContext`. This data is persisted to Local Storage via the `useLocalStorage` hook.
- **Connection State**: ADO connection status and available area paths are managed within `SettingsContext` and updated via the `adoService`.

## 4. Styling

- **Tailwind CSS**: A utility-first CSS framework is used for all styling.
- **Theming**: Light and dark modes are implemented using Tailwind's `dark` variant, controlled by a class on the `<html>` element. Colors and styles are defined in `tailwind.config.js`.

## 5. Testing Strategy

As per the TDD workflow:
- **Unit Tests (`tests/unit`)**: For individual components, hooks, and utility functions.
- **Integration Tests (`tests/integration`)**: For testing how multiple components work together.
- **E2E Tests (`tests/e2e`)**: For testing complete user flows (e.g., logging in, changing settings).

## Overview
A React-based dashboard that integrates directly with Azure DevOps REST API to provide analytics and insights for project management.

## Architecture Principles
- **Clean Architecture**: Separation of concerns with distinct layers
- **SOLID Principles**: Single responsibility, open/closed, dependency inversion
- **Test-Driven Development**: Tests written before implementation
- **Error-First Design**: Comprehensive error handling and user feedback

## Technology Stack
- **Frontend**: React 18.2.0 with TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts, D3.js
- **HTTP Client**: Fetch API with custom wrapper
- **Testing**: Jest, React Testing Library
- **Build Tool**: Create React App

## Azure DevOps Integration

### Authentication
- **Method**: Personal Access Token (PAT)
- **Storage**: Environment variables (development), secure storage (production)
- **Scope**: Required permissions for work item read access

### API Endpoints
Based on organization: `WKAxcess`, project: `Intelligence`

#### Core Endpoints:
```
GET https://dev.azure.com/{organization}/_apis/projects?api-version=7.1
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems?api-version=7.1
GET https://dev.azure.com/{organization}/{project}/_apis/wit/workitems/{id}?api-version=7.1
GET https://dev.azure.com/{organization}/{project}/_apis/wit/queries?api-version=7.1
```

### Data Models

#### Work Item
```typescript
interface WorkItem {
  id: number;
  rev: number;
  fields: {
    'System.Id': number;
    'System.Title': string;
    'System.State': string;
    'System.AssignedTo'?: {
      displayName: string;
      uniqueName: string;
    };
    'System.CreatedDate': string;
    'System.ChangedDate': string;
    'System.WorkItemType': string;
    'Microsoft.VSTS.Common.Priority'?: number;
  };
  url: string;
}
```

#### Project
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  url: string;
  state: 'wellFormed' | 'createPending' | 'deleting' | 'new';
  revision: number;
  visibility: 'private' | 'public';
}
```

## Component Architecture

### Service Layer
- **AdoApiService**: Main service for ADO API calls
- **AuthService**: Handles authentication and token management
- **CacheService**: Implements caching for API responses
- **ErrorService**: Centralized error handling and logging

### React Components
- **Dashboard**: Main dashboard container
- **WorkItemList**: Display work items in table/card format
- **Charts**: Various chart components for analytics
- **ErrorBoundary**: Global error handling with comprehensive features:
  - React class component with getDerivedStateFromError and componentDidCatch
  - Security-hardened error message sanitization
  - Accessibility-compliant error announcements (ARIA live regions)
  - Professional fallback UI with retry mechanisms
  - Development vs production error display modes
  - Error ID generation for tracking and monitoring
  - Higher-order component and hook utilities for advanced usage
- **AppInitializer**: Application initialization system with health checks:
  - useAppInitialization hook for browser compatibility, environment validation, network monitoring
  - Professional loading screen with progress tracking and system information display
  - Browser compatibility detection (IE, outdated Chrome/Firefox/Safari warnings)
  - Environment variable validation and security context checking
  - Performance monitoring with initialization timing and slow startup warnings
  - Error recovery mechanisms with retry functionality
  - Accessibility support with screen reader announcements and ARIA labels
  - Configurable options for skipping checks and custom timeouts
- **LoadingSpinner**: Loading states

## Environment Configuration

### Required Environment Variables
```
REACT_APP_ADO_ORGANIZATION=WKAxcess
REACT_APP_ADO_PROJECT=Intelligence
REACT_APP_ADO_PAT=your_personal_access_token
REACT_APP_API_VERSION=7.1
```

## Error Handling Strategy
1. **Network Errors**: Retry logic with exponential backoff
2. **Authentication Errors**: Clear tokens and redirect to auth
3. **API Errors**: Display user-friendly messages
4. **Validation Errors**: Form-level validation feedback

## Performance Considerations
- **Caching**: Cache API responses for 5 minutes
- **Pagination**: Implement pagination for large datasets
- **Lazy Loading**: Load components and data on demand
- **Debouncing**: Debounce search and filter inputs

## Security Requirements
- **Token Security**: Never expose PAT in client-side code
- **CORS**: Configure proper CORS headers
- **Input Validation**: Validate all user inputs
- **Error Messages**: Don't expose sensitive information in errors

## Testing Strategy
- **Unit Tests**: All services and utilities (>80% coverage)
- **Integration Tests**: API service integration
- **Component Tests**: React component behavior
- **E2E Tests**: Critical user workflows

## Deployment
- **Development**: Local development server with proxy
- **Production**: Static hosting with environment-specific configuration 