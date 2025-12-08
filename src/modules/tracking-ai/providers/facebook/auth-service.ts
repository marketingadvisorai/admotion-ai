/**
 * Facebook OAuth Authentication Service
 * Handles Facebook OAuth flow for Marketing API access
 */

import { createClient } from '@/lib/db/server';
import type { FacebookIntegration, FacebookAdAccount, FacebookBusiness } from './types';

// ============================================
// CONSTANTS
// ============================================

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';
const FB_AUTH_URL = 'https://www.facebook.com/v21.0/dialog/oauth';
const FB_TOKEN_URL = 'https://graph.facebook.com/v21.0/oauth/access_token';

const REQUIRED_SCOPES = [
  'ads_management',
  'business_management',
  'public_profile',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getClientCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Facebook OAuth credentials not configured. Set FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.');
  }
  
  return { clientId, clientSecret };
}

async function makeGraphRequest<T>(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${FB_GRAPH_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Facebook API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }
  
  return response.json();
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const facebookAuthService = {
  /**
   * Generate OAuth URL for Facebook login
   */
  async getAuthUrl(orgId: string, redirectUri: string): Promise<string> {
    const { clientId } = getClientCredentials();
    
    const state = JSON.stringify({ orgId, timestamp: Date.now() });
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: REQUIRED_SCOPES.join(','),
      state,
    });
    
    return `${FB_AUTH_URL}?${params.toString()}`;
  },
  
  /**
   * Handle OAuth callback and exchange code for tokens
   */
  async handleCallback(orgId: string, code: string): Promise<FacebookIntegration> {
    const supabase = await createClient();
    const { clientId, clientSecret } = getClientCredentials();
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking-ai/callback/facebook`;
    
    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    });
    
    const tokenResponse = await fetch(`${FB_TOKEN_URL}?${tokenParams.toString()}`);
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }
    
    const tokens = await tokenResponse.json();
    const accessToken = tokens.access_token;
    const expiresIn = tokens.expires_in || 5184000; // Default 60 days
    
    // Get long-lived token
    const longLivedToken = await this.exchangeForLongLivedToken(accessToken);
    
    // Get user info
    const userInfo = await makeGraphRequest<{
      id: string;
      name: string;
    }>('/me?fields=id,name', longLivedToken);
    
    // Calculate expiration (long-lived tokens last 60 days)
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    
    // Create or update integration
    const { data: integration, error } = await supabase
      .from('facebook_integrations')
      .upsert({
        org_id: orgId,
        access_token: longLivedToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        connected: true,
        facebook_user_id: userInfo.id,
        facebook_user_name: userInfo.name,
        scopes: REQUIRED_SCOPES,
      }, {
        onConflict: 'org_id,pixel_id',
        ignoreDuplicates: false,
      })
      .select()
      .single();
    
    if (error) {
      // If conflict on null pixel_id, try insert with a new row
      const { data: newIntegration, error: insertError } = await supabase
        .from('facebook_integrations')
        .insert({
          org_id: orgId,
          access_token: longLivedToken,
          token_expires_at: tokenExpiresAt.toISOString(),
          connected: true,
          facebook_user_id: userInfo.id,
          facebook_user_name: userInfo.name,
          scopes: REQUIRED_SCOPES,
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Failed to save integration: ${insertError.message}`);
      }
      
      // Log audit
      await this.logAudit(orgId, 'connect_facebook', 'integration', newIntegration.id, {
        facebookUserId: userInfo.id,
        facebookUserName: userInfo.name,
      });
      
      return this.mapDbToIntegration(newIntegration);
    }
    
    // Log audit
    await this.logAudit(orgId, 'connect_facebook', 'integration', integration.id, {
      facebookUserId: userInfo.id,
      facebookUserName: userInfo.name,
    });
    
    return this.mapDbToIntegration(integration);
  },
  
  /**
   * Exchange short-lived token for long-lived token
   */
  async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
    const { clientId, clientSecret } = getClientCredentials();
    
    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: clientId,
      client_secret: clientSecret,
      fb_exchange_token: shortLivedToken,
    });
    
    const response = await fetch(`${FB_TOKEN_URL}?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Long-lived token exchange failed: ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    return data.access_token;
  },
  
  /**
   * Refresh an expired token
   */
  async refreshToken(integrationId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: integration, error: fetchError } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();
    
    if (fetchError || !integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }
    
    // Exchange current token for a new long-lived token
    const newToken = await this.exchangeForLongLivedToken(integration.access_token);
    const tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 days
    
    await supabase
      .from('facebook_integrations')
      .update({
        access_token: newToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        last_validated_at: new Date().toISOString(),
        validation_error: null,
      })
      .eq('id', integrationId);
    
    await this.logAudit(integration.org_id, 'refresh_token', 'integration', integrationId);
  },
  
  /**
   * Validate token is still working
   */
  async validateToken(integrationId: string): Promise<boolean> {
    const supabase = await createClient();
    
    const { data: integration, error: fetchError } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();
    
    if (fetchError || !integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }
    
    try {
      // Test the token by making a simple API call
      await makeGraphRequest('/me?fields=id', integration.access_token);
      
      await supabase
        .from('facebook_integrations')
        .update({
          last_validated_at: new Date().toISOString(),
          validation_error: null,
        })
        .eq('id', integrationId);
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token validation failed';
      
      await supabase
        .from('facebook_integrations')
        .update({
          last_validated_at: new Date().toISOString(),
          validation_error: message,
          connected: false,
        })
        .eq('id', integrationId);
      
      return false;
    }
  },
  
  /**
   * Disconnect Facebook integration
   */
  async disconnect(integrationId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: integration, error: fetchError } = await supabase
      .from('facebook_integrations')
      .select('org_id')
      .eq('id', integrationId)
      .single();
    
    if (fetchError || !integration) {
      throw new Error(`Integration not found: ${integrationId}`);
    }
    
    // Delete related data
    await supabase
      .from('facebook_capi_settings')
      .delete()
      .eq('integration_id', integrationId);
    
    await supabase
      .from('facebook_event_mappings')
      .delete()
      .eq('integration_id', integrationId);
    
    // Delete integration
    await supabase
      .from('facebook_integrations')
      .delete()
      .eq('id', integrationId);
    
    await this.logAudit(integration.org_id, 'disconnect_facebook', 'integration', integrationId);
  },
  
  /**
   * Get integration by ID
   */
  async getIntegration(integrationId: string): Promise<FacebookIntegration> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();
    
    if (error || !data) {
      throw new Error(`Integration not found: ${integrationId}`);
    }
    
    return this.mapDbToIntegration(data);
  },
  
  /**
   * Get integration by org ID
   */
  async getOrgIntegration(orgId: string): Promise<FacebookIntegration | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('org_id', orgId)
      .eq('connected', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapDbToIntegration(data);
  },
  
  /**
   * List all integrations for an org
   */
  async listIntegrations(orgId: string): Promise<FacebookIntegration[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_integrations')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to list integrations: ${error.message}`);
    }
    
    return (data || []).map(row => this.mapDbToIntegration(row));
  },
  
  /**
   * Get available ad accounts
   */
  async getAdAccounts(integrationId: string): Promise<FacebookAdAccount[]> {
    const integration = await this.getIntegration(integrationId);
    
    const response = await makeGraphRequest<{
      data: Array<{
        id: string;
        account_id: string;
        name: string;
        account_status: number;
        currency: string;
        timezone_name: string;
        business_name?: string;
      }>;
    }>('/me/adaccounts?fields=id,account_id,name,account_status,currency,timezone_name,business_name', integration.accessToken);
    
    return response.data.map(account => ({
      id: account.id,
      accountId: account.account_id,
      name: account.name,
      accountStatus: account.account_status,
      currency: account.currency,
      timezone: account.timezone_name,
      businessName: account.business_name,
    }));
  },
  
  /**
   * Get available businesses
   */
  async getBusinesses(integrationId: string): Promise<FacebookBusiness[]> {
    const integration = await this.getIntegration(integrationId);
    
    const response = await makeGraphRequest<{
      data: Array<{
        id: string;
        name: string;
        verification_status?: string;
        created_time: string;
      }>;
    }>('/me/businesses?fields=id,name,verification_status,created_time', integration.accessToken);
    
    return response.data.map(business => ({
      id: business.id,
      name: business.name,
      verificationStatus: business.verification_status,
      createdTime: new Date(business.created_time),
    }));
  },
  
  /**
   * Set ad account for integration
   */
  async setAdAccount(integrationId: string, adAccountId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('facebook_integrations')
      .update({ ad_account_id: adAccountId })
      .eq('id', integrationId);
  },
  
  /**
   * Set business for integration
   */
  async setBusiness(integrationId: string, businessId: string): Promise<void> {
    const supabase = await createClient();
    
    await supabase
      .from('facebook_integrations')
      .update({ business_id: businessId })
      .eq('id', integrationId);
  },
  
  // ============================================
  // PRIVATE HELPERS
  // ============================================
  
  mapDbToIntegration(row: Record<string, unknown>): FacebookIntegration {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      userId: row.user_id as string | undefined,
      accessToken: row.access_token as string,
      tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at as string) : undefined,
      pixelId: row.pixel_id as string | undefined,
      adAccountId: row.ad_account_id as string | undefined,
      businessId: row.business_id as string | undefined,
      connected: row.connected as boolean,
      lastValidatedAt: row.last_validated_at ? new Date(row.last_validated_at as string) : undefined,
      validationError: row.validation_error as string | undefined,
      facebookUserId: row.facebook_user_id as string | undefined,
      facebookUserName: row.facebook_user_name as string | undefined,
      scopes: (row.scopes as string[]) || [],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  },
  
  async logAudit(
    orgId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('facebook_audit_logs').insert({
      org_id: orgId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: metadata || {},
      success: true,
    });
  },
};
