import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/shared/ErrorBoundary.tsx';
import { ChunkErrorBoundary } from './components/shared/ChunkErrorBoundary.tsx';
import { initSentry } from './lib/sentry.ts';

initSentry();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChunkErrorBoundary>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ChunkErrorBoundary>
  </StrictMode>
);
