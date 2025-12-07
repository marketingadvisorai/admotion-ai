/**
 * Tracking AI Planner Service
 * Uses LLM to generate comprehensive tracking plans
 */

import { createClient } from '@/lib/db/server';
import { getProviderApiKey } from '@/modules/llm/config';
import { recordLlmUsage } from '@/modules/llm/usage';
import {
  TrackingAiPlannerService,
  TrackingAIPlanInput,
  TrackingAIPlan,
  TrackingPlanData,
  PlannedConversion,
  PlannedGA4Event,
  PlannedGTMTag,
  PlannedGTMTrigger,
  PlanRecommendation,
  GoalType,
  ConversionCategory,
  GA4EventParameter,
} from '../types';

// ============================================
// CONSTANTS
// ============================================

const SYSTEM_PROMPT = `You are an expert Google Ads and Google Analytics tracking specialist. Your job is to create comprehensive tracking plans that:

1. Map business goals to appropriate conversion actions and events
2. Follow Google's best practices for conversion tracking
3. Ensure proper GA4 event naming conventions
4. Create GTM tags and triggers when needed
5. Recommend linking GA4 to Google Ads for better attribution

You must output a valid JSON tracking plan with the following structure:
{
  "adsConversions": [...],
  "ga4Events": [...],
  "gtmTags": [...],
  "gtmTriggers": [...],
  "linkAdsToGa4": boolean,
  "recommendations": [...]
}

Follow these rules:
- Use snake_case for GA4 event names
- Use descriptive names for conversion actions
- Include value tracking for purchase/booking goals
- Recommend enhanced conversions when applicable
- Consider the user's existing tracking setup to avoid duplicates`;

// ============================================
// GOAL TO TRACKING MAPPINGS
// ============================================

const GOAL_TO_CONVERSION_CATEGORY: Record<GoalType, ConversionCategory> = {
  purchase: 'PURCHASE',
  lead: 'LEAD',
  booking: 'BOOK_APPOINTMENT',
  signup: 'SIGNUP',
  call: 'PHONE_CALL_LEAD',
  add_to_cart: 'ADD_TO_CART',
  page_view: 'PAGE_VIEW',
  form_submit: 'SUBMIT_LEAD_FORM',
  click: 'OUTBOUND_CLICK',
  custom: 'DEFAULT',
};

