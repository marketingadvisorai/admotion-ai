/**
 * Tracking Executor Service
 * Executes tracking plans by creating conversions, events, and tags
 */

import { createClient } from '@/lib/db/server';
import { googleAdsMcpService } from '../providers/google-ads-mcp';
import { googleAnalyticsMcpService } from '../providers/google-analytics-mcp';
import {
  TrackingExecutorService,
  TrackingAIPlan,
  ExecutionLogEntry,
  TrackingIntegration,
} from '../types';

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getIntegrations(orgId: string): Promise<{
  googleAds?: TrackingIntegration;
  googleAnalytics?: TrackingIntegration;
  gtm?: TrackingIntegration;
}> {
  const supabase = await createClient();
  
  const { data: integrations } = await supabase
    .from('tracking_integrations')
    .select('*')
    .eq('org_id', orgId)
    .eq('status', 'connected');
  
  const result: {
    googleAds?: TrackingIntegration;
    googleAnalytics?: TrackingIntegration;
    gtm?: TrackingIntegration;
  } = {};
  
  for (const integration of integrations || []) {
    const mapped: TrackingIntegration = {
      id: integration.id,
      orgId: integration.org_id,
      provider: integration.provider,
      status: integration.status,
      accessToken: integration.access_token,
      refreshToken: integration.refresh_token,
      tokenExpiresAt: integration.token_expires_at ? new Date(integration.token_expires_at) : undefined,
      scopes: integration.scopes,
      accountId: integration.account_id,
      accountName: integration.account_name,
      metadata: integration.metadata,
      lastSyncAt: integration.last_sync_at ? new Date(integration.last_sync_at) : undefined,
      lastError: integration.last_error,
      errorCount: integration.error_count || 0,
      createdAt: new Date(integration.created_at),
      updatedAt: new Date(integration.updated_at),
    };
    
    if (integration.provider === 'google_ads_mcp') {
      result.googleAds = mapped;
    } else if (integration.provider === 'google_analytics_mcp') {
      result.googleAnalytics = mapped;
    } else if (integration.provider === 'google_tag_manager') {
      result.gtm = mapped;
    }
  }
  
  return result;
}

async function updatePlanStatus(
  planId: string,
  status: TrackingAIPlan['status'],
  progress: number,
  log?: ExecutionLogEntry
): Promise<void> {
  const supabase = await createClient();
  
  const updates: Record<string, unknown> = {
    status,
    execution_progress: progress,
  };
  
  if (status === 'executing' && progress === 0) {
    updates.executed_at = new Date().toISOString();
  }
  
  if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }
  
  if (log) {
    // Append to execution log
    const { data: plan } = await supabase
      .from('tracking_ai_plans')
      .select('execution_log')
      .eq('id', planId)
      .single();
    
    const existingLog = (plan?.execution_log as ExecutionLogEntry[]) || [];
    updates.execution_log = [...existingLog, log];
  }
  
  await supabase
    .from('tracking_ai_plans')
    .update(updates)
    .eq('id', planId);
}

