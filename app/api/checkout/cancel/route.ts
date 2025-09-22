export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle checkout cancellation - show retry options
 * GET /api/checkout/cancel
 */
export async function GET(request: NextRequest) {
  // Redirect back to onboarding with cancel status
const base = process.env.NEXT_PUBLIC_APP_URL || "";
return NextResponse.redirect(`${base}/onboarding?payment=canceled&step=4`);
}
