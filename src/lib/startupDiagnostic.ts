/**
 * Startup Diagnostic Logger for Smart TV & Development
 * Identifies which initialization step hangs or fails during startup.
 */

export interface DiagnosticLog {
  timestamp: number;
  relativeMs: number;
  step: string;
  status: 'start' | 'success' | 'warn' | 'error';
  details?: any;
}

const startTime = Date.now();
const logs: DiagnosticLog[] = [];

export const startupDiagnostic = {
  log(step: string, status: DiagnosticLog['status'] = 'start', details?: any) {
    const entry: DiagnosticLog = {
      timestamp: Date.now(),
      relativeMs: Date.now() - startTime,
      step,
      status,
      details,
    };
    logs.push(entry);

    const prefix = `[TV-Diagnostic +${entry.relativeMs}ms] [${status.toUpperCase()}] ${step}`;
    if (status === 'error') {
      console.error(prefix, details || '');
    } else if (status === 'warn') {
      console.warn(prefix, details || '');
    } else {
      console.log(prefix, details || '');
    }
  },

  getLogs(): DiagnosticLog[] {
    return logs;
  },
};

// Expose globally for remote debugging or TV console inspections
if (typeof window !== 'undefined') {
  (window as any).__STARTUP_DIAGNOSTICS__ = startupDiagnostic;
}
