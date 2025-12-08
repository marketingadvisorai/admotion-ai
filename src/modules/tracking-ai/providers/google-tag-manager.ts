/**
 * Google Tag Manager API Service
 * Manages GTM containers, tags, triggers, and variables
 */

import { createClient } from '@/lib/db/server';
import { TrackingIntegration } from '../types';

// ============================================
// CONSTANTS
// ============================================

const GTM_API_BASE = 'https://www.googleapis.com/tagmanager/v2';
const GTM_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GTM_TOKEN_URL = 'https://oauth2.googleapis.com/token';

const GTM_SCOPES = [
  'https://www.googleapis.com/auth/tagmanager.edit.containers',
  'https://www.googleapis.com/auth/tagmanager.manage.accounts',
  'https://www.googleapis.com/auth/tagmanager.publish',
];

// ============================================
// TYPES
// ============================================

export interface GTMAccount {
  accountId: string;
  name: string;
  path: string;
}

export interface GTMContainer {
  containerId: string;
  accountId: string;
  name: string;
  publicId: string;
  path: string;
  domainName?: string[];
  usageContext: string[];
}

export interface GTMWorkspace {
  workspaceId: string;
  containerId: string;
  name: string;
  path: string;
}

export interface GTMTag {
  tagId: string;
  name: string;
  type: string;
  path: string;
  firingTriggerId?: string[];
  blockingTriggerId?: string[];
  parameter?: GTMParameter[];
  paused?: boolean;
}

export interface GTMTrigger {
  triggerId: string;
  name: string;
  type: string;
  path: string;
  filter?: GTMCondition[];
  customEventFilter?: GTMCondition[];
}

export interface GTMVariable {
  variableId: string;
  name: string;
  type: string;
  path: string;
  parameter?: GTMParameter[];
}

interface GTMParameter {
  type: string;
  key: string;
  value?: string;
  list?: GTMParameter[];
  map?: GTMParameter[];
}

interface GTMCondition {
  type: string;
  parameter: GTMParameter[];
}

export interface CreateGTMTagInput {
  containerId: string;
  workspaceId: string;
  name: string;
  type: string;
  firingTriggerId?: string[];
  parameter?: GTMParameter[];
}

