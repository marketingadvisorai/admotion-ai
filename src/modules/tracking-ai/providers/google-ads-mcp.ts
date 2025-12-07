/**
 * Google Ads MCP Service
 * Based on: https://github.com/google-marketing-solutions/google_ads_mcp
 * 
 * Implements MCP runtime for Google Ads API interactions
 */

import { createClient } from '@/lib/db/server';
import {
  AdsMcpService,
  TrackingIntegration,
  GoogleAdsCustomer,
  GoogleAdsConversionAction,
  CreateConversionActionInput,
  ConversionCategory,
  GoogleAdsCredentials,
} from '../types';

// ============================================
// CONSTANTS
// ============================================

const GOOGLE_ADS_API_VERSION = 'v18';
const GOOGLE_ADS_API_BASE = 'https://googleads.googleapis.com';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const GOOGLE_ADS_SCOPES = [
  'https://www.googleapis.com/auth/adwords',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getGoogleAdsCredentials(orgId: string): Promise<GoogleAdsCredentials> {
  const supabase = await createClient();
  
  const secretNames = ['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN'];
  const { data: secrets } = await supabase
    .from('organization_secrets')
    .select('name, value')
    .eq('org_id', orgId)
    .in('name', secretNames);
  
  const secretMap = new Map(secrets?.map(s => [s.name, s.value]) || []);
  
  return {
    clientId: secretMap.get('GOOGLE_ADS_CLIENT_ID') || process.env.GOOGLE_ADS_CLIENT_ID || '',
    clientSecret: secretMap.get('GOOGLE_ADS_CLIENT_SECRET') || process.env.GOOGLE_ADS_CLIENT_SECRET || '',
    developerToken: secretMap.get('GOOGLE_ADS_DEVELOPER_TOKEN') || process.env.GOOGLE_ADS_DEVELOPER_TOKEN || '',
    refreshToken: '',
  };
}

async function getIntegration(integrationId: string): Promise<TrackingIntegration> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tracking_integrations')
    .select('*')
    .eq('id', integrationId)
    .single();
  
  if (error || !data) {
    throw new Error(`Integration not found: ${integrationId}`);
  }
  
  return {
    id: data.id,
    orgId: data.org_id,
    provider: data.provider,
    status: data.status,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiresAt: data.token_expires_at ? new Date(data.token_expires_at) : undefined,
    scopes: data.scopes,
    accountId: data.account_id,
    accountName: data.account_name,
    metadata: data.metadata,
    lastSyncAt: data.last_sync_at ? new Date(data.last_sync_at) : undefined,
    lastError: data.last_error,
    errorCount: data.error_count || 0,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

async function updateIntegration(integrationId: string, updates: Partial<TrackingIntegration>): Promise<void> {
  const supabase = await createClient();
  
  const dbUpdates: Record<string, unknown> = {};
  if (updates.accessToken !== undefined) dbUpdates.access_token = updates.accessToken;
  if (updates.refreshToken !== undefined) dbUpdates.refresh_token = updates.refreshToken;
  if (updates.tokenExpiresAt !== undefined) dbUpdates.token_expires_at = updates.tokenExpiresAt?.toISOString();
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.accountId !== undefined) dbUpdates.account_id = updates.accountId;
  if (updates.accountName !== undefined) dbUpdates.account_name = updates.accountName;
  if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;
  if (updates.lastSyncAt !== undefined) dbUpdates.last_sync_at = updates.lastSyncAt?.toISOString();
  if (updates.lastError !== undefined) dbUpdates.last_error = updates.lastError;
  if (updates.errorCount !== undefined) dbUpdates.error_count = updates.errorCount;
  
  const { error } = await supabase
    .from('tracking_integrations')
    .update(dbUpdates)
    .eq('id', integrationId);
  
  if (error) {
    throw new Error(`Failed to update integration: ${error.message}`);
  }
}

async function makeGoogleAdsRequest(
  integration: TrackingIntegration,
  credentials: GoogleAdsCredentials,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }
  
  const url = `${GOOGLE_ADS_API_BASE}/${GOOGLE_ADS_API_VERSION}/${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${integration.accessToken}`,
    'developer-token': credentials.developerToken,
    'Content-Type': 'application/json',
  };
  
  // Add login-customer-id for manager accounts
  if (integration.metadata?.loginCustomerId) {
    headers['login-customer-id'] = String(integration.metadata.loginCustomerId);
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Google Ads API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const googleAdsMcpService: AdsMcpService = {
  /**
   * Generate OAuth authorization URL
   */
  async getAuthUrl(orgId: string, redirectUri: string): Promise<string> {
    const credentials = await getGoogleAdsCredentials(orgId);
    
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_ADS_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ orgId, provider: 'google_ads_mcp' }),
    });
    
    return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
  },
  
  /**
   * Handle OAuth callback and create integration
   */
  async handleCallback(orgId: string, code: string): Promise<TrackingIntegration> {
    const credentials = await getGoogleAdsCredentials(orgId);
    const supabase = await createClient();
    
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking-ai/callback/google-ads`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }
    
    const tokens = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    // Create or update integration
    const { data, error } = await supabase
      .from('tracking_integrations')
      .upsert({
        org_id: orgId,
        provider: 'google_ads_mcp',
        status: 'connected',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: GOOGLE_ADS_SCOPES,
        last_sync_at: new Date().toISOString(),
      }, {
        onConflict: 'org_id,provider,account_id',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save integration: ${error.message}`);
    }
    
    return {
      id: data.id,
      orgId: data.org_id,
      provider: data.provider,
      status: data.status,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt: new Date(data.token_expires_at),
      scopes: data.scopes,
      errorCount: 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
  
  /**
   * Refresh OAuth token
   */
  async refreshToken(integrationId: string): Promise<void> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: integration.refreshToken,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!tokenResponse.ok) {
      await updateIntegration(integrationId, {
        status: 'expired',
        lastError: 'Token refresh failed',
        errorCount: integration.errorCount + 1,
      });
      throw new Error('Token refresh failed');
    }
    
    const tokens = await tokenResponse.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    await updateIntegration(integrationId, {
      accessToken: tokens.access_token,
      tokenExpiresAt: expiresAt,
      status: 'connected',
      lastError: undefined,
    });
  },
  
  /**
   * List accessible Google Ads customers (accounts)
   */
  async listCustomers(integrationId: string): Promise<GoogleAdsCustomer[]> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    
    // Use the listAccessibleCustomers endpoint
    const response = await makeGoogleAdsRequest(
      integration,
      credentials,
      'customers:listAccessibleCustomers'
    ) as { resourceNames: string[] };
    
    const customers: GoogleAdsCustomer[] = [];
    
    for (const resourceName of response.resourceNames || []) {
      const customerId = resourceName.replace('customers/', '');
      try {
        const customer = await this.getCustomer(integrationId, customerId);
        customers.push(customer);
      } catch {
        // Skip customers we can't access
        console.warn(`Cannot access customer ${customerId}`);
      }
    }
    
    return customers;
  },
  
  /**
   * Get details for a specific customer
   */
  async getCustomer(integrationId: string, customerId: string): Promise<GoogleAdsCustomer> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    
    const query = `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account
      FROM customer
      WHERE customer.id = ${customerId}
    `;
    
    const response = await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${customerId}/googleAds:searchStream`,
      'POST',
      { query }
    ) as { results: Array<{ customer: Record<string, unknown> }> }[];
    
    const customerData = response[0]?.results?.[0]?.customer;
    if (!customerData) {
      throw new Error(`Customer not found: ${customerId}`);
    }
    
    return {
      customerId: String(customerData.id),
      descriptiveName: String(customerData.descriptiveName || ''),
      currencyCode: String(customerData.currencyCode || 'USD'),
      timeZone: String(customerData.timeZone || 'America/Los_Angeles'),
      isManager: Boolean(customerData.manager),
      canManageClients: Boolean(customerData.manager),
    };
  },
  
  /**
   * List conversion actions for a customer
   */
  async listConversionActions(integrationId: string, customerId: string): Promise<GoogleAdsConversionAction[]> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    
    const query = `
      SELECT
        conversion_action.id,
        conversion_action.resource_name,
        conversion_action.name,
        conversion_action.category,
        conversion_action.counting_type,
        conversion_action.value_settings.default_value,
        conversion_action.value_settings.default_currency_code,
        conversion_action.value_settings.always_use_default_value,
        conversion_action.attribution_model_settings.attribution_model,
        conversion_action.status
      FROM conversion_action
      WHERE conversion_action.status != 'REMOVED'
    `;
    
    const response = await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${customerId}/googleAds:searchStream`,
      'POST',
      { query }
    ) as { results: Array<{ conversionAction: Record<string, unknown> }> }[];
    
    const actions: GoogleAdsConversionAction[] = [];
    
    for (const batch of response) {
      for (const result of batch.results || []) {
        const ca = result.conversionAction as Record<string, unknown>;
        const valueSettings = ca.valueSettings as Record<string, unknown> | undefined;
        const attributionSettings = ca.attributionModelSettings as Record<string, unknown> | undefined;
        
        actions.push({
          id: String(ca.id),
          resourceName: String(ca.resourceName),
          customerId,
          name: String(ca.name),
          category: String(ca.category) as ConversionCategory,
          countingType: String(ca.countingType) as 'ONE_PER_CLICK' | 'MANY_PER_CLICK',
          valueSettings: {
            defaultValue: valueSettings?.defaultValue ? Number(valueSettings.defaultValue) : undefined,
            defaultCurrencyCode: valueSettings?.defaultCurrencyCode ? String(valueSettings.defaultCurrencyCode) : undefined,
            alwaysUseDefaultValue: Boolean(valueSettings?.alwaysUseDefaultValue),
          },
          attributionModel: String(attributionSettings?.attributionModel || 'GOOGLE_SEARCH_ATTRIBUTION_DATA_DRIVEN'),
          status: String(ca.status) as 'ENABLED' | 'REMOVED' | 'HIDDEN',
        });
      }
    }
    
    return actions;
  },
  
  /**
   * Get a specific conversion action
   */
  async getConversionAction(integrationId: string, customerId: string, conversionId: string): Promise<GoogleAdsConversionAction> {
    const actions = await this.listConversionActions(integrationId, customerId);
    const action = actions.find(a => a.id === conversionId);
    
    if (!action) {
      throw new Error(`Conversion action not found: ${conversionId}`);
    }
    
    return action;
  },
  
  /**
   * Create a new conversion action
   */
  async createConversionAction(integrationId: string, input: CreateConversionActionInput): Promise<GoogleAdsConversionAction> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    const supabase = await createClient();
    
    const operation = {
      create: {
        name: input.name,
        category: input.category,
        countingType: input.countingType || 'ONE_PER_CLICK',
        valueSettings: {
          defaultValue: input.defaultValue,
          defaultCurrencyCode: input.currencyCode || 'USD',
          alwaysUseDefaultValue: !input.defaultValue,
        },
        type: 'WEBPAGE',
        status: 'ENABLED',
      },
    };
    
    const response = await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${input.customerId}/conversionActions:mutate`,
      'POST',
      { operations: [operation] }
    ) as { results: Array<{ resourceName: string }> };
    
    const resourceName = response.results?.[0]?.resourceName;
    if (!resourceName) {
      throw new Error('Failed to create conversion action');
    }
    
    // Extract ID from resource name
    const conversionId = resourceName.split('/').pop() || '';
    
    // Save to database
    await supabase.from('ads_conversion_actions').insert({
      org_id: integration.orgId,
      integration_id: integrationId,
      google_ads_id: resourceName,
      customer_id: input.customerId,
      name: input.name,
      category: input.category,
      counting_type: input.countingType || 'ONE_PER_CLICK',
      value_settings: {
        defaultValue: input.defaultValue,
        defaultCurrencyCode: input.currencyCode || 'USD',
      },
      status: 'ENABLED',
    });
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_conversion_action',
      resource_type: 'conversion_action',
      after_state: { resourceName, ...input },
      success: true,
    });
    
    return this.getConversionAction(integrationId, input.customerId, conversionId);
  },
  
  /**
   * Update an existing conversion action
   */
  async updateConversionAction(
    integrationId: string,
    customerId: string,
    conversionId: string,
    updates: Partial<CreateConversionActionInput>
  ): Promise<GoogleAdsConversionAction> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    const supabase = await createClient();
    
    const resourceName = `customers/${customerId}/conversionActions/${conversionId}`;
    
    const updateMask: string[] = [];
    const updateFields: Record<string, unknown> = {};
    
    if (updates.name) {
      updateFields.name = updates.name;
      updateMask.push('name');
    }
    if (updates.category) {
      updateFields.category = updates.category;
      updateMask.push('category');
    }
    if (updates.countingType) {
      updateFields.countingType = updates.countingType;
      updateMask.push('counting_type');
    }
    if (updates.defaultValue !== undefined) {
      updateFields.valueSettings = {
        defaultValue: updates.defaultValue,
        defaultCurrencyCode: updates.currencyCode || 'USD',
      };
      updateMask.push('value_settings');
    }
    
    const operation = {
      update: {
        resourceName,
        ...updateFields,
      },
      updateMask: updateMask.join(','),
    };
    
    await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${customerId}/conversionActions:mutate`,
      'POST',
      { operations: [operation] }
    );
    
    // Update database
    await supabase
      .from('ads_conversion_actions')
      .update({
        name: updates.name,
        category: updates.category,
        counting_type: updates.countingType,
        value_settings: updates.defaultValue !== undefined ? {
          defaultValue: updates.defaultValue,
          defaultCurrencyCode: updates.currencyCode || 'USD',
        } : undefined,
      })
      .eq('google_ads_id', resourceName);
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'update_conversion_action',
      resource_type: 'conversion_action',
      after_state: updates,
      success: true,
    });
    
    return this.getConversionAction(integrationId, customerId, conversionId);
  },
  
  /**
   * Link GA4 property to Google Ads
   */
  async linkGa4Property(integrationId: string, customerId: string, ga4PropertyId: string): Promise<void> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    const supabase = await createClient();
    
    // Create Google Analytics link in Google Ads
    const operation = {
      create: {
        googleAnalyticsLink: {
          propertyId: ga4PropertyId.replace('properties/', ''),
        },
      },
    };
    
    await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${customerId}/googleAnalyticsLinks:mutate`,
      'POST',
      { operations: [operation] }
    );
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'link_ga4_property',
      resource_type: 'google_analytics_link',
      after_state: { customerId, ga4PropertyId },
      success: true,
    });
  },
  
  /**
   * Get conversion statistics
   */
  async getConversionStats(integrationId: string, customerId: string, conversionId: string): Promise<{ conversions: number; value: number }> {
    const integration = await getIntegration(integrationId);
    const credentials = await getGoogleAdsCredentials(integration.orgId);
    
    const query = `
      SELECT
        metrics.conversions,
        metrics.conversions_value
      FROM conversion_action
      WHERE conversion_action.id = ${conversionId}
        AND segments.date DURING LAST_30_DAYS
    `;
    
    const response = await makeGoogleAdsRequest(
      integration,
      credentials,
      `customers/${customerId}/googleAds:searchStream`,
      'POST',
      { query }
    ) as { results: Array<{ metrics: { conversions: number; conversionsValue: number } }> }[];
    
    let totalConversions = 0;
    let totalValue = 0;
    
    for (const batch of response) {
      for (const result of batch.results || []) {
        totalConversions += result.metrics?.conversions || 0;
        totalValue += result.metrics?.conversionsValue || 0;
      }
    }
    
    return { conversions: totalConversions, value: totalValue };
  },
  
  /**
   * Validate account permissions
   */
  async validatePermissions(integrationId: string, customerId: string): Promise<{ valid: boolean; missingPermissions: string[] }> {
    try {
      // Try to list conversion actions - this requires write access
      await this.listConversionActions(integrationId, customerId);
      return { valid: true, missingPermissions: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      if (message.includes('PERMISSION_DENIED')) {
        return {
          valid: false,
          missingPermissions: ['CONVERSION_ACTION_WRITE', 'CONVERSION_ACTION_READ'],
        };
      }
      
      return { valid: false, missingPermissions: ['UNKNOWN'] };
    }
  },
};

export default googleAdsMcpService;
