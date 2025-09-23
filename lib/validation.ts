import { z } from 'zod';

// Environment validation schema
export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1, 'Database URL is required'),
  
  // Supabase (new and legacy keys)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().min(1, 'Supabase URL is required'),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  // SUPABASE_JWT_SECRET not needed with new asymmetric JWT system
  
  // Stripe
  STRIPE_SECRET_KEY: z.string().regex(/^sk_(test_|live_)/, 'Invalid Stripe secret key format'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().regex(/^pk_(test_|live_)/, 'Invalid Stripe publishable key format'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid webhook secret format'),
  STRIPE_PRICE_ID_PATHFINDER_MONTHLY: z.string().startsWith('price_', 'Invalid price ID format'),
  STRIPE_PRICE_ID_PATHFINDER_YEARLY: z.string().startsWith('price_', 'Invalid price ID format'),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url().min(1, 'App URL is required'),
  
  // Email (optional)
  RESEND_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),
  
  // OpenAI (optional)
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  OPENAI_MODEL: z.enum(['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']).optional(),
  
  // Sentry (optional)
  SENTRY_DSN: z.string().url().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

// API Request Schemas

// Checkout API
export const checkoutRequestSchema = z.object({
  plan: z.enum(['monthly', 'yearly'], {
    required_error: 'Plan is required',
    invalid_type_error: 'Plan must be either monthly or yearly'
  })
});

// Onboarding Progress API  
export const onboardingProgressSchema = z.object({
  step: z.number().int().min(0).max(10, 'Invalid step number'),
  data: z.object({
    goals: z.array(z.string()).optional(),
    devicesConnected: z.boolean().optional(),
    personalData: z.object({
      name: z.string().min(1).max(100).optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
      sex: z.enum(['male', 'female', 'other']).optional(),
      height: z.number().min(50).max(300).optional(), // cm
      weight: z.number().min(20).max(500).optional(), // kg
    }).optional(),
    selectedPlan: z.enum(['explorer', 'pathfinder']).optional(),
    paymentStatus: z.enum(['pending', 'success', 'failed']).optional(),
  })
});

// User data schemas
export const userUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  plan: z.enum(['explorer', 'pathfinder']).optional(),
  onboarding_complete: z.boolean().optional(),
});

// Subscription schemas
export const subscriptionCreateSchema = z.object({
  user_id: z.string().uuid(),
  plan: z.enum(['explorer', 'pathfinder']),
  status: z.enum(['active', 'trialing', 'past_due', 'canceled', 'incomplete']),
  stripe_subscription_id: z.string().optional(),
  stripe_customer_id: z.string().optional(),
  trial_end: z.date().optional(),
  current_period_start: z.date().optional(),
  current_period_end: z.date().optional(),
  cancel_at_period_end: z.boolean(),
});

export const subscriptionUpdateSchema = subscriptionCreateSchema.partial().omit({ user_id: true });

// Webhook validation schemas
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.record(z.any()),
  }),
  created: z.number(),
  livemode: z.boolean(),
});

// Security schemas
export const ipAddressSchema = z.string().ip();

export const userAgentSchema = z.string().max(500);

export const rateLimitSchema = z.object({
  ip: ipAddressSchema,
  path: z.string(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  timestamp: z.number(),
});

// Audit log schemas
export const securityEventSchema = z.object({
  event_type: z.enum([
    'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE',
    'PASSWORD_RESET', 'EMAIL_VERIFICATION',
    'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED',
    'ACCOUNT_LOCKED', 'PRIVILEGE_ESCALATION',
    'DATA_ACCESS', 'EXPORT_DATA', 'GDPR_REQUEST'
  ]),
  user_id: z.string().uuid().optional(),
  ip_address: ipAddressSchema.optional(),
  user_agent: userAgentSchema.optional(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  risk_score: z.number().int().min(0).max(100).optional(),
});

export const paymentEventSchema = z.object({
  event_type: z.enum([
    'PAYMENT_ATTEMPT', 'PAYMENT_SUCCESS', 'PAYMENT_FAILURE',
    'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELLED',
    'TRIAL_STARTED', 'TRIAL_ENDED', 'REFUND_ISSUED',
    'CHARGEBACK_RECEIVED', 'INVOICE_GENERATED',
    'PAYMENT_METHOD_UPDATED', 'WEBHOOK_RECEIVED'
  ]),
  user_id: z.string().uuid().optional(),
  stripe_customer_id: z.string().optional(),
  stripe_payment_intent_id: z.string().optional(),
  stripe_subscription_id: z.string().optional(),
  amount: z.number().int().min(0).optional(), // in pence/cents
  currency: z.string().length(3).optional(),
  success: z.boolean(),
  error: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  ip_address: ipAddressSchema.optional(),
});

// Email validation schemas
export const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(200),
  template: z.string(),
  data: z.record(z.any()),
});

// Health check schemas
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.number(),
  services: z.record(z.object({
    status: z.enum(['up', 'down', 'degraded']),
    response_time: z.number().optional(),
    error: z.string().optional(),
  })),
});

// API Response schemas
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
});

export const apiSuccessSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
});

// Utility functions for validation
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env);
    
    // Custom validation for Supabase keys
    const hasPublishableKey = !!(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const hasSecretKey = !!(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY);
    
    if (!hasPublishableKey) {
      throw new Error('At least one Supabase publishable key is required: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    if (!hasSecretKey) {
      throw new Error('At least one Supabase secret key is required: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`- ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

export function createValidator<T>(schema: z.ZodSchema<T>) {
  return {
    parse: (data: unknown): T => {
      try {
        return schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new Error(`Validation failed: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
        }
        throw error;
      }
    },
    safeParse: (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
      return schema.safeParse(data);
    }
  };
}

// Pre-built validators
export const validators = {
  checkoutRequest: createValidator(checkoutRequestSchema),
  onboardingProgress: createValidator(onboardingProgressSchema),
  userUpdate: createValidator(userUpdateSchema),
  subscriptionCreate: createValidator(subscriptionCreateSchema),
  subscriptionUpdate: createValidator(subscriptionUpdateSchema),
  stripeWebhook: createValidator(stripeWebhookSchema),
  securityEvent: createValidator(securityEventSchema),
  paymentEvent: createValidator(paymentEventSchema),
  email: createValidator(emailSchema),
  healthCheck: createValidator(healthCheckSchema),
  apiError: createValidator(apiErrorSchema),
  apiSuccess: createValidator(apiSuccessSchema),
};

// Type exports
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type OnboardingProgress = z.infer<typeof onboardingProgressSchema>;
export type UserUpdate = z.infer<typeof userUpdateSchema>;
export type SubscriptionCreate = z.infer<typeof subscriptionCreateSchema>;
export type SubscriptionUpdate = z.infer<typeof subscriptionUpdateSchema>;
export type StripeWebhook = z.infer<typeof stripeWebhookSchema>;
export type SecurityEvent = z.infer<typeof securityEventSchema>;
export type PaymentEvent = z.infer<typeof paymentEventSchema>;
export type Email = z.infer<typeof emailSchema>;
export type HealthCheck = z.infer<typeof healthCheckSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type ApiSuccess = z.infer<typeof apiSuccessSchema>;

// Environment type
export type Environment = z.infer<typeof envSchema>;
