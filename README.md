# Azure DevOps Analytics Dashboard

A powerful React-based dashboard that connects directly to Azure DevOps to provide real-time insights and analytics for your work items, team performance, and project metrics.

## Features

- **Direct Azure DevOps Integration**: Connect using your organization, project, and Personal Access Token
- **Real-time Data**: Fetch work items directly from Azure DevOps REST API
- **Interactive Visualizations**: Charts and graphs powered by Recharts
- **Comprehensive Analytics**: Work item states, types, assignments, and completion rates
- **Responsive Design**: Beautiful UI built with Tailwind CSS
- **Modern React**: Built with React 18 and modern hooks

## Prerequisites

- Node.js 16+ and npm
- Azure DevOps account with access to a project
- Personal Access Token (PAT) with "Work Items: Read" permissions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

### 3. Connect to Azure DevOps

1. **Organization**: Enter your Azure DevOps organization name (from `dev.azure.com/{organization}`)
2. **Project**: Enter your project name
3. **Personal Access Token**: Create a PAT with "Work Items: Read" permissions

#### Creating a Personal Access Token

1. Go to [Azure DevOps](https://dev.azure.com)
2. Click on your profile picture → User Settings → Personal Access Tokens
3. Click "New Token"
4. Give it a name and select "Work Items: Read" scope
5. Copy the generated token (you won't see it again!)

### 4. Test Connection and Fetch Data

1. Click "Test Connection" to verify your credentials
2. Once connected, click "Fetch Work Items" to load your data
3. Explore the dashboard with your real Azure DevOps data!

## Dashboard Features

### Key Metrics Cards
- **Total Work Items**: Complete count of work items
- **Completed Items**: Number and percentage of completed work
- **Active Items**: Currently in-progress work items
- **Work Item Types**: Variety of work item types in your project

### Visualizations
- **State Distribution**: Pie chart showing work item states
- **Type Distribution**: Bar chart of work item types
- **Work Items Table**: Detailed table view of recent items

### Data Processing
- Automatic data transformation from Azure DevOps format
- Smart state detection (completed, active, etc.)
- Flexible column mapping for different Azure DevOps configurations

## Technical Architecture

### Built With
- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Recharts**: Composable charting library
- **Lucide React**: Beautiful icon library
- **Lodash**: Utility functions for data processing
- **D3**: Advanced data manipulation

### API Integration
- Uses Azure DevOps REST API v7.1
- WIQL (Work Item Query Language) for efficient querying
- Batch processing for large datasets
- Proper error handling and loading states

## Project Structure

```
ado-dashboard/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   └── Dashboard.js    # Main dashboard component
│   ├── App.js             # Root component
│   ├── index.js           # Entry point
│   └── index.css          # Global styles with Tailwind
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind configuration
└── README.md             # This file
```

## Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App (not recommended)

## Troubleshooting

### CORS Issues
If you encounter CORS errors when connecting to Azure DevOps:
1. The development server includes a proxy configuration
2. For production, you may need to set up a backend proxy
3. Consider using Azure DevOps Extensions for browser-based solutions

### Connection Failures
- Verify your organization and project names are correct
- Ensure your PAT has the correct permissions
- Check that your PAT hasn't expired
- Confirm you have access to the specified project

### No Data Showing
- Verify the project contains work items
- Check browser console for API errors
- Ensure work items have the expected field names

## Extending the Dashboard

The dashboard is designed to be extensible. You can:

1. **Add New Metrics**: Extend the `metrics` calculation in `Dashboard.js`
2. **Create New Charts**: Add new chart components using Recharts
3. **Enhance Filtering**: Add more filter options for data analysis
4. **Add New Tabs**: Implement additional views (velocity, burndown, etc.)

## Security Considerations

- PATs are stored only in browser memory (not persisted)
- All API calls are made client-side to Azure DevOps
- Consider implementing proper authentication for production use
- Be mindful of rate limits on Azure DevOps API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Azure DevOps API documentation
3. Open an issue in the repository

---

**Note**: This dashboard fetches data directly from Azure DevOps. Ensure you have proper permissions and follow your organization's security policies when using Personal Access Tokens.