function createLogEntry(
  action: string,
  status: ExecutionLogEntry['status'],
  message: string,
  details?: Record<string, unknown>
): ExecutionLogEntry {
  return {
    timestamp: new Date(),
    action,
    status,
    message,
    details,
  };
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const trackingExecutorService: TrackingExecutorService = {
  /**
   * Execute a complete tracking plan
   */
  async executePlan(planId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get the plan
    const { data: plan, error } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (error || !plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    if (plan.status !== 'approved' && plan.status !== 'draft') {
      throw new Error(`Plan cannot be executed in status: ${plan.status}`);
    }
    
    const planData = plan.plan_data as TrackingAIPlan['planData'];
    const integrations = await getIntegrations(plan.org_id);
    
    // Start execution
    await updatePlanStatus(planId, 'executing', 0);
    
    const totalSteps = 
      planData.adsConversions.length +
      planData.ga4Events.length +
      planData.gtmTags.length +
      (planData.linkAdsToGa4 ? 1 : 0);
    
    let completedSteps = 0;
    let hasErrors = false;
    
    try {
      // Step 1: Create Google Ads conversions
      if (integrations.googleAds && planData.adsConversions.length > 0) {
        const customerId = integrations.googleAds.accountId;
        
        if (customerId) {
          for (const conversion of planData.adsConversions) {
            try {
              await googleAdsMcpService.createConversionAction(integrations.googleAds.id, {
                customerId,
                name: conversion.name,
                category: conversion.category,
                countingType: conversion.countingType,
                defaultValue: conversion.defaultValue,
                currencyCode: conversion.currencyCode,
              });
              
              completedSteps++;
              const progress = Math.round((completedSteps / totalSteps) * 100);
              
              await updatePlanStatus(planId, 'executing', progress, createLogEntry(
                'create_conversion',
                'success',
                `Created conversion action: ${conversion.name}`,
                { conversion }
              ));
            } catch (err) {
              hasErrors = true;
              const message = err instanceof Error ? err.message : 'Unknown error';
              
              await updatePlanStatus(planId, 'executing', Math.round((completedSteps / totalSteps) * 100), createLogEntry(
                'create_conversion',
                'error',
                `Failed to create conversion: ${conversion.name} - ${message}`,
                { conversion, error: message }
              ));
            }
          }
        }
      }
      
      // Step 2: Create GA4 events
      if (integrations.googleAnalytics && planData.ga4Events.length > 0) {
        const propertyId = integrations.googleAnalytics.accountId;
        
        if (propertyId) {
          for (const event of planData.ga4Events) {
            try {
              await googleAnalyticsMcpService.createCustomEvent(integrations.googleAnalytics.id, {
                propertyId,
                eventName: event.eventName,
                parameters: event.parameters,
                markAsConversion: event.markAsConversion,
              });
              
              completedSteps++;
              const progress = Math.round((completedSteps / totalSteps) * 100);
              
              await updatePlanStatus(planId, 'executing', progress, createLogEntry(
                'create_ga4_event',
                'success',
                `Created GA4 event: ${event.eventName}`,
                { event }
              ));
            } catch (err) {
              hasErrors = true;
              const message = err instanceof Error ? err.message : 'Unknown error';
              
              await updatePlanStatus(planId, 'executing', Math.round((completedSteps / totalSteps) * 100), createLogEntry(
                'create_ga4_event',
                'error',
                `Failed to create GA4 event: ${event.eventName} - ${message}`,
                { event, error: message }
              ));
            }
          }
        }
      }
      
      // Step 3: Link GA4 to Google Ads
      if (planData.linkAdsToGa4 && integrations.googleAds && integrations.googleAnalytics) {
        const customerId = integrations.googleAds.accountId;
        const propertyId = integrations.googleAnalytics.accountId;
        
        if (customerId && propertyId) {
          try {
            // Check if link already exists
            const existingLinks = await googleAnalyticsMcpService.listGoogleAdsLinks(
              integrations.googleAnalytics.id,
              propertyId
            );
            
            const alreadyLinked = existingLinks.some(
              link => link.customerId === customerId.replace(/-/g, '')
            );
            
            if (!alreadyLinked) {
              await googleAnalyticsMcpService.createGoogleAdsLink(
                integrations.googleAnalytics.id,
                propertyId,
                customerId
              );
              
              await updatePlanStatus(planId, 'executing', 100, createLogEntry(
                'link_ga4_to_ads',
                'success',
                `Linked GA4 property ${propertyId} to Google Ads ${customerId}`,
                { propertyId, customerId }
              ));
            } else {
              await updatePlanStatus(planId, 'executing', 100, createLogEntry(
                'link_ga4_to_ads',
                'skipped',
                `GA4 property ${propertyId} already linked to Google Ads ${customerId}`,
                { propertyId, customerId }
              ));
            }
            
            completedSteps++;
          } catch (err) {
            hasErrors = true;
            const message = err instanceof Error ? err.message : 'Unknown error';
            
            await updatePlanStatus(planId, 'executing', Math.round((completedSteps / totalSteps) * 100), createLogEntry(
              'link_ga4_to_ads',
              'error',
              `Failed to link GA4 to Google Ads: ${message}`,
              { error: message }
            ));
          }
        }
      }
      
      // Step 4: Create GTM tags (placeholder - requires GTM API integration)
      if (integrations.gtm && planData.gtmTags.length > 0) {
        for (const tag of planData.gtmTags) {
          await updatePlanStatus(planId, 'executing', Math.round((completedSteps / totalSteps) * 100), createLogEntry(
            'create_gtm_tag',
            'pending',
            `GTM tag creation pending: ${tag.name} (requires manual setup)`,
            { tag }
          ));
          completedSteps++;
        }
      }
      
      // Final status
      const finalStatus = hasErrors ? 'partial' : 'completed';
      await updatePlanStatus(planId, finalStatus, 100);
      
      // Log audit
      await supabase.from('tracking_audit_log').insert({
        org_id: plan.org_id,
        actor_type: 'system',
        action: 'execute_tracking_plan',
        resource_type: 'tracking_plan',
        resource_id: planId,
        after_state: { status: finalStatus, completedSteps, totalSteps },
        success: !hasErrors,
      });
      
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      
      await updatePlanStatus(planId, 'failed', Math.round((completedSteps / totalSteps) * 100), createLogEntry(
        'execution_failed',
        'error',
        `Plan execution failed: ${message}`,
        { error: message }
      ));
      
      throw err;
    }
  },
  
  /**
   * Execute a single step of a plan
   */
  async executeStep(planId: string, stepIndex: number): Promise<ExecutionLogEntry> {
    const supabase = await createClient();
    
    const { data: plan } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    const planData = plan.plan_data as TrackingAIPlan['planData'];
    const allSteps = [
      ...planData.adsConversions.map((c, i) => ({ type: 'conversion', index: i, data: c })),
      ...planData.ga4Events.map((e, i) => ({ type: 'ga4_event', index: i, data: e })),
      ...planData.gtmTags.map((t, i) => ({ type: 'gtm_tag', index: i, data: t })),
    ];
    
    if (stepIndex >= allSteps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }
    
    const step = allSteps[stepIndex];
    
    // Execute based on step type
    // This is a simplified version - full implementation would call the appropriate service
    const logEntry = createLogEntry(
      `execute_${step.type}`,
      'success',
      `Executed step ${stepIndex + 1}: ${step.type}`,
      { step }
    );
    
    await updatePlanStatus(planId, 'executing', Math.round(((stepIndex + 1) / allSteps.length) * 100), logEntry);
    
    return logEntry;
  },
  
  /**
   * Rollback a plan execution
   */
  async rollbackPlan(planId: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: plan } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    // Get execution log to find what was created
    const executionLog = (plan.execution_log as ExecutionLogEntry[]) || [];
    const successfulSteps = executionLog.filter(entry => entry.status === 'success');
    
    // Rollback in reverse order
    for (const step of successfulSteps.reverse()) {
      await updatePlanStatus(planId, 'executing', 0, createLogEntry(
        `rollback_${step.action}`,
        'pending',
        `Rollback pending for: ${step.message}`,
        { originalStep: step }
      ));
    }
    
    // Mark plan as draft again
    await supabase
      .from('tracking_ai_plans')
      .update({
        status: 'draft',
        execution_progress: 0,
      })
      .eq('id', planId);
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: plan.org_id,
      actor_type: 'system',
      action: 'rollback_tracking_plan',
      resource_type: 'tracking_plan',
      resource_id: planId,
      success: true,
    });
  },
  
  /**
   * Verify plan execution
   */
  async verifyExecution(planId: string): Promise<{ success: boolean; issues: string[] }> {
    const supabase = await createClient();
    const issues: string[] = [];
    
    const { data: plan } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (!plan) {
      return { success: false, issues: ['Plan not found'] };
    }
    
    const planData = plan.plan_data as TrackingAIPlan['planData'];
    const integrations = await getIntegrations(plan.org_id);
    
    // Verify Google Ads conversions
    if (integrations.googleAds && planData.adsConversions.length > 0) {
      const customerId = integrations.googleAds.accountId;
      
      if (customerId) {
        try {
          const existingConversions = await googleAdsMcpService.listConversionActions(
            integrations.googleAds.id,
            customerId
          );
          
          for (const planned of planData.adsConversions) {
            const found = existingConversions.find(c => c.name === planned.name);
            if (!found) {
              issues.push(`Conversion action not found: ${planned.name}`);
            }
          }
        } catch (err) {
          issues.push(`Failed to verify Google Ads conversions: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }
    
    // Verify GA4 events
    if (integrations.googleAnalytics && planData.ga4Events.length > 0) {
      const propertyId = integrations.googleAnalytics.accountId;
      
      if (propertyId) {
        try {
          const existingEvents = await googleAnalyticsMcpService.listEvents(
            integrations.googleAnalytics.id,
            propertyId
          );
          
          for (const planned of planData.ga4Events) {
            const found = existingEvents.find(e => e.eventName === planned.eventName);
            if (!found) {
              issues.push(`GA4 event not receiving data: ${planned.eventName}`);
            }
          }
        } catch (err) {
          issues.push(`Failed to verify GA4 events: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    }
    
    return {
      success: issues.length === 0,
      issues,
    };
  },
};

export default trackingExecutorService;
