/**
 * Google Analytics MCP Service
 * Based on: https://github.com/googleanalytics/google-analytics-mcp
 * 
 * Implements MCP runtime for Google Analytics Admin & Data API interactions
 */

import { createClient } from '@/lib/db/server';
import {
  AnalyticsMcpService,
  TrackingIntegration,
  GA4Account,
  GA4Property,
  GA4DataStream,
  GA4Event,
  GA4EventParameter,
  GA4GoogleAdsLink,
  CreateGA4EventInput,
  GoogleAnalyticsCredentials,
} from '../types';

// ============================================
// CONSTANTS
// ============================================

const GA_ADMIN_API_BASE = 'https://analyticsadmin.googleapis.com/v1beta';
const GA_DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_OAUTH_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

const GOOGLE_ANALYTICS_SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/analytics.edit',
];

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getGoogleAnalyticsCredentials(orgId: string): Promise<GoogleAnalyticsCredentials> {
  const supabase = await createClient();
  
  const secretNames = ['GOOGLE_ANALYTICS_CLIENT_ID', 'GOOGLE_ANALYTICS_CLIENT_SECRET'];
  const { data: secrets } = await supabase
    .from('organization_secrets')
    .select('name, value')
    .eq('org_id', orgId)
    .in('name', secretNames);
  
  const secretMap = new Map(secrets?.map(s => [s.name, s.value]) || []);
  
  return {
    clientId: secretMap.get('GOOGLE_ANALYTICS_CLIENT_ID') || process.env.GOOGLE_ANALYTICS_CLIENT_ID || '',
    clientSecret: secretMap.get('GOOGLE_ANALYTICS_CLIENT_SECRET') || process.env.GOOGLE_ANALYTICS_CLIENT_SECRET || '',
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

async function makeGAAdminRequest(
  integration: TrackingIntegration,
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: Record<string, unknown>
): Promise<unknown> {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }
  
  const url = `${GA_ADMIN_API_BASE}/${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`GA Admin API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

async function makeGADataRequest(
  integration: TrackingIntegration,
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: Record<string, unknown>
): Promise<unknown> {
  if (!integration.accessToken) {
    throw new Error('No access token available');
  }
  
  const url = `${GA_DATA_API_BASE}/${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`GA Data API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  return response.json();
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const googleAnalyticsMcpService: AnalyticsMcpService = {
  /**
   * Generate OAuth authorization URL
   */
  async getAuthUrl(orgId: string, redirectUri: string): Promise<string> {
    const credentials = await getGoogleAnalyticsCredentials(orgId);
    
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GOOGLE_ANALYTICS_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ orgId, provider: 'google_analytics_mcp' }),
    });
    
    return `${GOOGLE_OAUTH_AUTH_URL}?${params.toString()}`;
  },
  
  /**
   * Handle OAuth callback and create integration
   */
  async handleCallback(orgId: string, code: string): Promise<TrackingIntegration> {
    const credentials = await getGoogleAnalyticsCredentials(orgId);
    const supabase = await createClient();
    
    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking-ai/callback/google-analytics`,
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
        provider: 'google_analytics_mcp',
        status: 'connected',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt.toISOString(),
        scopes: GOOGLE_ANALYTICS_SCOPES,
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
    const credentials = await getGoogleAnalyticsCredentials(integration.orgId);
    
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
   * List account summaries (accounts and properties)
   */
  async listAccountSummaries(integrationId: string): Promise<{ accounts: GA4Account[]; properties: GA4Property[] }> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGAAdminRequest(
      integration,
      'accountSummaries'
    ) as { accountSummaries: Array<{ account: string; displayName: string; propertySummaries?: Array<{ property: string; displayName: string }> }> };
    
    const accounts: GA4Account[] = [];
    const properties: GA4Property[] = [];
    
    for (const summary of response.accountSummaries || []) {
      accounts.push({
        name: summary.account,
        displayName: summary.displayName,
        createTime: '',
        updateTime: '',
      });
      
      for (const propSummary of summary.propertySummaries || []) {
        properties.push({
          name: propSummary.property,
          displayName: propSummary.displayName,
          propertyType: 'PROPERTY_TYPE_ORDINARY',
          createTime: '',
          updateTime: '',
          timeZone: 'America/Los_Angeles',
          currencyCode: 'USD',
        });
      }
    }
    
    return { accounts, properties };
  },
  
  /**
   * Get property details
   */
  async getPropertyDetails(integrationId: string, propertyId: string): Promise<GA4Property> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGAAdminRequest(
      integration,
      propertyName
    ) as Record<string, unknown>;
    
    return {
      name: String(response.name),
      displayName: String(response.displayName),
      propertyType: String(response.propertyType) as GA4Property['propertyType'],
      createTime: String(response.createTime),
      updateTime: String(response.updateTime),
      parent: response.parent ? String(response.parent) : undefined,
      timeZone: String(response.timeZone),
      currencyCode: String(response.currencyCode),
      industryCategory: response.industryCategory ? String(response.industryCategory) : undefined,
    };
  },
  
  /**
   * List data streams for a property
   */
  async listDataStreams(integrationId: string, propertyId: string): Promise<GA4DataStream[]> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGAAdminRequest(
      integration,
      `${propertyName}/dataStreams`
    ) as { dataStreams: Array<Record<string, unknown>> };
    
    return (response.dataStreams || []).map(ds => {
      const webStreamData = ds.webStreamData as Record<string, unknown> | undefined;
      return {
        name: String(ds.name),
        type: String(ds.type) as GA4DataStream['type'],
        displayName: String(ds.displayName),
        webStreamData: webStreamData ? {
          measurementId: String(webStreamData.measurementId),
          firebaseAppId: webStreamData.firebaseAppId ? String(webStreamData.firebaseAppId) : undefined,
          defaultUri: String(webStreamData.defaultUri),
        } : undefined,
        createTime: String(ds.createTime),
        updateTime: String(ds.updateTime),
      };
    });
  },
  
  /**
   * List events for a property (using Data API)
   */
  async listEvents(integrationId: string, propertyId: string): Promise<GA4Event[]> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    // Get events from last 7 days using Data API
    const response = await makeGADataRequest(
      integration,
      `${propertyName}:runReport`,
      'POST',
      {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        limit: 100,
      }
    ) as { rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }> };
    
    const events: GA4Event[] = [];
    
    for (const row of response.rows || []) {
      const eventName = row.dimensionValues[0]?.value;
      const eventCount = parseInt(row.metricValues[0]?.value || '0', 10);
      
      if (eventName) {
        // Check if we have this event in our database
        const { data: existingEvent } = await supabase
          .from('ga4_events')
          .select('*')
          .eq('integration_id', integrationId)
          .eq('property_id', propertyId.replace('properties/', ''))
          .eq('event_name', eventName)
          .single();
        
        events.push({
          id: existingEvent?.id || '',
          propertyId: propertyId.replace('properties/', ''),
          eventName,
          eventType: isRecommendedEvent(eventName) ? 'recommended' : 
                     isAutomaticEvent(eventName) ? 'automatically_collected' : 'custom',
          parameters: existingEvent?.parameters || [],
          isConversion: existingEvent?.is_conversion || false,
          countingMethod: existingEvent?.counting_method || 'ONCE_PER_EVENT',
          eventCountLast7d: eventCount,
          lastReceivedAt: new Date(),
        });
      }
    }
    
    return events;
  },
  
  /**
   * Create a custom event definition
   */
  async createCustomEvent(integrationId: string, input: CreateGA4EventInput): Promise<GA4Event> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    // Save to database (GA4 custom events are defined by sending them)
    const { data, error } = await supabase
      .from('ga4_events')
      .insert({
        org_id: integration.orgId,
        integration_id: integrationId,
        property_id: input.propertyId.replace('properties/', ''),
        event_name: input.eventName,
        event_type: 'custom',
        parameters: input.parameters || [],
        is_conversion: input.markAsConversion || false,
        counting_method: 'ONCE_PER_EVENT',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }
    
    // If marking as conversion, update in GA4
    if (input.markAsConversion) {
      await this.markEventAsConversion(integrationId, input.propertyId, input.eventName, true);
    }
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_ga4_event',
      resource_type: 'ga4_event',
      resource_id: data.id,
      after_state: input,
      success: true,
    });
    
    return {
      id: data.id,
      propertyId: data.property_id,
      eventName: data.event_name,
      eventType: 'custom',
      parameters: data.parameters,
      isConversion: data.is_conversion,
      countingMethod: data.counting_method,
    };
  },
  
  /**
   * Mark an event as a conversion
   */
  async markEventAsConversion(integrationId: string, propertyId: string, eventName: string, isConversion: boolean): Promise<void> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    if (isConversion) {
      // Create conversion event
      await makeGAAdminRequest(
        integration,
        `${propertyName}/conversionEvents`,
        'POST',
        { eventName }
      );
    } else {
      // Delete conversion event
      await makeGAAdminRequest(
        integration,
        `${propertyName}/conversionEvents/${eventName}`,
        'DELETE'
      );
    }
    
    // Update database
    await supabase
      .from('ga4_events')
      .update({ is_conversion: isConversion })
      .eq('integration_id', integrationId)
      .eq('property_id', propertyId.replace('properties/', ''))
      .eq('event_name', eventName);
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: isConversion ? 'mark_event_as_conversion' : 'unmark_event_as_conversion',
      resource_type: 'ga4_event',
      after_state: { propertyId, eventName, isConversion },
      success: true,
    });
  },
  
  /**
   * List custom dimensions
   */
  async listCustomDimensions(integrationId: string, propertyId: string): Promise<GA4EventParameter[]> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGAAdminRequest(
      integration,
      `${propertyName}/customDimensions`
    ) as { customDimensions: Array<Record<string, unknown>> };
    
    return (response.customDimensions || []).map(cd => ({
      name: String(cd.parameterName),
      type: 'string' as const,
      scope: String(cd.scope).toLowerCase() as 'event' | 'user',
      description: cd.description ? String(cd.description) : undefined,
    }));
  },
  
  /**
   * Create a custom dimension
   */
  async createCustomDimension(integrationId: string, propertyId: string, dimension: GA4EventParameter): Promise<void> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    await makeGAAdminRequest(
      integration,
      `${propertyName}/customDimensions`,
      'POST',
      {
        parameterName: dimension.name,
        displayName: dimension.name,
        description: dimension.description || '',
        scope: dimension.scope.toUpperCase(),
      }
    );
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_custom_dimension',
      resource_type: 'custom_dimension',
      after_state: { propertyId, dimension },
      success: true,
    });
  },
  
  /**
   * List Google Ads links
   */
  async listGoogleAdsLinks(integrationId: string, propertyId: string): Promise<GA4GoogleAdsLink[]> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGAAdminRequest(
      integration,
      `${propertyName}/googleAdsLinks`
    ) as { googleAdsLinks: Array<Record<string, unknown>> };
    
    return (response.googleAdsLinks || []).map(link => ({
      name: String(link.name),
      customerId: String(link.customerId),
      canManageClients: Boolean(link.canManageClients),
      adsPersonalizationEnabled: Boolean(link.adsPersonalizationEnabled),
      createTime: String(link.createTime),
      updateTime: String(link.updateTime),
    }));
  },
  
  /**
   * Create a Google Ads link
   */
  async createGoogleAdsLink(integrationId: string, propertyId: string, customerId: string): Promise<GA4GoogleAdsLink> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGAAdminRequest(
      integration,
      `${propertyName}/googleAdsLinks`,
      'POST',
      {
        customerId: customerId.replace(/-/g, ''),
        adsPersonalizationEnabled: true,
      }
    ) as Record<string, unknown>;
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_google_ads_link',
      resource_type: 'google_ads_link',
      after_state: { propertyId, customerId },
      success: true,
    });
    
    return {
      name: String(response.name),
      customerId: String(response.customerId),
      canManageClients: Boolean(response.canManageClients),
      adsPersonalizationEnabled: Boolean(response.adsPersonalizationEnabled),
      createTime: String(response.createTime),
      updateTime: String(response.updateTime),
    };
  },
  
  /**
   * Run a report
   */
  async runReport(integrationId: string, propertyId: string, config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGADataRequest(
      integration,
      `${propertyName}:runReport`,
      'POST',
      config
    );
    
    return response as Record<string, unknown>;
  },
  
  /**
   * Run a realtime report
   */
  async runRealtimeReport(integrationId: string, propertyId: string, config: Record<string, unknown>): Promise<Record<string, unknown>> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    const response = await makeGADataRequest(
      integration,
      `${propertyName}:runRealtimeReport`,
      'POST',
      config
    );
    
    return response as Record<string, unknown>;
  },
  
  /**
   * Validate event receipt
   */
  async validateEventReceipt(integrationId: string, propertyId: string, eventName: string): Promise<{ received: boolean; lastReceivedAt?: Date }> {
    const integration = await getIntegration(integrationId);
    
    const propertyName = propertyId.startsWith('properties/') ? propertyId : `properties/${propertyId}`;
    
    // Check realtime report for recent events
    const response = await makeGADataRequest(
      integration,
      `${propertyName}:runRealtimeReport`,
      'POST',
      {
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: eventName },
          },
        },
      }
    ) as { rows?: Array<{ metricValues: Array<{ value: string }> }> };
    
    const hasRecentEvents = (response.rows?.length || 0) > 0;
    
    return {
      received: hasRecentEvents,
      lastReceivedAt: hasRecentEvents ? new Date() : undefined,
    };
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isRecommendedEvent(eventName: string): boolean {
  const recommendedEvents = [
    'add_payment_info', 'add_shipping_info', 'add_to_cart', 'add_to_wishlist',
    'begin_checkout', 'earn_virtual_currency', 'generate_lead', 'join_group',
    'level_end', 'level_start', 'level_up', 'login', 'post_score', 'purchase',
    'refund', 'remove_from_cart', 'search', 'select_content', 'select_item',
    'select_promotion', 'share', 'sign_up', 'spend_virtual_currency',
    'tutorial_begin', 'tutorial_complete', 'unlock_achievement', 'view_cart',
    'view_item', 'view_item_list', 'view_promotion', 'view_search_results',
  ];
  return recommendedEvents.includes(eventName);
}

function isAutomaticEvent(eventName: string): boolean {
  const automaticEvents = [
    'first_visit', 'session_start', 'user_engagement', 'page_view',
    'scroll', 'click', 'view_search_results', 'video_start', 'video_progress',
    'video_complete', 'file_download', 'form_start', 'form_submit',
  ];
  return automaticEvents.includes(eventName);
}

export default googleAnalyticsMcpService;
