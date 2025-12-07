/**
 * Tracking Health Monitor Service
 * Monitors tracking health and provides auto-fix capabilities
 */

import { createClient } from '@/lib/db/server';
import { getProviderApiKey } from '@/modules/llm/config';
import { googleAdsMcpService } from '../providers/google-ads-mcp';
import { googleAnalyticsMcpService } from '../providers/google-analytics-mcp';
import {
  TrackingHealthService,
  TrackingHealthStatus,
  HealthCheckType,
  HealthStatus,
  TrackingIntegration,
} from '../types';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getIntegrations(orgId: string): Promise<TrackingIntegration[]> {
  const supabase = await createClient();
  
  const { data: integrations } = await supabase
    .from('tracking_integrations')
    .select('*')
    .eq('org_id', orgId);
  
  return (integrations || []).map(i => ({
    id: i.id,
    orgId: i.org_id,
    provider: i.provider,
    status: i.status,
    accessToken: i.access_token,
    refreshToken: i.refresh_token,
    tokenExpiresAt: i.token_expires_at ? new Date(i.token_expires_at) : undefined,
    scopes: i.scopes,
    accountId: i.account_id,
    accountName: i.account_name,
    metadata: i.metadata,
    lastSyncAt: i.last_sync_at ? new Date(i.last_sync_at) : undefined,
    lastError: i.last_error,
    errorCount: i.error_count || 0,
    createdAt: new Date(i.created_at),
    updatedAt: new Date(i.updated_at),
  }));
}

