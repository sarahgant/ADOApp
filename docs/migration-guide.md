# Migration Guide: Create React App to Vite

## Why Migrate?

Create React App (CRA) has been officially deprecated by the React team as of February 2024. The deprecation warnings you're seeing are symptoms of this larger issue:

- `react-scripts` 5.0.1 uses outdated webpack-dev-server APIs
- No active maintenance or security updates
- Significantly slower build times compared to modern alternatives
- Limited flexibility for customization

## Migration Steps

### Step 1: Install Vite and Dependencies

```bash
# Install Vite and related dependencies
npm install --save-dev vite @vitejs/plugin-react @types/node

# Install additional dependencies for your current setup
npm install --save-dev @vitejs/plugin-react-swc
```

### Step 2: Create Vite Configuration

Create `vite.config.ts` in your project root:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://dev.azure.com',
        changeOrigin: true,
        secure: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    // Replace process.env with import.meta.env
    'process.env': 'import.meta.env'
  }
})
```

### Step 3: Update package.json Scripts

Replace your current scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui"
  }
}
```

### Step 4: Update index.html

Move `public/index.html` to the root directory and update it:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ADO Dashboard</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Step 5: Update Entry Point

Rename `src/index.tsx` to `src/main.tsx` and update imports:

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Step 6: Update Environment Variables

Replace `REACT_APP_` prefixed environment variables with `VITE_`:

```bash
# .env
VITE_ADO_ORGANIZATION=WKAxcess
VITE_ADO_PROJECT=Intelligence
VITE_ADO_PAT=your_personal_access_token
VITE_API_VERSION=7.1
```

Update your code to use `import.meta.env` instead of `process.env`:

```typescript
// Before
const organization = process.env.REACT_APP_ADO_ORGANIZATION

// After  
const organization = import.meta.env.VITE_ADO_ORGANIZATION
```

### Step 7: Update TypeScript Configuration

Update `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

### Step 8: Update Testing Setup

Install Vitest for testing:

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/jest-dom
```

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### Step 9: Remove CRA Dependencies

```bash
npm uninstall react-scripts
npm uninstall @types/jest  # if using Vitest instead
```

### Step 10: Update Build Output

Change build output directory in deployment scripts from `build/` to `dist/`.

## Benefits After Migration

- **10x faster development builds** (seconds instead of minutes)
- **Instant hot module replacement** (HMR)
- **Modern ES modules** support
- **Better tree shaking** and smaller bundles
- **Active maintenance** and regular updates
- **Flexible configuration** without ejecting

## Testing the Migration

1. Run `npm run dev` to start development server
2. Verify all features work correctly
3. Run `npm run build` to test production build
4. Run `npm run preview` to test production build locally

## Rollback Plan

If issues arise, you can temporarily revert by:
1. Restoring original `package.json`
2. Running `npm install`
3. Removing Vite configuration files

## Performance Comparison

| Metric | Create React App | Vite |
|--------|------------------|------|
| Cold start | 30-60 seconds | 2-5 seconds |
| Hot reload | 3-10 seconds | <1 second |
| Build time | 2-5 minutes | 30-60 seconds |
| Bundle size | Larger | 20-30% smaller | 