import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV,

  // Custom error filtering for server-side
  beforeSend(event, hint) {
    // Add additional context for server errors
    if (event.request) {
      // Don't log health check requests
      if (event.request.url?.includes('/health') || event.request.url?.includes('/api/health')) {
        return null;
      }
    }
    
    return event;
  },

  // Add server-specific tags
  initialScope: {
    tags: {
      component: "server",
      app: "tranquilae",
    },
  },
});
