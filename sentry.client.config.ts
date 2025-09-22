import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',

  environment: process.env.NODE_ENV,

  // Capture unhandled promise rejections
  integrations: [
    new Sentry.BrowserTracing({
      // Set 'tracingOrigins' to connect sentry with your network trace
      tracingOrigins: [
        "localhost",
        process.env.NEXT_PUBLIC_APP_URL || "",
        /^\//,
      ],
    }),
  ],

  // Custom error filtering for Tranquilae
  beforeSend(event, hint) {
    // Filter out certain errors we don't care about
    if (event.exception) {
      const error = hint.originalException;
      
      // Filter out network errors from user's internet issues
      if (error instanceof Error && error.message.includes('Network Error')) {
        return null;
      }
      
      // Filter out cancelled requests
      if (error instanceof Error && error.message.includes('AbortError')) {
        return null;
      }
    }
    
    return event;
  },

  // Add user context for better error tracking
  initialScope: {
    tags: {
      component: "client",
      app: "tranquilae",
    },
  },
});
