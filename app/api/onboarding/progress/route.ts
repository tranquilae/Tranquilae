import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/utils/supabase/server';
import { supabase } from '@/lib/supabase';

/**
 * Save onboarding progress
 * POST /api/onboarding/progress
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, 'onboarding-progress', 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id');
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        // Try Authorization header first (for API calls)
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
          if (user && !tokenError) {
            userId = user.id;
            console.log('API - Token auth successful for user:', userId);
          }
        }
        
        // If no token auth, try server client with cookies
        if (!userId) {
          const serverClient = await createClient();
          const { data: { user }, error: authError } = await serverClient.auth.getUser();
          
          if (authError || !user) {
            console.log('API - Authentication failed:', authError?.message || 'No user found');
            return NextResponse.json(
              { error: 'Authentication required', code: 'AUTH_REQUIRED' },
              { status: 401 }
            );
          }
          
          userId = user.id;
          console.log('API - Server client auth successful for user:', userId);
        }
      } catch (error) {
        console.error('API - Auth verification error:', error);
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
    } else {
      console.log('API - Using middleware auth for user:', userId);
    }

    const body = await request.json();
    const { step, data } = body;

    // Validate input
    if (typeof step !== 'number' || step < 0 || step > 6) {
      return NextResponse.json(
        { error: 'Invalid step number' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Validate data structure based on step
    const validationErrors = validateStepData(step, data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Save progress to database
    const progress = await db.saveOnboardingProgress(userId, step, data);

    return NextResponse.json({
      success: true,
      progress: {
        step: progress.step,
        data: progress.data,
        updated_at: progress.updated_at
      }
    });

  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get onboarding progress
 * GET /api/onboarding/progress
 */
export async function GET(request: NextRequest) {
  try {
    // Get user ID from middleware header or verify auth directly
    let userId = request.headers.get('x-user-id');
    
    // If no user ID from middleware, try to get it directly from Supabase
    if (!userId) {
      try {
        // Try Authorization header first (for API calls)
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
          if (user && !tokenError) {
            userId = user.id;
            console.log('API - Token auth successful for GET user:', userId);
          }
        }
        
        // If no token auth, try server client with cookies
        if (!userId) {
          const serverClient = await createClient();
          const { data: { user }, error: authError } = await serverClient.auth.getUser();
          
          if (authError || !user) {
            console.log('API - Authentication failed for GET:', authError?.message || 'No user found');
            return NextResponse.json(
              { error: 'Authentication required', code: 'AUTH_REQUIRED' },
              { status: 401 }
            );
          }
          
          userId = user.id;
          console.log('API - Server client auth successful for GET user:', userId);
        }
      } catch (error) {
        console.error('API - Auth verification error for GET:', error);
        return NextResponse.json(
          { error: 'Authentication failed', code: 'AUTH_ERROR' },
          { status: 401 }
        );
      }
    } else {
      console.log('API - Using middleware auth for GET user:', userId);
    }

    const progress = await db.getOnboardingProgress(userId);

    if (!progress) {
      return NextResponse.json({
        step: 0,
        data: {},
        exists: false
      });
    }

    return NextResponse.json({
      step: progress.step,
      data: progress.data,
      exists: true,
      updated_at: progress.updated_at
    });

  } catch (error) {
    console.error('Error getting onboarding progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Validate step data based on the current step
 */
function validateStepData(step: number, data: any): string[] {
  const errors: string[] = [];

  switch (step) {
    case 1: // Goals
      if (data.goals && !Array.isArray(data.goals)) {
        errors.push('Goals must be an array');
      }
      break;

    case 2: // Connect devices
      if (data.devicesConnected !== undefined && typeof data.devicesConnected !== 'boolean') {
        errors.push('devicesConnected must be a boolean');
      }
      break;

    case 3: // Personalisation
      if (data.personalData) {
        const { personalData } = data;
        if (personalData.name && typeof personalData.name !== 'string') {
          errors.push('Name must be a string');
        }
        if (personalData.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(personalData.dateOfBirth)) {
          errors.push('Date of birth must be in YYYY-MM-DD format');
        }
        if (personalData.sex && !['male', 'female', 'other'].includes(personalData.sex)) {
          errors.push('Sex must be male, female, or other');
        }
        if (personalData.height && (typeof personalData.height !== 'number' || personalData.height < 30 || personalData.height > 250)) {
          errors.push('Height must be a number between 30 and 250 cm');
        }
        if (personalData.weight && (typeof personalData.weight !== 'number' || personalData.weight < 1 || personalData.weight > 500)) {
          errors.push('Weight must be a number between 1 and 500 kg');
        }
      }
      break;

    case 4: // Plan selection
    case 5: // Payment
    case 6: // Finish
      if (data.selectedPlan && !['explorer', 'pathfinder'].includes(data.selectedPlan)) {
        errors.push('Selected plan must be explorer or pathfinder');
      }
      if (data.paymentStatus && !['pending', 'success', 'failed'].includes(data.paymentStatus)) {
        errors.push('Payment status must be pending, success, or failed');
      }
      break;
  }

  return errors;
}
