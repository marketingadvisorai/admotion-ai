/**
 * Facebook Event Mapping Service
 * Manages event mappings between website actions and Facebook events
 */

import { createClient } from '@/lib/db/server';
import type {
  FacebookEventMapping,
  CreateEventMappingInput,
  FacebookTriggerType,
  TriggerOperator,
  ValueMapping,
  UserDataMapping,
} from './types';

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const facebookEventMappingService = {
  /**
   * List all event mappings for an organization
   */
  async listMappings(orgId: string): Promise<FacebookEventMapping[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .select('*')
      .eq('org_id', orgId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to list mappings: ${error.message}`);
    }
    
    return (data || []).map(row => this.mapDbToMapping(row));
  },
  
  /**
   * Get mappings for a specific integration
   */
  async listIntegrationMappings(integrationId: string): Promise<FacebookEventMapping[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .select('*')
      .eq('integration_id', integrationId)
      .order('priority', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to list mappings: ${error.message}`);
    }
    
    return (data || []).map(row => this.mapDbToMapping(row));
  },
  
  /**
   * Get active mappings only
   */
  async listActiveMappings(orgId: string): Promise<FacebookEventMapping[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('priority', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to list active mappings: ${error.message}`);
    }
    
    return (data || []).map(row => this.mapDbToMapping(row));
  },
  
  /**
   * Get a specific mapping by ID
   */
  async getMapping(mappingId: string): Promise<FacebookEventMapping> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .select('*')
      .eq('id', mappingId)
      .single();
    
    if (error || !data) {
      throw new Error(`Mapping not found: ${mappingId}`);
    }
    
    return this.mapDbToMapping(data);
  },
  
  /**
   * Create a new event mapping
   */
  async createMapping(input: CreateEventMappingInput): Promise<FacebookEventMapping> {
    const supabase = await createClient();
    
    // Validate input
    this.validateMappingInput(input);
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .insert({
        org_id: input.orgId,
        integration_id: input.integrationId,
        event_name: input.eventName,
        custom_event_name: input.customEventName,
        is_standard_event: input.isStandardEvent ?? this.isStandardEvent(input.eventName),
        trigger_type: input.triggerType,
        trigger_value: input.triggerValue,
        trigger_operator: input.triggerOperator || 'contains',
        value_mapping: input.valueMapping || {},
        user_data_mapping: input.userDataMapping || {},
        custom_data_mapping: input.customDataMapping || {},
        dedupe_enabled: input.dedupeEnabled ?? true,
        dedupe_window_seconds: input.dedupeWindowSeconds || 3600,
        is_active: true,
        priority: 0,
      })
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to create mapping: ${error?.message}`);
    }
    
    // Log audit
    await this.logAudit(input.orgId, 'create_mapping', data.id, { eventName: input.eventName });
    
    return this.mapDbToMapping(data);
  },
  
  /**
   * Update an existing mapping
   */
  async updateMapping(
    mappingId: string,
    updates: Partial<CreateEventMappingInput>
  ): Promise<FacebookEventMapping> {
    const supabase = await createClient();
    
    // Get existing mapping for org_id
    const existing = await this.getMapping(mappingId);
    
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.eventName !== undefined) {
      dbUpdates.event_name = updates.eventName;
      dbUpdates.is_standard_event = updates.isStandardEvent ?? this.isStandardEvent(updates.eventName);
    }
    if (updates.customEventName !== undefined) dbUpdates.custom_event_name = updates.customEventName;
    if (updates.triggerType !== undefined) dbUpdates.trigger_type = updates.triggerType;
    if (updates.triggerValue !== undefined) dbUpdates.trigger_value = updates.triggerValue;
    if (updates.triggerOperator !== undefined) dbUpdates.trigger_operator = updates.triggerOperator;
    if (updates.valueMapping !== undefined) dbUpdates.value_mapping = updates.valueMapping;
    if (updates.userDataMapping !== undefined) dbUpdates.user_data_mapping = updates.userDataMapping;
    if (updates.customDataMapping !== undefined) dbUpdates.custom_data_mapping = updates.customDataMapping;
    if (updates.dedupeEnabled !== undefined) dbUpdates.dedupe_enabled = updates.dedupeEnabled;
    if (updates.dedupeWindowSeconds !== undefined) dbUpdates.dedupe_window_seconds = updates.dedupeWindowSeconds;
    
    const { data, error } = await supabase
      .from('facebook_event_mappings')
      .update(dbUpdates)
      .eq('id', mappingId)
      .select()
      .single();
    
    if (error || !data) {
      throw new Error(`Failed to update mapping: ${error?.message}`);
    }
    
    // Log audit
    await this.logAudit(existing.orgId, 'update_mapping', mappingId, { updates });
    
    return this.mapDbToMapping(data);
  },
  
  /**
   * Delete a mapping
   */
  async deleteMapping(mappingId: string): Promise<void> {
    const supabase = await createClient();
    
    // Get existing mapping for org_id
    const existing = await this.getMapping(mappingId);
    
    const { error } = await supabase
      .from('facebook_event_mappings')
      .delete()
      .eq('id', mappingId);
    
    if (error) {
      throw new Error(`Failed to delete mapping: ${error.message}`);
    }
    
    // Log audit
    await this.logAudit(existing.orgId, 'delete_mapping', mappingId, { eventName: existing.eventName });
  },
  
  /**
   * Toggle mapping active status
   */
  async toggleMapping(mappingId: string, isActive: boolean): Promise<void> {
    const supabase = await createClient();
    
    const existing = await this.getMapping(mappingId);
    
    const { error } = await supabase
      .from('facebook_event_mappings')
      .update({ is_active: isActive })
      .eq('id', mappingId);
    
    if (error) {
      throw new Error(`Failed to toggle mapping: ${error.message}`);
    }
    
    // Log audit
    await this.logAudit(existing.orgId, isActive ? 'enable_mapping' : 'disable_mapping', mappingId);
  },
  
  /**
   * Update mapping priority
   */
  async updatePriority(mappingId: string, priority: number): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('facebook_event_mappings')
      .update({ priority })
      .eq('id', mappingId);
    
    if (error) {
      throw new Error(`Failed to update priority: ${error.message}`);
    }
  },
  
  /**
   * Record that a mapping was fired
   */
  async recordFire(mappingId: string): Promise<void> {
    const supabase = await createClient();
    
    // Increment fire count and update last fired
    const { data: mapping } = await supabase
      .from('facebook_event_mappings')
      .select('fires_24h')
      .eq('id', mappingId)
      .single();
    
    await supabase
      .from('facebook_event_mappings')
      .update({
        fires_24h: (mapping?.fires_24h || 0) + 1,
        last_fired_at: new Date().toISOString(),
      })
      .eq('id', mappingId);
  },
  
  /**
   * Get suggested mappings based on goals
   */
  getSuggestedMappings(goals: string[]): Partial<CreateEventMappingInput>[] {
    const suggestions: Partial<CreateEventMappingInput>[] = [];
    
    const goalToMappings: Record<string, Partial<CreateEventMappingInput>[]> = {
      purchase: [
        {
          eventName: 'Purchase',
          triggerType: 'url_match',
          triggerValue: '/thank-you',
          triggerOperator: 'contains',
          valueMapping: { valueField: 'order_total', currencyField: 'currency' },
        },
        {
          eventName: 'InitiateCheckout',
          triggerType: 'url_match',
          triggerValue: '/checkout',
          triggerOperator: 'contains',
        },
        {
          eventName: 'AddToCart',
          triggerType: 'css_selector',
          triggerValue: '.add-to-cart, [data-action="add-to-cart"]',
          triggerOperator: 'equals',
        },
      ],
      lead: [
        {
          eventName: 'Lead',
          triggerType: 'form_submit',
          triggerValue: 'form[action*="contact"], .contact-form',
          triggerOperator: 'equals',
          userDataMapping: { emailField: 'email', phoneField: 'phone' },
        },
        {
          eventName: 'SubmitApplication',
          triggerType: 'form_submit',
          triggerValue: 'form[action*="apply"], .application-form',
          triggerOperator: 'equals',
        },
      ],
      signup: [
        {
          eventName: 'CompleteRegistration',
          triggerType: 'url_match',
          triggerValue: '/signup/success',
          triggerOperator: 'contains',
          userDataMapping: { emailField: 'email' },
        },
      ],
      booking: [
        {
          eventName: 'Schedule',
          triggerType: 'url_match',
          triggerValue: '/booking/confirmed',
          triggerOperator: 'contains',
          valueMapping: { valueField: 'booking_value' },
        },
      ],
      page_view: [
        {
          eventName: 'ViewContent',
          triggerType: 'url_match',
          triggerValue: '/product/',
          triggerOperator: 'contains',
          customDataMapping: { content_name: 'product_name', content_id: 'product_id' },
        },
      ],
    };
    
    for (const goal of goals) {
      const mappings = goalToMappings[goal];
      if (mappings) {
        suggestions.push(...mappings);
      }
    }
    
    return suggestions;
  },
  
  // ============================================
  // PRIVATE HELPERS
  // ============================================
  
  validateMappingInput(input: CreateEventMappingInput): void {
    if (!input.orgId) {
      throw new Error('orgId is required');
    }
    if (!input.integrationId) {
      throw new Error('integrationId is required');
    }
    if (!input.eventName) {
      throw new Error('eventName is required');
    }
    if (!input.triggerType) {
      throw new Error('triggerType is required');
    }
    if (!input.triggerValue) {
      throw new Error('triggerValue is required');
    }
  },
  
  isStandardEvent(eventName: string): boolean {
    const standardEvents = [
      'AddPaymentInfo', 'AddToCart', 'AddToWishlist', 'CompleteRegistration',
      'Contact', 'CustomizeProduct', 'Donate', 'FindLocation', 'InitiateCheckout',
      'Lead', 'PageView', 'Purchase', 'Schedule', 'Search', 'StartTrial',
      'SubmitApplication', 'Subscribe', 'ViewContent',
    ];
    return standardEvents.includes(eventName);
  },
  
  async logAudit(
    orgId: string,
    action: string,
    resourceId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const supabase = await createClient();
    
    await supabase.from('facebook_audit_logs').insert({
      org_id: orgId,
      action,
      resource_type: 'event_mapping',
      resource_id: resourceId,
      metadata: metadata || {},
      success: true,
    });
  },
  
  mapDbToMapping(row: Record<string, unknown>): FacebookEventMapping {
    return {
      id: row.id as string,
      orgId: row.org_id as string,
      integrationId: row.integration_id as string,
      eventName: row.event_name as string,
      customEventName: row.custom_event_name as string | undefined,
      isStandardEvent: row.is_standard_event as boolean,
      triggerType: row.trigger_type as FacebookTriggerType,
      triggerValue: row.trigger_value as string,
      triggerOperator: row.trigger_operator as TriggerOperator,
      valueMapping: row.value_mapping as ValueMapping,
      userDataMapping: row.user_data_mapping as UserDataMapping,
      customDataMapping: row.custom_data_mapping as Record<string, string>,
      dedupeEnabled: row.dedupe_enabled as boolean,
      dedupeWindowSeconds: row.dedupe_window_seconds as number,
      isActive: row.is_active as boolean,
      priority: row.priority as number,
      fires24h: row.fires_24h as number,
      lastFiredAt: row.last_fired_at ? new Date(row.last_fired_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  },
};