const GOAL_TO_GA4_EVENT: Record<GoalType, string> = {
  purchase: 'purchase',
  lead: 'generate_lead',
  booking: 'book_appointment',
  signup: 'sign_up',
  call: 'phone_call',
  add_to_cart: 'add_to_cart',
  page_view: 'page_view',
  form_submit: 'form_submit',
  click: 'click',
  custom: 'custom_event',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function buildPlanPrompt(input: TrackingAIPlanInput): string {
  const parts: string[] = [];
  
  parts.push('## Business Context');
  parts.push(`Business Goals: ${input.businessGoals.join(', ')}`);
  if (input.industry) {
    parts.push(`Industry: ${input.industry}`);
  }
  
  parts.push('\n## Website Analysis');
  if (input.websiteAnalysis.detectedPages.length > 0) {
    parts.push('Detected Pages:');
    for (const page of input.websiteAnalysis.detectedPages.slice(0, 10)) {
      parts.push(`- ${page.type}: ${page.url} (confidence: ${page.confidence})`);
    }
  }
  if (input.websiteAnalysis.detectedForms.length > 0) {
    parts.push('Detected Forms:');
    for (const form of input.websiteAnalysis.detectedForms.slice(0, 5)) {
      parts.push(`- ${form.type}: ${form.selector} (fields: ${form.fields.join(', ')})`);
    }
  }
  if (input.websiteAnalysis.detectedEvents.length > 0) {
    parts.push('Detected Events:');
    for (const event of input.websiteAnalysis.detectedEvents.slice(0, 10)) {
      parts.push(`- ${event.type}: ${event.name}`);
    }
  }
  
  parts.push('\n## Existing Tracking');
  if (input.existingTracking.adsConversions.length > 0) {
    parts.push('Existing Google Ads Conversions:');
    for (const conv of input.existingTracking.adsConversions) {
      parts.push(`- ${conv.name} (${conv.category})`);
    }
  }
  if (input.existingTracking.ga4Events.length > 0) {
    parts.push('Existing GA4 Events:');
    for (const event of input.existingTracking.ga4Events.slice(0, 20)) {
      parts.push(`- ${event.eventName} (${event.eventType})`);
    }
  }
  
  parts.push('\n## Connected Integrations');
  parts.push(`Google Ads: ${input.integrations.googleAds?.status || 'not connected'}`);
  parts.push(`Google Analytics: ${input.integrations.googleAnalytics?.status || 'not connected'}`);
  parts.push(`Google Tag Manager: ${input.integrations.gtm?.status || 'not connected'}`);
  
  parts.push('\n## Task');
  parts.push('Generate a comprehensive tracking plan that:');
  parts.push('1. Creates appropriate conversion actions in Google Ads');
  parts.push('2. Sets up GA4 events with proper parameters');
  parts.push('3. Creates GTM tags and triggers if GTM is connected');
  parts.push('4. Links GA4 to Google Ads if both are connected');
  parts.push('5. Provides actionable recommendations');
  
  return parts.join('\n');
}

function generateDefaultPlan(input: TrackingAIPlanInput): TrackingPlanData {
  const adsConversions: PlannedConversion[] = [];
  const ga4Events: PlannedGA4Event[] = [];
  const gtmTags: PlannedGTMTag[] = [];
  const gtmTriggers: PlannedGTMTrigger[] = [];
  const recommendations: PlanRecommendation[] = [];
  
  // Generate conversions and events for each goal
  for (const goal of input.businessGoals) {
    const category = GOAL_TO_CONVERSION_CATEGORY[goal];
    const eventName = GOAL_TO_GA4_EVENT[goal];
    
    // Check if conversion already exists
    const existingConversion = input.existingTracking.adsConversions.find(
      c => c.category === category
    );
    
    if (!existingConversion && input.integrations.googleAds?.status === 'connected') {
      adsConversions.push({
        name: formatConversionName(goal),
        category,
        countingType: goal === 'purchase' ? 'MANY_PER_CLICK' : 'ONE_PER_CLICK',
        defaultValue: goal === 'purchase' ? undefined : getDefaultValue(goal),
        currencyCode: 'USD',
        reason: `Track ${goal} conversions for campaign optimization`,
      });
    }
    
    // Check if event already exists
    const existingEvent = input.existingTracking.ga4Events.find(
      e => e.eventName === eventName
    );
    
    if (!existingEvent && input.integrations.googleAnalytics?.status === 'connected') {
      ga4Events.push({
        eventName,
        parameters: getEventParameters(goal),
        markAsConversion: true,
        reason: `Track ${goal} events for analytics and attribution`,
      });
    }
    
    // Generate GTM tags if connected
    if (input.integrations.gtm?.status === 'connected') {
      const triggerName = `${goal}_trigger`;
      
      gtmTriggers.push({
        name: triggerName,
        type: getTriggerType(goal),
        conditions: getTriggerConditions(goal, input.websiteAnalysis),
        reason: `Fire when ${goal} action is detected`,
      });
      
      gtmTags.push({
        name: `GA4 - ${formatConversionName(goal)}`,
        type: 'gaawc',
        config: {
          eventName,
          measurementId: '{{GA4 Measurement ID}}',
        },
        triggerNames: [triggerName],
        reason: `Send ${goal} event to GA4`,
      });
    }
  }
  
  // Add recommendations
  if (input.integrations.googleAds?.status === 'connected' && 
      input.integrations.googleAnalytics?.status === 'connected') {
    recommendations.push({
      type: 'action',
      title: 'Link GA4 to Google Ads',
      description: 'Linking your GA4 property to Google Ads enables better attribution and audience sharing.',
      priority: 'high',
    });
  }
  
  if (input.businessGoals.includes('purchase')) {
    recommendations.push({
      type: 'action',
      title: 'Enable Enhanced Conversions',
      description: 'Enhanced conversions improve measurement accuracy by sending hashed customer data.',
      priority: 'high',
    });
  }
  
  recommendations.push({
    type: 'info',
    title: 'Test Your Tracking',
    description: 'After deploying, use Google Tag Assistant and GA4 DebugView to verify events are firing correctly.',
    priority: 'medium',
  });
  
  return {
    adsConversions,
    ga4Events,
    gtmTags,
    gtmTriggers,
    linkAdsToGa4: input.integrations.googleAds?.status === 'connected' && 
                   input.integrations.googleAnalytics?.status === 'connected',
    recommendations,
  };
}

function formatConversionName(goal: GoalType): string {
  const names: Record<GoalType, string> = {
    purchase: 'Purchase Completed',
    lead: 'Lead Generated',
    booking: 'Booking Completed',
    signup: 'Sign Up Completed',
    call: 'Phone Call',
    add_to_cart: 'Add to Cart',
    page_view: 'Key Page View',
    form_submit: 'Form Submission',
    click: 'Important Click',
    custom: 'Custom Conversion',
  };
  return names[goal];
}

function getDefaultValue(goal: GoalType): number | undefined {
  const values: Partial<Record<GoalType, number>> = {
    lead: 50,
    booking: 100,
    signup: 25,
    call: 75,
    form_submit: 30,
  };
  return values[goal];
}

function getEventParameters(goal: GoalType): GA4EventParameter[] {
  const baseParams: GA4EventParameter[] = [];
  
  switch (goal) {
    case 'purchase':
      return [
        { name: 'transaction_id', type: 'string', scope: 'event' },
        { name: 'value', type: 'currency', scope: 'event' },
        { name: 'currency', type: 'string', scope: 'event' },
        { name: 'items', type: 'string', scope: 'event' },
      ];
    case 'lead':
    case 'form_submit':
      return [
        { name: 'form_id', type: 'string', scope: 'event' },
        { name: 'form_name', type: 'string', scope: 'event' },
        { name: 'value', type: 'currency', scope: 'event' },
      ];
    case 'booking':
      return [
        { name: 'booking_id', type: 'string', scope: 'event' },
        { name: 'service_name', type: 'string', scope: 'event' },
        { name: 'value', type: 'currency', scope: 'event' },
        { name: 'booking_date', type: 'string', scope: 'event' },
      ];
    case 'add_to_cart':
      return [
        { name: 'item_id', type: 'string', scope: 'event' },
        { name: 'item_name', type: 'string', scope: 'event' },
        { name: 'value', type: 'currency', scope: 'event' },
        { name: 'quantity', type: 'number', scope: 'event' },
      ];
    case 'call':
      return [
        { name: 'phone_number', type: 'string', scope: 'event' },
        { name: 'call_duration', type: 'number', scope: 'event' },
      ];
    default:
      return baseParams;
  }
}

function getTriggerType(goal: GoalType): 'pageview' | 'click' | 'formSubmission' | 'customEvent' {
  switch (goal) {
    case 'page_view':
      return 'pageview';
    case 'click':
    case 'call':
      return 'click';
    case 'form_submit':
    case 'lead':
      return 'formSubmission';
    default:
      return 'customEvent';
  }
}

function getTriggerConditions(goal: GoalType, analysis: TrackingAIPlanInput['websiteAnalysis']): Record<string, unknown> {
  switch (goal) {
    case 'page_view':
      const thankYouPages = analysis.detectedPages.filter(p => p.type === 'thank_you');
      return {
        urlPatterns: thankYouPages.map(p => p.url),
      };
    case 'form_submit':
      const forms = analysis.detectedForms;
      return {
        formSelectors: forms.map(f => f.selector),
      };
    case 'click':
    case 'call':
      return {
        clickClasses: ['cta-button', 'phone-link'],
        clickText: goal === 'call' ? ['Call', 'Phone'] : undefined,
      };
    default:
      return {
        eventName: GOAL_TO_GA4_EVENT[goal],
      };
  }
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const trackingAiPlannerService: TrackingAiPlannerService = {
  /**
   * Generate a comprehensive tracking plan using AI
   */
  async generatePlan(input: TrackingAIPlanInput): Promise<TrackingAIPlan> {
    const supabase = await createClient();
    
    let planData: TrackingPlanData | null = null;
    let aiModel = 'rule-based';
    let aiReasoning = 'Generated using rule-based logic';
    let confidenceScore = 0.85;
    
    try {
      // Try to use LLM for more sophisticated planning
      const apiKey = await getProviderApiKey('openai', input.orgId);
      
      if (apiKey) {
        const prompt = buildPlanPrompt(input);
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          const content = data.choices[0]?.message?.content;
          
          if (content) {
            const parsed = JSON.parse(content);
            planData = {
              adsConversions: parsed.adsConversions || [],
              ga4Events: parsed.ga4Events || [],
              gtmTags: parsed.gtmTags || [],
              gtmTriggers: parsed.gtmTriggers || [],
              linkAdsToGa4: parsed.linkAdsToGa4 ?? true,
              recommendations: parsed.recommendations || [],
            };
            aiModel = 'gpt-4o';
            aiReasoning = parsed.reasoning || 'AI-generated tracking plan';
            confidenceScore = 0.92;
            
            // Record usage
            await recordLlmUsage({
              orgId: input.orgId,
              provider: 'openai',
              model: 'gpt-4o',
              kind: 'chat',
              inputTokens: data.usage?.prompt_tokens || 0,
              outputTokens: data.usage?.completion_tokens || 0,
            });
          }
        }
      }
    } catch (error) {
      console.warn('AI planning failed, using rule-based fallback:', error);
    }
    
    // Fallback to rule-based planning
    if (!planData) {
      planData = generateDefaultPlan(input);
    }
    
    // Save plan to database
    const { data: savedPlan, error } = await supabase
      .from('tracking_ai_plans')
      .insert({
        org_id: input.orgId,
        website_id: input.websiteId,
        name: `Tracking Plan - ${new Date().toLocaleDateString()}`,
        description: `Auto-generated plan for ${input.businessGoals.join(', ')} tracking`,
        business_goals: input.businessGoals,
        website_analysis: input.websiteAnalysis,
        existing_tracking: input.existingTracking,
        plan_data: planData,
        status: 'draft',
        execution_progress: 0,
        execution_log: [],
        ai_model: aiModel,
        ai_reasoning: aiReasoning,
        confidence_score: confidenceScore,
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to save plan: ${error.message}`);
    }
    
    // Log audit
    await supabase.from('tracking_audit_log').insert({
      org_id: input.orgId,
      actor_type: 'ai',
      action: 'generate_tracking_plan',
      resource_type: 'tracking_plan',
      resource_id: savedPlan.id,
      after_state: { planData, aiModel },
      success: true,
    });
    
    return {
      id: savedPlan.id,
      orgId: savedPlan.org_id,
      websiteId: savedPlan.website_id,
      name: savedPlan.name,
      description: savedPlan.description,
      planData,
      status: 'draft',
      executionProgress: 0,
      executionLog: [],
      aiModel,
      aiReasoning,
      confidenceScore,
      createdAt: new Date(savedPlan.created_at),
      updatedAt: new Date(savedPlan.updated_at),
    };
  },
  
  /**
   * Refine an existing plan based on user feedback
   */
  async refinePlan(planId: string, feedback: string): Promise<TrackingAIPlan> {
    const supabase = await createClient();
    
    // Get existing plan
    const { data: existingPlan, error: fetchError } = await supabase
      .from('tracking_ai_plans')
      .select('*')
      .eq('id', planId)
      .single();
    
    if (fetchError || !existingPlan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    
    // For now, just update the description with feedback
    // In production, this would re-run AI with the feedback
    const { data: updatedPlan, error: updateError } = await supabase
      .from('tracking_ai_plans')
      .update({
        description: `${existingPlan.description}\n\nUser feedback: ${feedback}`,
        ai_reasoning: `${existingPlan.ai_reasoning}\n\nRefined based on: ${feedback}`,
      })
      .eq('id', planId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update plan: ${updateError.message}`);
    }
    
    return {
      id: updatedPlan.id,
      orgId: updatedPlan.org_id,
      websiteId: updatedPlan.website_id,
      name: updatedPlan.name,
      description: updatedPlan.description,
      planData: updatedPlan.plan_data,
      status: updatedPlan.status,
      executionProgress: updatedPlan.execution_progress,
      executionLog: updatedPlan.execution_log,
      aiModel: updatedPlan.ai_model,
      aiReasoning: updatedPlan.ai_reasoning,
      confidenceScore: updatedPlan.confidence_score,
      createdAt: new Date(updatedPlan.created_at),
      updatedAt: new Date(updatedPlan.updated_at),
    };
  },
  
  /**
   * Validate a tracking plan before execution
   */
  async validatePlan(plan: TrackingAIPlan): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    // Check for duplicate conversion names
    const conversionNames = plan.planData.adsConversions.map(c => c.name);
    const duplicateConversions = conversionNames.filter(
      (name, index) => conversionNames.indexOf(name) !== index
    );
    if (duplicateConversions.length > 0) {
      issues.push(`Duplicate conversion names: ${duplicateConversions.join(', ')}`);
    }
    
    // Check for duplicate event names
    const eventNames = plan.planData.ga4Events.map(e => e.eventName);
    const duplicateEvents = eventNames.filter(
      (name, index) => eventNames.indexOf(name) !== index
    );
    if (duplicateEvents.length > 0) {
      issues.push(`Duplicate event names: ${duplicateEvents.join(', ')}`);
    }
    
    // Check GA4 event naming conventions
    for (const event of plan.planData.ga4Events) {
      if (!/^[a-z][a-z0-9_]*$/.test(event.eventName)) {
        issues.push(`Invalid GA4 event name: ${event.eventName} (must be snake_case)`);
      }
      if (event.eventName.length > 40) {
        issues.push(`Event name too long: ${event.eventName} (max 40 characters)`);
      }
    }
    
    // Check GTM trigger references
    const triggerNames = plan.planData.gtmTriggers.map(t => t.name);
    for (const tag of plan.planData.gtmTags) {
      for (const triggerName of tag.triggerNames) {
        if (!triggerNames.includes(triggerName)) {
          issues.push(`Tag "${tag.name}" references unknown trigger: ${triggerName}`);
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues,
    };
  },
};

export default trackingAiPlannerService;
