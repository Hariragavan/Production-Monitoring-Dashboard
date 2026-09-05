import './lib/polyfills';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { startupDiagnostic } from './lib/startupDiagnostic';

startupDiagnostic.log('Application bootstrap initiated');

const rootElement = document.getElementById('root');

if (rootElement) {
  startupDiagnostic.log('Mounting React root');
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary fallbackTitle="Dashboard could not load">
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  startupDiagnostic.log('React root rendered', 'success');
} else {
  startupDiagnostic.log('Fatal: root element not found', 'error');
}
