// Instrumentation file for Sentry and other monitoring tools
import { captureRequestError } from '@sentry/nextjs';

export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    const dsn = process.env['SENTRY_DSN'];
    
    if (dsn) {
      const { init } = await import('@sentry/nextjs');
      
      init({
        dsn: dsn,
        
        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
        
        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: process.env['NODE_ENV'] === 'development',
        
        // Session Replay
        replaysOnErrorSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        
        integrations: [
          // Additional integrations can be added here
        ],
        
        beforeSend(event, hint) {
          // Filter out events in development
          if (process.env['NODE_ENV'] === 'development') {
            console.log('Sentry event:', event);
          }
          return event;
        },
      });
    }
  }

  if (process.env['NEXT_RUNTIME'] === 'edge') {
    const dsn = process.env['SENTRY_DSN'];
    
    if (dsn) {
      const { init } = await import('@sentry/nextjs');
      
      init({
        dsn: dsn,
        tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
        debug: process.env['NODE_ENV'] === 'development',
      });
    }
  }
}

// Hook for capturing request errors in nested React Server Components
export async function onRequestError(err: unknown, request: any, errorInfo: any) {
  await captureRequestError(err, request, errorInfo);
}
