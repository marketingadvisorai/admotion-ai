/**
 * Facebook Pixel Service
 * Manages Facebook Pixels - listing, configuration, health checks
 */

import { createClient } from '@/lib/db/server';
import { facebookAuthService } from './auth-service';
import { generatePixelCode } from './utils';
import type {
  FacebookPixel,
  FacebookPixelHealth,
  PixelDiagnostics,
  PixelDiagnosticsInput,
  PixelIssue,
  PixelRecommendation,
  FacebookHealthStatus,
} from './types';

// ============================================
// CONSTANTS
// ============================================

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function makeGraphRequest<T>(
  endpoint: string,
  accessToken: string,
  method: 'GET' | 'POST' = 'GET',
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

export const facebookPixelService = {
  /**
   * List all pixels accessible to the user
   */
  async listPixels(integrationId: string): Promise<FacebookPixel[]> {
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    // Get pixels from ad accounts
    const pixels: FacebookPixel[] = [];
    
    if (integration.adAccountId) {
      // Get pixels for specific ad account
      const response = await makeGraphRequest<{
        data: Array<{
          id: string;
          name: string;
          last_fired_time?: string;
          creation_time: string;
          is_unavailable: boolean;
          first_party_cookie_status?: string;
          data_use_setting?: string;
        }>;
      }>(`/act_${integration.adAccountId}/adspixels?fields=id,name,last_fired_time,creation_time,is_unavailable,first_party_cookie_status,data_use_setting`, integration.accessToken);
      
      for (const pixel of response.data) {
        pixels.push({
          id: pixel.id,
          name: pixel.name,
          lastFiredTime: pixel.last_fired_time ? new Date(pixel.last_fired_time) : undefined,
          creationTime: new Date(pixel.creation_time),
          isUnavailable: pixel.is_unavailable,
          firstPartyCookieStatus: pixel.first_party_cookie_status,
          dataUseSetting: pixel.data_use_setting,
        });
      }
    } else {
      // Get all ad accounts and their pixels
      const adAccounts = await facebookAuthService.getAdAccounts(integrationId);
      
      for (const account of adAccounts.slice(0, 5)) { // Limit to 5 accounts
        try {
          const response = await makeGraphRequest<{
            data: Array<{
              id: string;
              name: string;
              last_fired_time?: string;
              creation_time: string;
              is_unavailable: boolean;
            }>;
          }>(`/act_${account.accountId}/adspixels?fields=id,name,last_fired_time,creation_time,is_unavailable`, integration.accessToken);
          
          for (const pixel of response.data) {
            // Avoid duplicates
            if (!pixels.find(p => p.id === pixel.id)) {
              pixels.push({
                id: pixel.id,
                name: pixel.name,
                lastFiredTime: pixel.last_fired_time ? new Date(pixel.last_fired_time) : undefined,
                creationTime: new Date(pixel.creation_time),
                isUnavailable: pixel.is_unavailable,
              });
            }
          }
        } catch {
          // Skip accounts we can't access
          continue;
        }
      }
    }
    
    return pixels;
  },
  
  /**
   * Get a specific pixel's details
   */
  async getPixel(integrationId: string, pixelId: string): Promise<FacebookPixel> {
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    const pixel = await makeGraphRequest<{
      id: string;
      name: string;
      last_fired_time?: string;
      creation_time: string;
      is_unavailable: boolean;
      first_party_cookie_status?: string;
      data_use_setting?: string;
      code?: string;
    }>(`/${pixelId}?fields=id,name,last_fired_time,creation_time,is_unavailable,first_party_cookie_status,data_use_setting,code`, integration.accessToken);
    
    return {
      id: pixel.id,
      name: pixel.name,
      lastFiredTime: pixel.last_fired_time ? new Date(pixel.last_fired_time) : undefined,
      creationTime: new Date(pixel.creation_time),
      isUnavailable: pixel.is_unavailable,
      firstPartyCookieStatus: pixel.first_party_cookie_status,
      dataUseSetting: pixel.data_use_setting,
      code: pixel.code,
    };
  },
  
  /**
   * Get pixel installation code
   */
  async getPixelCode(integrationId: string, pixelId: string): Promise<string> {
    // Validate the pixel exists
    await this.getPixel(integrationId, pixelId);
    
    // Return generated code
    return generatePixelCode(pixelId);
  },
  
  /**
   * Select a pixel for the integration
   */
  async selectPixel(integrationId: string, pixelId: string): Promise<void> {
    const supabase = await createClient();
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    // Validate pixel exists and is accessible
    const pixel = await this.getPixel(integrationId, pixelId);
    
    if (pixel.isUnavailable) {
      throw new Error(`Pixel ${pixelId} is unavailable`);
    }
    
    // Update integration with selected pixel
    await supabase
      .from('facebook_integrations')
      .update({ pixel_id: pixelId })
      .eq('id', integrationId);
    
    // Log audit
    await supabase.from('facebook_audit_logs').insert({
      org_id: integration.orgId,
      action: 'select_pixel',
      resource_type: 'pixel',
      resource_id: pixelId,
      metadata: { pixelName: pixel.name },
      success: true,
    });
  },
  
  /**
   * Get pixel diagnostics from Facebook
   */
  async getPixelDiagnostics(
    integrationId: string,
    input: PixelDiagnosticsInput
  ): Promise<PixelDiagnostics> {
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    // Get pixel stats
    const stats = await makeGraphRequest<{
      data: Array<{
        event: string;
        count: number;
        timestamp: string;
      }>;
    }>(`/${input.pixelId}/stats?aggregation=event`, integration.accessToken);
    
    // Build event breakdown
    const eventBreakdown: Record<string, number> = {};
    let totalEvents = 0;
    
    for (const stat of stats.data || []) {
      eventBreakdown[stat.event] = (eventBreakdown[stat.event] || 0) + stat.count;
      totalEvents += stat.count;
    }
    
    // Get DA checks (data quality diagnostics)
    let matchedEventsCount = 0;
    let unmatchedEventsCount = 0;
    
    try {
      const daChecks = await makeGraphRequest<{
        data: Array<{
          check_name: string;
          result: string;
          description: string;
        }>;
      }>(`/${input.pixelId}/da_checks`, integration.accessToken);
      
      // Parse match rate from DA checks if available
      const matchRateCheck = daChecks.data?.find(c => c.check_name === 'match_rate');
      if (matchRateCheck) {
        const matchRate = parseFloat(matchRateCheck.result) || 0;
        matchedEventsCount = Math.round(totalEvents * matchRate / 100);
        unmatchedEventsCount = totalEvents - matchedEventsCount;
      }
    } catch {
      // DA checks may not be available for all pixels
    }
    
    return {
      browserEventsCount: totalEvents,
      serverEventsCount: 0, // Will be updated with CAPI data
      matchedEventsCount,
      unmatchedEventsCount,
      eventBreakdown,
      topErrorCodes: [],
    };
  },
  
  /**
   * Check pixel health and generate recommendations
   */
  async checkPixelHealth(integrationId: string): Promise<FacebookPixelHealth> {
    const supabase = await createClient();
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    if (!integration.pixelId) {
      throw new Error('No pixel selected for this integration');
    }
    
    const pixelId = integration.pixelId;
    const issues: PixelIssue[] = [];
    const recommendations: PixelRecommendation[] = [];
    
    // Get pixel info
    const pixel = await this.getPixel(integrationId, pixelId);
    
    // Get diagnostics
    const diagnostics = await this.getPixelDiagnostics(integrationId, { pixelId });
    
    // Check if pixel is firing
    const pixelActive = pixel.lastFiredTime 
      ? new Date(pixel.lastFiredTime) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      : false;
    
    // Check CAPI status
    const { data: capiSettings } = await supabase
      .from('facebook_capi_settings')
      .select('*')
      .eq('integration_id', integrationId)
      .eq('pixel_id', pixelId)
      .single();
    
    const capiActive = capiSettings?.capi_enabled && 
      capiSettings.last_event_sent_at &&
      new Date(capiSettings.last_event_sent_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Calculate health score
    let healthScore = 0;
    
    if (pixelActive) healthScore += 30;
    if (capiActive) healthScore += 30;
    if (diagnostics.matchedEventsCount && diagnostics.matchedEventsCount > 0) healthScore += 20;
    if (diagnostics.eventBreakdown && Object.keys(diagnostics.eventBreakdown).length >= 3) healthScore += 20;
    
    // Determine health status
    let healthStatus: FacebookHealthStatus = 'unknown';
    if (healthScore >= 80) healthStatus = 'green';
    else if (healthScore >= 50) healthStatus = 'yellow';
    else if (healthScore > 0) healthStatus = 'red';
    
    // Generate issues
    if (!pixelActive) {
      issues.push({
        code: 'PIXEL_NOT_FIRING',
        severity: 'critical',
        title: 'Pixel Not Firing',
        description: 'No browser events received in the last 24 hours.',
        howToFix: 'Verify the pixel code is correctly installed on your website.',
      });
    }
    
    if (!capiActive) {
      issues.push({
        code: 'CAPI_NOT_CONFIGURED',
        severity: 'high',
        title: 'Conversions API Not Active',
        description: 'Server-side events are not being sent.',
        howToFix: 'Enable Conversions API to improve event matching and attribution.',
      });
    }
    
    if (diagnostics.browserEventsCount && diagnostics.browserEventsCount < 100) {
      issues.push({
        code: 'LOW_EVENT_VOLUME',
        severity: 'medium',
        title: 'Low Event Volume',
        description: 'Less than 100 events received. This may affect optimization.',
        howToFix: 'Ensure all key pages have the pixel installed.',
      });
    }
    
    // Generate recommendations
    if (!capiActive) {
      recommendations.push({
        type: 'action',
        title: 'Enable Conversions API',
        description: 'Improve event matching by 30% or more with server-side events.',
        impact: 'high',
      });
    }
    
    if (!diagnostics.eventBreakdown?.['Purchase']) {
      recommendations.push({
        type: 'action',
        title: 'Track Purchase Events',
        description: 'Add Purchase event tracking to measure ROAS accurately.',
        impact: 'high',
      });
    }
    
    if (!diagnostics.eventBreakdown?.['Lead']) {
      recommendations.push({
        type: 'optimization',
        title: 'Track Lead Events',
        description: 'Track form submissions and lead generation for better optimization.',
        impact: 'medium',
      });
    }
    
    recommendations.push({
      type: 'info',
      title: 'Use Event Deduplication',
      description: 'Ensure browser and server events have matching event_ids.',
      impact: 'medium',
    });
    
    // Calculate match rate
    const totalEvents = (diagnostics.matchedEventsCount || 0) + (diagnostics.unmatchedEventsCount || 0);
    const matchRate = totalEvents > 0 
      ? (diagnostics.matchedEventsCount || 0) / totalEvents * 100 
      : undefined;
    
    // Upsert health record
    const healthData = {
      org_id: integration.orgId,
      integration_id: integrationId,
      pixel_id: pixelId,
      health_status: healthStatus,
      health_score: healthScore,
      pixel_active: pixelActive,
      capi_active: capiActive,
      events_received_24h: diagnostics.browserEventsCount || 0,
      match_rate: matchRate,
      diagnostics,
      issues,
      recommendations,
      last_checked_at: new Date().toISOString(),
      last_event_received_at: pixel.lastFiredTime?.toISOString(),
    };
    
    const { data: healthRecord, error } = await supabase
      .from('facebook_pixel_health')
      .upsert(healthData, {
        onConflict: 'org_id,pixel_id',
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save health check: ${error.message}`);
    }
    
    return {
      id: healthRecord.id,
      orgId: healthRecord.org_id,
      integrationId: healthRecord.integration_id,
      pixelId: healthRecord.pixel_id,
      healthStatus: healthRecord.health_status,
      healthScore: healthRecord.health_score,
      pixelActive: healthRecord.pixel_active,
      capiActive: healthRecord.capi_active,
      eventsReceived24h: healthRecord.events_received_24h,
      matchRate: healthRecord.match_rate,
      dataQualityScore: healthRecord.data_quality_score,
      diagnostics: healthRecord.diagnostics,
      issues: healthRecord.issues,
      recommendations: healthRecord.recommendations,
      lastCheckedAt: healthRecord.last_checked_at ? new Date(healthRecord.last_checked_at) : undefined,
      lastEventReceivedAt: healthRecord.last_event_received_at ? new Date(healthRecord.last_event_received_at) : undefined,
      createdAt: new Date(healthRecord.created_at),
      updatedAt: new Date(healthRecord.updated_at),
    };
  },
  
  /**
   * Get stored health status
   */
  async getStoredHealth(orgId: string, pixelId: string): Promise<FacebookPixelHealth | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_pixel_health')
      .select('*')
      .eq('org_id', orgId)
      .eq('pixel_id', pixelId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      orgId: data.org_id,
      integrationId: data.integration_id,
      pixelId: data.pixel_id,
      healthStatus: data.health_status,
      healthScore: data.health_score,
      pixelActive: data.pixel_active,
      capiActive: data.capi_active,
      eventsReceived24h: data.events_received_24h,
      matchRate: data.match_rate,
      dataQualityScore: data.data_quality_score,
      diagnostics: data.diagnostics,
      issues: data.issues,
      recommendations: data.recommendations,
      lastCheckedAt: data.last_checked_at ? new Date(data.last_checked_at) : undefined,
      lastEventReceivedAt: data.last_event_received_at ? new Date(data.last_event_received_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },
};