async function saveHealthStatus(status: Omit<TrackingHealthStatus, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackingHealthStatus> {
  const supabase = await createClient();
  
  // Check if we already have a status for this check
  const { data: existing } = await supabase
    .from('tracking_health_status')
    .select('*')
    .eq('org_id', status.orgId)
    .eq('check_type', status.checkType)
    .eq('integration_id', status.integrationId || '')
    .single();
  
  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('tracking_health_status')
      .update({
        status: status.status,
        message: status.message,
        details: status.details,
        auto_fix_available: status.autoFixAvailable,
        fix_action: status.fixAction,
        last_checked_at: new Date().toISOString(),
        issue_started_at: status.status !== 'healthy' && !existing.issue_started_at 
          ? new Date().toISOString() 
          : existing.issue_started_at,
        resolved_at: status.status === 'healthy' ? new Date().toISOString() : null,
      })
      .eq('id', existing.id)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    return {
      id: data.id,
      orgId: data.org_id,
      websiteId: data.website_id,
      integrationId: data.integration_id,
      checkType: data.check_type,
      status: data.status,
      message: data.message,
      details: data.details,
      autoFixAvailable: data.auto_fix_available,
      fixAction: data.fix_action,
      lastCheckedAt: new Date(data.last_checked_at),
      issueStartedAt: data.issue_started_at ? new Date(data.issue_started_at) : undefined,
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
  
  // Create new
  const { data, error } = await supabase
    .from('tracking_health_status')
    .insert({
      org_id: status.orgId,
      website_id: status.websiteId,
      integration_id: status.integrationId,
      check_type: status.checkType,
      status: status.status,
      message: status.message,
      details: status.details,
      auto_fix_available: status.autoFixAvailable,
      fix_action: status.fixAction,
      last_checked_at: new Date().toISOString(),
      issue_started_at: status.status !== 'healthy' ? new Date().toISOString() : null,
    })
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  
  return {
    id: data.id,
    orgId: data.org_id,
    websiteId: data.website_id,
    integrationId: data.integration_id,
    checkType: data.check_type,
    status: data.status,
    message: data.message,
    details: data.details,
    autoFixAvailable: data.auto_fix_available,
    fixAction: data.fix_action,
    lastCheckedAt: new Date(data.last_checked_at),
    issueStartedAt: data.issue_started_at ? new Date(data.issue_started_at) : undefined,
    resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  };
}

// ============================================
// HEALTH CHECK IMPLEMENTATIONS
// ============================================

async function checkConversionReceiving(
  orgId: string,
  integration: TrackingIntegration
): Promise<TrackingHealthStatus> {
  let status: HealthStatus = 'unknown';
  let message = '';
  let details: Record<string, unknown> = {};
  let autoFixAvailable = false;
  let fixAction: string | undefined;
  
  try {
    if (integration.status !== 'connected') {
      status = 'critical';
      message = 'Google Ads integration is not connected';
      autoFixAvailable = true;
      fixAction = 'reconnect_integration';
    } else if (integration.accountId) {
      // Check conversion actions
      const conversions = await googleAdsMcpService.listConversionActions(
        integration.id,
        integration.accountId
      );
      
      const activeConversions = conversions.filter(c => c.status === 'ENABLED');
      const receivingData = activeConversions.filter(c => (c.conversionsLast30d || 0) > 0);
      
      if (activeConversions.length === 0) {
        status = 'warning';
        message = 'No active conversion actions found';
        autoFixAvailable = true;
        fixAction = 'create_conversion_actions';
      } else if (receivingData.length === 0) {
        status = 'warning';
        message = 'Conversion actions exist but not receiving data';
        details = { activeConversions: activeConversions.length };
      } else {
        status = 'healthy';
        message = `${receivingData.length}/${activeConversions.length} conversions receiving data`;
        details = { 
          activeConversions: activeConversions.length,
          receivingData: receivingData.length,
        };
      }
    }
  } catch (err) {
    status = 'critical';
    message = `Failed to check conversions: ${err instanceof Error ? err.message : 'Unknown error'}`;
    autoFixAvailable = true;
    fixAction = 'refresh_token';
  }
  
  return saveHealthStatus({
    orgId,
    integrationId: integration.id,
    checkType: 'conversion_receiving',
    status,
    message,
    details,
    autoFixAvailable,
    fixAction,
    lastCheckedAt: new Date(),
  });
}

async function checkEventFiring(
  orgId: string,
  integration: TrackingIntegration
): Promise<TrackingHealthStatus> {
  let status: HealthStatus = 'unknown';
  let message = '';
  let details: Record<string, unknown> = {};
  let autoFixAvailable = false;
  let fixAction: string | undefined;
  
  try {
    if (integration.status !== 'connected') {
      status = 'critical';
      message = 'Google Analytics integration is not connected';
      autoFixAvailable = true;
      fixAction = 'reconnect_integration';
    } else if (integration.accountId) {
      // Check GA4 events
      const events = await googleAnalyticsMcpService.listEvents(
        integration.id,
        integration.accountId
      );
      
      const recentEvents = events.filter(e => (e.eventCountLast7d || 0) > 0);
      
      if (events.length === 0) {
        status = 'warning';
        message = 'No events found in GA4 property';
        autoFixAvailable = true;
        fixAction = 'create_ga4_events';
      } else if (recentEvents.length === 0) {
        status = 'critical';
        message = 'No events received in the last 7 days';
        details = { totalEvents: events.length };
      } else {
        status = 'healthy';
        message = `${recentEvents.length} events active in last 7 days`;
        details = { 
          totalEvents: events.length,
          activeEvents: recentEvents.length,
        };
      }
    }
  } catch (err) {
    status = 'critical';
    message = `Failed to check events: ${err instanceof Error ? err.message : 'Unknown error'}`;
    autoFixAvailable = true;
    fixAction = 'refresh_token';
  }
  
  return saveHealthStatus({
    orgId,
    integrationId: integration.id,
    checkType: 'event_firing',
    status,
    message,
    details,
    autoFixAvailable,
    fixAction,
    lastCheckedAt: new Date(),
  });
}

async function checkLinkingValid(
  orgId: string,
  adsIntegration: TrackingIntegration,
  analyticsIntegration: TrackingIntegration
): Promise<TrackingHealthStatus> {
  let status: HealthStatus = 'unknown';
  let message = '';
  let details: Record<string, unknown> = {};
  let autoFixAvailable = false;
  let fixAction: string | undefined;
  
  try {
    if (analyticsIntegration.status !== 'connected' || !analyticsIntegration.accountId) {
      status = 'warning';
      message = 'Google Analytics not connected - cannot verify linking';
    } else {
      const links = await googleAnalyticsMcpService.listGoogleAdsLinks(
        analyticsIntegration.id,
        analyticsIntegration.accountId
      );
      
      if (links.length === 0) {
        status = 'warning';
        message = 'GA4 property not linked to any Google Ads account';
        autoFixAvailable = true;
        fixAction = 'link_ga4_to_ads';
      } else {
        const adsCustomerId = adsIntegration.accountId?.replace(/-/g, '');
        const isLinked = links.some(l => l.customerId === adsCustomerId);
        
        if (isLinked) {
          status = 'healthy';
          message = 'GA4 property linked to Google Ads account';
          details = { linkedAccounts: links.length };
        } else {
          status = 'warning';
          message = 'GA4 property linked to different Google Ads account';
          autoFixAvailable = true;
          fixAction = 'link_ga4_to_ads';
          details = { linkedAccounts: links.map(l => l.customerId) };
        }
      }
    }
  } catch (err) {
    status = 'critical';
    message = `Failed to check linking: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
  
  return saveHealthStatus({
    orgId,
    integrationId: analyticsIntegration.id,
    checkType: 'linking_valid',
    status,
    message,
    details,
    autoFixAvailable,
    fixAction,
    lastCheckedAt: new Date(),
  });
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const trackingHealthService: TrackingHealthService = {
  /**
   * Run all health checks for an organization
   */
  async runHealthCheck(orgId: string): Promise<TrackingHealthStatus[]> {
    const integrations = await getIntegrations(orgId);
    const results: TrackingHealthStatus[] = [];
    
    const adsIntegration = integrations.find(i => i.provider === 'google_ads_mcp');
    const analyticsIntegration = integrations.find(i => i.provider === 'google_analytics_mcp');
    
    // Check Google Ads conversions
    if (adsIntegration) {
      const conversionCheck = await checkConversionReceiving(orgId, adsIntegration);
      results.push(conversionCheck);
    }
    
    // Check GA4 events
    if (analyticsIntegration) {
      const eventCheck = await checkEventFiring(orgId, analyticsIntegration);
      results.push(eventCheck);
    }
    
    // Check linking
    if (adsIntegration && analyticsIntegration) {
      const linkingCheck = await checkLinkingValid(orgId, adsIntegration, analyticsIntegration);
      results.push(linkingCheck);
    }
    
    return results;
  },
  
  /**
   * Run a specific health check
   */
  async runSpecificCheck(orgId: string, checkType: HealthCheckType): Promise<TrackingHealthStatus> {
    const integrations = await getIntegrations(orgId);
    
    const adsIntegration = integrations.find(i => i.provider === 'google_ads_mcp');
    const analyticsIntegration = integrations.find(i => i.provider === 'google_analytics_mcp');
    
    switch (checkType) {
      case 'conversion_receiving':
        if (!adsIntegration) {
          throw new Error('Google Ads integration not found');
        }
        return checkConversionReceiving(orgId, adsIntegration);
        
      case 'event_firing':
        if (!analyticsIntegration) {
          throw new Error('Google Analytics integration not found');
        }
        return checkEventFiring(orgId, analyticsIntegration);
        
      case 'linking_valid':
        if (!adsIntegration || !analyticsIntegration) {
          throw new Error('Both Google Ads and Analytics integrations required');
        }
        return checkLinkingValid(orgId, adsIntegration, analyticsIntegration);
        
      default:
        throw new Error(`Unsupported check type: ${checkType}`);
    }
  },
  
  /**
   * Attempt to auto-fix an issue
   */
  async autoFix(healthStatusId: string): Promise<{ success: boolean; message: string }> {
    const supabase = await createClient();
    
    const { data: status } = await supabase
      .from('tracking_health_status')
      .select('*')
      .eq('id', healthStatusId)
      .single();
    
    if (!status) {
      return { success: false, message: 'Health status not found' };
    }
    
    if (!status.auto_fix_available || !status.fix_action) {
      return { success: false, message: 'No auto-fix available for this issue' };
    }
    
    try {
      switch (status.fix_action) {
        case 'refresh_token':
          if (status.integration_id) {
            const { data: integration } = await supabase
              .from('tracking_integrations')
              .select('provider')
              .eq('id', status.integration_id)
              .single();
            
            if (integration?.provider === 'google_ads_mcp') {
              await googleAdsMcpService.refreshToken(status.integration_id);
            } else if (integration?.provider === 'google_analytics_mcp') {
              await googleAnalyticsMcpService.refreshToken(status.integration_id);
            }
            
            return { success: true, message: 'Token refreshed successfully' };
          }
          break;
          
        case 'link_ga4_to_ads':
          const integrations = await getIntegrations(status.org_id);
          const ads = integrations.find(i => i.provider === 'google_ads_mcp');
          const analytics = integrations.find(i => i.provider === 'google_analytics_mcp');
          
          if (ads?.accountId && analytics?.accountId) {
            await googleAnalyticsMcpService.createGoogleAdsLink(
              analytics.id,
              analytics.accountId,
              ads.accountId
            );
            return { success: true, message: 'GA4 linked to Google Ads successfully' };
          }
          break;
          
        case 'reconnect_integration':
          return { 
            success: false, 
            message: 'Please reconnect the integration manually through the settings page' 
          };
          
        default:
          return { success: false, message: `Unknown fix action: ${status.fix_action}` };
      }
      
      return { success: false, message: 'Fix action not implemented' };
    } catch (err) {
      return { 
        success: false, 
        message: `Auto-fix failed: ${err instanceof Error ? err.message : 'Unknown error'}` 
      };
    }
  },
  
  /**
   * Get AI explanation for an issue
   */
  async explainIssue(healthStatusId: string): Promise<string> {
    const supabase = await createClient();
    
    const { data: status } = await supabase
      .from('tracking_health_status')
      .select('*')
      .eq('id', healthStatusId)
      .single();
    
    if (!status) {
      return 'Health status not found.';
    }
    
    // Try to use AI for explanation
    try {
      const apiKey = await getProviderApiKey('openai', status.org_id);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a Google Ads and Analytics tracking expert. Explain tracking issues in simple terms and provide actionable solutions.',
            },
            {
              role: 'user',
              content: `Explain this tracking issue and how to fix it:
              
Check Type: ${status.check_type}
Status: ${status.status}
Message: ${status.message}
Details: ${JSON.stringify(status.details)}

Provide a clear explanation suitable for a marketing professional who may not be technical.`,
            },
          ],
          temperature: 0.5,
          max_tokens: 500,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.choices[0]?.message?.content || getFallbackExplanation(status);
      }
    } catch {
      // Fall back to static explanations
    }
    
    return getFallbackExplanation(status);
  },
};

function getFallbackExplanation(status: Record<string, unknown>): string {
  const checkType = status.check_type as string;
  const statusValue = status.status as string;
  
  const explanations: Record<string, Record<string, string>> = {
    conversion_receiving: {
      critical: 'Your Google Ads conversion tracking is not working. This means you cannot measure the effectiveness of your ad campaigns. Check that your conversion tags are properly installed on your website.',
      warning: 'Your conversion tracking is set up but may not be receiving data. Verify that conversions are actually happening on your website and that the tracking code is firing correctly.',
      healthy: 'Your conversion tracking is working correctly and receiving data.',
    },
    event_firing: {
      critical: 'Your Google Analytics is not receiving any events. This could mean your tracking code is not installed correctly or there is no traffic to your website.',
      warning: 'Some events are not firing as expected. Review your event configuration and ensure all important actions are being tracked.',
      healthy: 'Your GA4 events are firing correctly.',
    },
    linking_valid: {
      critical: 'Your GA4 property is not linked to Google Ads. This prevents conversion data from being shared between platforms.',
      warning: 'Your GA4 and Google Ads accounts may not be properly linked. Consider creating a link to improve attribution.',
      healthy: 'Your GA4 property is properly linked to Google Ads.',
    },
  };
  
  return explanations[checkType]?.[statusValue] || 'Unable to provide explanation for this issue.';
}

export default trackingHealthService;
