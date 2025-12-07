/**
 * Google Analytics OAuth Callback
 * GET - Handle OAuth callback from Google
 */

import { NextRequest, NextResponse } from 'next/server';
import { googleAnalyticsMcpService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_analytics_auth_failed&message=${encodeURIComponent(error)}`
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=missing_params`
      );
    }
    
    // Parse state
    let stateData: { orgId: string };
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=invalid_state`
      );
    }
    
    // Handle callback
    await googleAnalyticsMcpService.handleCallback(stateData.orgId, code);
    
    // Redirect to tracking-ai page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${stateData.orgId}/tracking-ai?success=google_analytics_connected`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=google_analytics_callback_failed&message=${encodeURIComponent(message)}`
    );
  }
}
