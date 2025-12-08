/**
 * Facebook Conversions API (CAPI) Service
 * Handles server-side event sending to Facebook
 */

import { createClient } from '@/lib/db/server';
import { facebookAuthService } from './auth-service';
import {
  buildHashedUserData,
  generateEventId,
  validateEventPayload,
  type RawUserData,
} from './utils';
import type {
  FacebookCapiSettings,
  FacebookCapiRequest,
  FacebookCapiResponse,
  FacebookEventPayload,
  FacebookServerEvent,
  SendCapiEventInput,
  FacebookActionSource,
} from './types';

// ============================================
// CONSTANTS
// ============================================

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const facebookCapiService = {
  /**
   * Send a single event via Conversions API
   */
  async sendEvent(
    integrationId: string,
    input: SendCapiEventInput
  ): Promise<FacebookCapiResponse> {
    return this.sendBatchEvents(integrationId, [input]);
  },
  
  /**
   * Send multiple events in a batch
   */
  async sendBatchEvents(
    integrationId: string,
    events: SendCapiEventInput[]
  ): Promise<FacebookCapiResponse> {
    const supabase = await createClient();
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    if (!integration.pixelId) {
      throw new Error('No pixel selected for this integration');
    }
    
    // Get CAPI settings
    const { data: capiSettings } = await supabase
      .from('facebook_capi_settings')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('pixel_id', integration.pixelId)
      .single();
    
    // Use system access token if CAPI token not set
    const accessToken = capiSettings?.access_token || integration.accessToken;
    
    // Build event payloads
    const payloads: FacebookEventPayload[] = [];
    
    for (const event of events) {
      const eventId = event.eventId || generateEventId();
      const eventTime = event.eventTime || Math.floor(Date.now() / 1000);
      
      // Hash user data if raw data provided
      const userData = event.userData ? 
        (this.isRawUserData(event.userData) 
          ? buildHashedUserData(event.userData as unknown as RawUserData)
          : event.userData
        ) : {};
      
      const payload: FacebookEventPayload = {
        event_name: event.eventName,
        event_time: eventTime,
        event_id: eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource || 'website',
        user_data: userData,
        custom_data: event.customData,
      };
      
      // Validate payload
      const validation = validateEventPayload(payload);
      if (!validation.valid) {
        console.warn('Event validation warnings:', validation.errors);
      }
      
      payloads.push(payload);
    }
    
    // Build request
    const request: FacebookCapiRequest = {
      data: payloads,
      partner_agent: 'admotion-ai',
    };
    
    // Add test event code if in test mode
    if (capiSettings?.send_test_events && capiSettings.test_event_code) {
      request.test_event_code = capiSettings.test_event_code;
    }
    
    // Use provided test event code if specified
    const firstEvent = events[0];
    if (firstEvent?.testEventCode) {
      request.test_event_code = firstEvent.testEventCode;
    }
    
    // Send to Facebook
    const response = await fetch(
      `${FB_GRAPH_URL}/${integration.pixelId}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
    
    const responseData = await response.json();
    
    if (!response.ok) {
      // Log failed events
      for (const payload of payloads) {
        await this.logServerEvent(
          integration.orgId,
          integrationId,
          integration.pixelId,
          payload,
          'failed',
          responseData.error?.message
        );
      }
      
      throw new Error(
        `CAPI error: ${responseData.error?.message || JSON.stringify(responseData)}`
      );
    }
    
    // Log successful events
    for (const payload of payloads) {
      await this.logServerEvent(
        integration.orgId,
        integrationId,
        integration.pixelId,
        payload,
        request.test_event_code ? 'test' : 'sent'
      );
    }
    
    // Update last event sent timestamp
    if (capiSettings) {
      await supabase
        .from('facebook_capi_settings')
        .update({
          last_event_sent_at: new Date().toISOString(),
          events_sent_24h: (capiSettings.events_sent_24h || 0) + payloads.length,
        })
        .eq('id', capiSettings.id);
    }
    
    return {
      events_received: responseData.events_received || payloads.length,
      messages: responseData.messages,
      fbtrace_id: responseData.fbtrace_id,
    };
  },
  
  /**
   * Get CAPI settings for a pixel
   */
  async getCapiSettings(orgId: string, pixelId: string): Promise<FacebookCapiSettings | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_capi_settings')
      .select('*')
      .eq('org_id', orgId)
      .eq('pixel_id', pixelId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return this.mapDbToSettings(data);
  },
  
  /**
   * Update CAPI settings
   */
  async updateCapiSettings(
    settingsId: string,
    updates: Partial<FacebookCapiSettings>
  ): Promise<FacebookCapiSettings> {
    const supabase = await createClient();
    
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.capiEnabled !== undefined) dbUpdates.capi_enabled = updates.capiEnabled;
    if (updates.testEventCode !== undefined) dbUpdates.test_event_code = updates.testEventCode;
    if (updates.accessToken !== undefined) dbUpdates.access_token = updates.accessToken;
    if (updates.hashUserData !== undefined) dbUpdates.hash_user_data = updates.hashUserData;
    if (updates.sendTestEvents !== undefined) dbUpdates.send_test_events = updates.sendTestEvents;
    if (updates.includeFbcFbp !== undefined) dbUpdates.include_fbc_fbp = updates.includeFbcFbp;
    
    const { data, error } = await supabase
      .from('facebook_capi_settings')
      .update(dbUpdates)
      .eq('id', settingsId)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to update CAPI settings: ${error?.message}`);
    }
    
    return this.mapDbToSettings(data);
  },
  
  /**
   * Enable CAPI for a pixel
   */
  async enableCapi(integrationId: string, pixelId: string): Promise<FacebookCapiSettings> {
    const supabase = await createClient();
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    // Generate test event code
    const testEventCode = `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Upsert settings
    const { data, error } = await supabase
      .from('facebook_capi_settings')
      .upsert({
        org_id: integration.orgId,
        integration_id: integrationId,
        pixel_id: pixelId,
        capi_enabled: true,
        test_event_code: testEventCode,
        access_token: integration.accessToken,
        hash_user_data: true,
        send_test_events: false,
        include_fbc_fbp: true,
      }, {
        onConflict: 'org_id,pixel_id',
      })
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to enable CAPI: ${error?.message}`);
    }
    
    // Log audit
    await supabase.from('facebook_audit_logs').insert({
      org_id: integration.orgId,
      action: 'enable_capi',
      resource_type: 'capi_settings',
      resource_id: data.id,
      metadata: { pixelId },
      success: true,
    });
    
    return this.mapDbToSettings(data);
  },
  
  /**
   * Disable CAPI for a pixel
   */
  async disableCapi(integrationId: string, pixelId: string): Promise<void> {
    const supabase = await createClient();
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    await supabase
      .from('facebook_capi_settings')
      .update({ capi_enabled: false })
      .eq('integration_id', integrationId)
      .eq('pixel_id', pixelId);
    
    // Log audit
    await supabase.from('facebook_audit_logs').insert({
      org_id: integration.orgId,
      action: 'disable_capi',
      resource_type: 'capi_settings',
      metadata: { pixelId },
      success: true,
    });
  },
  
  /**
   * Get server events history
   */
  async getServerEvents(
    orgId: string,
    options?: {
      pixelId?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<FacebookServerEvent[]> {
    const supabase = await createClient();
    
    let query = supabase
      .from('facebook_server_events')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(options?.limit || 50);
    
    if (options?.pixelId) {
      query = query.eq('pixel_id', options.pixelId);
    }
    
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get server events: ${error.message}`);
    }
    
    return (data || []).map(row => this.mapDbToServerEvent(row));
  },
  
  /**
   * Check for duplicate events
   */
  async isDuplicate(
    orgId: string,
    eventId: string,
    windowSeconds: number = 3600
  ): Promise<boolean> {
    const supabase = await createClient();
    
    const cutoffTime = new Date(Date.now() - windowSeconds * 1000).toISOString();
    
    const { count } = await supabase
      .from('facebook_server_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('event_id', eventId)
      .gte('created_at', cutoffTime);
    
    return (count || 0) > 0;
  },
  
  // ============================================
  // PRIVATE HELPERS
  // ============================================
  
  isRawUserData(data: unknown): boolean {
    if (!data || typeof data !== 'object') return false;
    const rawKeys = ['email', 'phone', 'firstName', 'lastName', 'city', 'state', 'zip', 'country'];
    return rawKeys.some(key => key in (data as Record<string, unknown>));
  },
  
  async logServerEvent(
    orgId: string,
    integrationId: string,
    pixelId: string,
    payload: FacebookEventPayload,
    status: 'pending' | 'sent' | 'failed' | 'duplicate' | 'test',
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('facebook_server_events').insert({
      org_id: orgId,
      integration_id: integrationId,
      pixel_id: pixelId,
      event_name: payload.event_name,
      event_id: payload.event_id,
      event_time: payload.event_time,
      event_source_url: payload.event_source_url,
      action_source: payload.action_source,
      user_data: payload.user_data,
      custom_data: payload.custom_data,
      payload,
      status,
      error_message: errorMessage,
    });
  },
  
  mapDbToSettings(row: Record<string, unknown>): FacebookCapiSettings {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      integrationId: row.integration_id as string,
      pixelId: row.pixel_id as string,
      capiEnabled: row.capi_enabled as boolean,
      testEventCode: row.test_event_code as string | undefined,
      accessToken: row.access_token as string | undefined,
      hashUserData: row.hash_user_data as boolean,
      sendTestEvents: row.send_test_events as boolean,
      includeFbcFbp: row.include_fbc_fbp as boolean,
      lastEventSentAt: row.last_event_sent_at ? new Date(row.last_event_sent_at as string) : undefined,
      eventsSent24h: row.events_sent_24h as number,
      eventsFailed24h: row.events_failed_24h as number,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  },
  
  mapDbToServerEvent(row: Record<string, unknown>): FacebookServerEvent {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      integrationId: row.integration_id as string,
      pixelId: row.pixel_id as string,
      eventName: row.event_name as string,
      eventId: row.event_id as string,
      eventTime: row.event_time as number,
      eventSourceUrl: row.event_source_url as string | undefined,
      actionSource: row.action_source as FacebookActionSource,
      userData: row.user_data as FacebookServerEvent['userData'],
      customData: row.custom_data as FacebookServerEvent['customData'],
      payload: row.payload as FacebookServerEvent['payload'],
      status: row.status as FacebookServerEvent['status'],
      responseData: row.response_data as Record<string, unknown> | undefined,
      errorMessage: row.error_message as string | undefined,
      browserEventId: row.browser_event_id as string | undefined,
      isDeduplicated: row.is_deduplicated as boolean,
      createdAt: new Date(row.created_at as string),
    };
  },
};