export interface CreateGTMTriggerInput {
  containerId: string;
  workspaceId: string;
  name: string;
  type: string;
  filter?: GTMCondition[];
  customEventFilter?: GTMCondition[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

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

async function updateIntegrationTokens(
  integrationId: string,
  accessToken: string,
  refreshToken: string,
  expiresIn: number
): Promise<void> {
  const supabase = await createClient();
  
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  
  await supabase
    .from('tracking_integrations')
    .update({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_expires_at: tokenExpiresAt.toISOString(),
      status: 'connected',
      last_error: null,
      error_count: 0,
    })
    .eq('id', integrationId);
}

async function makeGTMRequest(
  integration: TrackingIntegration,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: unknown
): Promise<unknown> {
  const response = await fetch(`${GTM_API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${integration.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `GTM API error: ${response.status} - ${JSON.stringify(errorData)}`
    );
  }
  
  return response.json();
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const googleTagManagerService = {
  /**
   * Get OAuth URL for GTM authorization
   */
  async getAuthUrl(orgId: string, redirectUri: string): Promise<string> {
    const clientId = process.env.GOOGLE_GTM_CLIENT_ID;
    
    if (!clientId) {
      throw new Error('GOOGLE_GTM_CLIENT_ID not configured');
    }
    
    const state = JSON.stringify({ orgId });
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: GTM_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });
    
    return `${GTM_AUTH_URL}?${params.toString()}`;
  },
  
  /**
   * Handle OAuth callback
   */
  async handleCallback(orgId: string, code: string): Promise<TrackingIntegration> {
    const supabase = await createClient();
    
    const clientId = process.env.GOOGLE_GTM_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_GTM_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking-ai/callback/google-gtm`;
    
    if (!clientId || !clientSecret) {
      throw new Error('GTM OAuth credentials not configured');
    }
    
    // Exchange code for tokens
    const tokenResponse = await fetch(GTM_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      throw new Error(`Token exchange failed: ${JSON.stringify(error)}`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Create or update integration
    const { data: integration, error } = await supabase
      .from('tracking_integrations')
      .upsert({
        org_id: orgId,
        provider: 'google_tag_manager',
        status: 'connected',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        scopes: GTM_SCOPES,
      }, {
        onConflict: 'org_id,provider,account_id',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save integration: ${error.message}`);
    }
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: orgId,
      actor_type: 'user',
      action: 'connect_gtm',
      resource_type: 'integration',
      resource_id: integration.id,
      success: true,
    });
    
    return {
      id: integration.id,
      orgId: integration.org_id,
      provider: integration.provider,
      status: integration.status,
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      tokenExpiresAt: new Date(integration.token_expires_at),
      scopes: integration.scopes,
      createdAt: new Date(integration.created_at),
      updatedAt: new Date(integration.updated_at),
      errorCount: 0,
    };
  },
  
  /**
   * Refresh access token
   */
  async refreshToken(integrationId: string): Promise<void> {
    const integration = await getIntegration(integrationId);
    
    if (!integration.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const clientId = process.env.GOOGLE_GTM_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_GTM_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('GTM OAuth credentials not configured');
    }
    
    const response = await fetch(GTM_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    const tokens = await response.json();
    
    await updateIntegrationTokens(
      integrationId,
      tokens.access_token,
      integration.refreshToken,
      tokens.expires_in
    );
  },
  
  /**
   * List GTM accounts
   */
  async listAccounts(integrationId: string): Promise<GTMAccount[]> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGTMRequest(integration, '/accounts') as {
      account?: Array<{
        accountId: string;
        name: string;
        path: string;
      }>;
    };
    
    return (response.account || []).map(account => ({
      accountId: account.accountId,
      name: account.name,
      path: account.path,
    }));
  },
  
  /**
   * List containers in an account
   */
  async listContainers(integrationId: string, accountId: string): Promise<GTMContainer[]> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers`
    ) as {
      container?: Array<{
        containerId: string;
        accountId: string;
        name: string;
        publicId: string;
        path: string;
        domainName?: string[];
        usageContext: string[];
      }>;
    };
    
    return (response.container || []).map(container => ({
      containerId: container.containerId,
      accountId: container.accountId,
      name: container.name,
      publicId: container.publicId,
      path: container.path,
      domainName: container.domainName,
      usageContext: container.usageContext,
    }));
  },
  
  /**
   * List workspaces in a container
   */
  async listWorkspaces(
    integrationId: string,
    accountId: string,
    containerId: string
  ): Promise<GTMWorkspace[]> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers/${containerId}/workspaces`
    ) as {
      workspace?: Array<{
        workspaceId: string;
        containerId: string;
        name: string;
        path: string;
      }>;
    };
    
    return (response.workspace || []).map(ws => ({
      workspaceId: ws.workspaceId,
      containerId: ws.containerId,
      name: ws.name,
      path: ws.path,
    }));
  },
  
  /**
   * List tags in a workspace
   */
  async listTags(
    integrationId: string,
    accountId: string,
    containerId: string,
    workspaceId: string
  ): Promise<GTMTag[]> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`
    ) as {
      tag?: Array<{
        tagId: string;
        name: string;
        type: string;
        path: string;
        firingTriggerId?: string[];
        blockingTriggerId?: string[];
        parameter?: GTMParameter[];
        paused?: boolean;
      }>;
    };
    
    return (response.tag || []).map(tag => ({
      tagId: tag.tagId,
      name: tag.name,
      type: tag.type,
      path: tag.path,
      firingTriggerId: tag.firingTriggerId,
      blockingTriggerId: tag.blockingTriggerId,
      parameter: tag.parameter,
      paused: tag.paused,
    }));
  },
  
  /**
   * List triggers in a workspace
   */
  async listTriggers(
    integrationId: string,
    accountId: string,
    containerId: string,
    workspaceId: string
  ): Promise<GTMTrigger[]> {
    const integration = await getIntegration(integrationId);
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`
    ) as {
      trigger?: Array<{
        triggerId: string;
        name: string;
        type: string;
        path: string;
        filter?: GTMCondition[];
        customEventFilter?: GTMCondition[];
      }>;
    };
    
    return (response.trigger || []).map(trigger => ({
      triggerId: trigger.triggerId,
      name: trigger.name,
      type: trigger.type,
      path: trigger.path,
      filter: trigger.filter,
      customEventFilter: trigger.customEventFilter,
    }));
  },
  
  /**
   * Create a new tag
   */
  async createTag(integrationId: string, input: CreateGTMTagInput): Promise<GTMTag> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    // Get workspace path
    const accounts = await this.listAccounts(integrationId);
    const account = accounts[0]; // Assume first account for now
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${account.accountId}/containers/${input.containerId}/workspaces/${input.workspaceId}/tags`,
      'POST',
      {
        name: input.name,
        type: input.type,
        firingTriggerId: input.firingTriggerId,
        parameter: input.parameter,
      }
    ) as {
      tagId: string;
      name: string;
      type: string;
      path: string;
      firingTriggerId?: string[];
      parameter?: GTMParameter[];
    };
    
    // Save to database
    await supabase.from('gtm_tag_configs').insert({
      org_id: integration.orgId,
      integration_id: integrationId,
      container_id: input.containerId,
      tag_id: response.tagId,
      name: response.name,
      type: response.type,
      config: input.parameter,
      trigger_ids: input.firingTriggerId,
      status: 'active',
    });
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_gtm_tag',
      resource_type: 'gtm_tag',
      resource_id: response.tagId,
      after_state: response,
      success: true,
    });
    
    return {
      tagId: response.tagId,
      name: response.name,
      type: response.type,
      path: response.path,
      firingTriggerId: response.firingTriggerId,
      parameter: response.parameter,
    };
  },
  
