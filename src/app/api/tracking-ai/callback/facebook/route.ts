/**
 * Facebook OAuth Callback
 * GET - Handle OAuth callback from Facebook
 */

import { NextRequest, NextResponse } from 'next/server';
import { facebookAuthService } from '@/modules/tracking-ai';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorReason = searchParams.get('error_reason');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      const errorMsg = errorDescription || errorReason || error;
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_auth_failed&message=${encodeURIComponent(errorMsg)}`
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
    await facebookAuthService.handleCallback(stateData.orgId, code);
    
    // Redirect to tracking-ai facebook page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/${stateData.orgId}/tracking-ai/facebook?success=facebook_connected`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=facebook_callback_failed&message=${encodeURIComponent(message)}`
    );
  }
}
