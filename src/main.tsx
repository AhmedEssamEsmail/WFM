import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ChunkErrorBoundary } from './components/ChunkErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ChunkErrorBoundary>
  </StrictMode>,
)