  /**
   * Create a new trigger
   */
  async createTrigger(integrationId: string, input: CreateGTMTriggerInput): Promise<GTMTrigger> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    const accounts = await this.listAccounts(integrationId);
    const account = accounts[0];
    
    const response = await makeGTMRequest(
      integration,
      `/accounts/${account.accountId}/containers/${input.containerId}/workspaces/${input.workspaceId}/triggers`,
      'POST',
      {
        name: input.name,
        type: input.type,
        filter: input.filter,
        customEventFilter: input.customEventFilter,
      }
    ) as {
      triggerId: string;
      name: string;
      type: string;
      path: string;
      filter?: GTMCondition[];
      customEventFilter?: GTMCondition[];
    };
    
    // Save to database
    await supabase.from('gtm_trigger_configs').insert({
      org_id: integration.orgId,
      integration_id: integrationId,
      container_id: input.containerId,
      trigger_id: response.triggerId,
      name: response.name,
      type: input.type,
      conditions: input.filter || input.customEventFilter,
      status: 'active',
    });
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'create_gtm_trigger',
      resource_type: 'gtm_trigger',
      resource_id: response.triggerId,
      after_state: response,
      success: true,
    });
    
    return {
      triggerId: response.triggerId,
      name: response.name,
      type: response.type,
      path: response.path,
      filter: response.filter,
      customEventFilter: response.customEventFilter,
    };
  },
  
  /**
   * Create a GA4 event tag
   */
  async createGA4EventTag(
    integrationId: string,
    containerId: string,
    workspaceId: string,
    eventName: string,
    measurementId: string,
    triggerId: string
  ): Promise<GTMTag> {
    return this.createTag(integrationId, {
      containerId,
      workspaceId,
      name: `GA4 Event - ${eventName}`,
      type: 'gaawc', // GA4 Event tag type
      firingTriggerId: [triggerId],
      parameter: [
        {
          type: 'template',
          key: 'eventName',
          value: eventName,
        },
        {
          type: 'template',
          key: 'measurementId',
          value: measurementId,
        },
      ],
    });
  },
  
  /**
   * Create a Google Ads conversion tag
   */
  async createAdsConversionTag(
    integrationId: string,
    containerId: string,
    workspaceId: string,
    conversionId: string,
    conversionLabel: string,
    triggerId: string
  ): Promise<GTMTag> {
    return this.createTag(integrationId, {
      containerId,
      workspaceId,
      name: `Google Ads Conversion - ${conversionLabel}`,
      type: 'awct', // Google Ads Conversion Tracking tag type
      firingTriggerId: [triggerId],
      parameter: [
        {
          type: 'template',
          key: 'conversionId',
          value: conversionId,
        },
        {
          type: 'template',
          key: 'conversionLabel',
          value: conversionLabel,
        },
      ],
    });
  },
  
  /**
   * Create a page view trigger
   */
  async createPageViewTrigger(
    integrationId: string,
    containerId: string,
    workspaceId: string,
    name: string,
    urlPattern?: string
  ): Promise<GTMTrigger> {
    const filter = urlPattern
      ? [
          {
            type: 'contains',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{Page URL}}' },
              { type: 'template', key: 'arg1', value: urlPattern },
            ],
          },
        ]
      : undefined;
    
    return this.createTrigger(integrationId, {
      containerId,
      workspaceId,
      name,
      type: 'pageview',
      filter,
    });
  },
  
  /**
   * Create a form submission trigger
   */
  async createFormSubmitTrigger(
    integrationId: string,
    containerId: string,
    workspaceId: string,
    name: string,
    formSelector?: string
  ): Promise<GTMTrigger> {
    const filter = formSelector
      ? [
          {
            type: 'cssSelector',
            parameter: [
              { type: 'template', key: 'arg0', value: '{{Form Element}}' },
              { type: 'template', key: 'arg1', value: formSelector },
            ],
          },
        ]
      : undefined;
    
    return this.createTrigger(integrationId, {
      containerId,
      workspaceId,
      name,
      type: 'formSubmission',
      filter,
    });
  },
  
  /**
   * Create a custom event trigger
   */
  async createCustomEventTrigger(
    integrationId: string,
    containerId: string,
    workspaceId: string,
    name: string,
    eventName: string
  ): Promise<GTMTrigger> {
    return this.createTrigger(integrationId, {
      containerId,
      workspaceId,
      name,
      type: 'customEvent',
      customEventFilter: [
        {
          type: 'equals',
          parameter: [
            { type: 'template', key: 'arg0', value: '{{_event}}' },
            { type: 'template', key: 'arg1', value: eventName },
          ],
        },
      ],
    });
  },
  
  /**
   * Publish container changes
   */
  async publishContainer(
    integrationId: string,
    accountId: string,
    containerId: string,
    workspaceId: string,
    versionName: string
  ): Promise<void> {
    const integration = await getIntegration(integrationId);
    const supabase = await createClient();
    
    // Create version
    const versionResponse = await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}:create_version`,
      'POST',
      {
        name: versionName,
        notes: `Published by Tracking AI on ${new Date().toISOString()}`,
      }
    ) as { containerVersion?: { containerVersionId: string } };
    
    if (!versionResponse.containerVersion) {
      throw new Error('Failed to create container version');
    }
    
    // Publish version
    await makeGTMRequest(
      integration,
      `/accounts/${accountId}/containers/${containerId}/versions/${versionResponse.containerVersion.containerVersionId}:publish`,
      'POST'
    );
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: integration.orgId,
      actor_type: 'system',
      action: 'publish_gtm_container',
      resource_type: 'gtm_container',
      resource_id: containerId,
      after_state: { versionName, versionId: versionResponse.containerVersion.containerVersionId },
      success: true,
    });
  },
};

export default googleTagManagerService;
