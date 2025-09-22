import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle checkout cancellation - show retry options
 * GET /api/checkout/cancel
 */
export async function GET(request: NextRequest) {
  // Redirect back to onboarding with cancel status
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?payment=canceled&step=4`
  );
}
