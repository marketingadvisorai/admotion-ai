/**
 * Facebook Event Tester Service
 * Test events with Facebook's Event Testing tool
 */

import { facebookAuthService } from './auth-service';
import { facebookCapiService } from './capi-service';
import { generateEventId } from './utils';
import type {
  SendCapiEventInput,
  FacebookCapiResponse,
} from './types';

// ============================================
// CONSTANTS
// ============================================

const FB_GRAPH_URL = 'https://graph.facebook.com/v21.0';

// ============================================
// TYPES
// ============================================

export interface TestEventResult {
  success: boolean;
  eventId: string;
  response: FacebookCapiResponse;
  testEventCode: string;
}

export interface TestEventDetails {
  eventName: string;
  eventTime: number;
  matched: boolean;
  matchQuality?: number;
  errors?: string[];
  warnings?: string[];
}

export interface TestResults {
  eventsReceived: number;
  eventDetails: TestEventDetails[];
  matchRate?: number;
}

// ============================================
// SERVICE IMPLEMENTATION
// ============================================

export const facebookEventTesterService = {
  /**
   * Send a test event and get immediate feedback
   */
  async testEvent(
    integrationId: string,
    input: SendCapiEventInput
  ): Promise<TestEventResult> {
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    if (!integration.pixelId) {
      throw new Error('No pixel selected for this integration');
    }
    
    // Generate test event code if not provided
    const testEventCode = input.testEventCode || 
      `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    // Generate event ID for tracking
    const eventId = input.eventId || generateEventId();
    
    // Build test event input
    const testInput: SendCapiEventInput = {
      ...input,
      pixelId: integration.pixelId,
      eventId,
      testEventCode,
      eventTime: input.eventTime || Math.floor(Date.now() / 1000),
    };
    
    // Send the event
    const response = await facebookCapiService.sendEvent(integrationId, testInput);
    
    return {
      success: response.events_received > 0,
      eventId,
      response,
      testEventCode,
    };
  },
  
  /**
   * Send multiple test events
   */
  async testBatchEvents(
    integrationId: string,
    events: SendCapiEventInput[],
    testEventCode?: string
  ): Promise<TestEventResult[]> {
    const results: TestEventResult[] = [];
    const code = testEventCode || 
      `TEST_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    
    for (const event of events) {
      try {
        const result = await this.testEvent(integrationId, {
          ...event,
          testEventCode: code,
        });
        results.push(result);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        results.push({
          success: false,
          eventId: event.eventId || generateEventId(),
          response: {
            events_received: 0,
            messages: [message],
          },
          testEventCode: code,
        });
      }
    }
    
    return results;
  },
  
  /**
   * Get test event results from Facebook
   * Note: Facebook's Event Testing API has limited availability
   */
  async getTestResults(
    integrationId: string,
    testEventCode: string
  ): Promise<TestResults> {
    const integration = await facebookAuthService.getIntegration(integrationId);
    
    if (!integration.pixelId) {
      throw new Error('No pixel selected for this integration');
    }
    
    // Try to get test events from the pixel
    // Note: This endpoint may not be available for all accounts
    try {
      const response = await fetch(
        `${FB_GRAPH_URL}/${integration.pixelId}/test_events?test_event_code=${testEventCode}`,
        {
          headers: {
            'Authorization': `Bearer ${integration.accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        // Fall back to basic response
        return {
          eventsReceived: 0,
          eventDetails: [],
        };
      }
      
      const data = await response.json();
      
      const eventDetails: TestEventDetails[] = (data.data || []).map((event: Record<string, unknown>) => ({
        eventName: event.event_name as string,
        eventTime: event.event_time as number,
        matched: (event.match_quality as number) > 0,
        matchQuality: event.match_quality as number,
        errors: event.errors as string[] || [],
        warnings: event.warnings as string[] || [],
      }));
      
      const matchedCount = eventDetails.filter(e => e.matched).length;
      const matchRate = eventDetails.length > 0 
        ? (matchedCount / eventDetails.length) * 100 
        : undefined;
      
      return {
        eventsReceived: eventDetails.length,
        eventDetails,
        matchRate,
      };
    } catch {
      // Return empty results on error
      return {
        eventsReceived: 0,
        eventDetails: [],
      };
    }
  },
  
  /**
   * Generate sample test events for common scenarios
   */
  generateSampleEvents(): SendCapiEventInput[] {
    const now = Math.floor(Date.now() / 1000);
    
    return [
      // PageView
      {
        pixelId: '', // Will be filled by caller
        eventName: 'PageView',
        eventTime: now,
        eventSourceUrl: 'https://example.com/product/123',
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'Mozilla/5.0 (Test Agent)',
        },
      },
      // ViewContent
      {
        pixelId: '',
        eventName: 'ViewContent',
        eventTime: now,
        eventSourceUrl: 'https://example.com/product/123',
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'Mozilla/5.0 (Test Agent)',
        },
        customData: {
          content_name: 'Test Product',
          content_ids: ['123'],
          content_type: 'product',
          value: 99.99,
          currency: 'USD',
        },
      },
      // AddToCart
      {
        pixelId: '',
        eventName: 'AddToCart',
        eventTime: now,
        eventSourceUrl: 'https://example.com/product/123',
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'Mozilla/5.0 (Test Agent)',
        },
        customData: {
          content_ids: ['123'],
          content_type: 'product',
          value: 99.99,
          currency: 'USD',
          num_items: 1,
        },
      },
      // Lead
      {
        pixelId: '',
        eventName: 'Lead',
        eventTime: now,
        eventSourceUrl: 'https://example.com/contact',
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'Mozilla/5.0 (Test Agent)',
        },
        customData: {
          content_name: 'Contact Form Submission',
        },
      },
      // Purchase
      {
        pixelId: '',
        eventName: 'Purchase',
        eventTime: now,
        eventSourceUrl: 'https://example.com/order/complete',
        actionSource: 'website',
        userData: {
          client_ip_address: '127.0.0.1',
          client_user_agent: 'Mozilla/5.0 (Test Agent)',
        },
        customData: {
          content_ids: ['123', '456'],
          content_type: 'product',
          value: 199.99,
          currency: 'USD',
          num_items: 2,
          order_id: 'ORDER-12345',
        },
      },
    ];
  },
  
  /**
   * Validate event data quality
   */
  validateEventQuality(input: SendCapiEventInput): {
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;
    
    // Check required fields
    if (!input.eventName) {
      issues.push('Missing event_name');
      score -= 30;
    }
    
    if (!input.eventTime) {
      issues.push('Missing event_time');
      score -= 10;
    }
    
    // Check user data
    if (!input.userData) {
      issues.push('Missing user_data');
      score -= 20;
      recommendations.push('Add user_data for better event matching');
    } else {
      const ud = input.userData;
      
      // Check for identifiers
      const hasEmail = ud.em && ud.em.length > 0;
      const hasPhone = ud.ph && ud.ph.length > 0;
      const hasExternalId = ud.external_id && ud.external_id.length > 0;
      const hasFbc = !!ud.fbc;
      const hasFbp = !!ud.fbp;
      
      if (!hasEmail && !hasPhone && !hasExternalId) {
        recommendations.push('Add email, phone, or external_id for better matching');
        score -= 10;
      }
      
      if (!hasFbc && !hasFbp) {
        recommendations.push('Include fbc/fbp cookies for improved attribution');
        score -= 5;
      }
      
      if (!ud.client_ip_address) {
        recommendations.push('Include client_ip_address for geolocation matching');
        score -= 5;
      }
      
      if (!ud.client_user_agent) {
        recommendations.push('Include client_user_agent for device matching');
        score -= 5;
      }
    }
    
    // Check custom data for specific events
    if (input.eventName === 'Purchase') {
      if (!input.customData?.value) {
        issues.push('Purchase events should include value');
        score -= 15;
      }
      if (!input.customData?.currency) {
        issues.push('Purchase events should include currency');
        score -= 10;
      }
    }
    
    if (input.eventName === 'ViewContent' || input.eventName === 'AddToCart') {
      if (!input.customData?.content_ids) {
        recommendations.push('Include content_ids for better product matching');
        score -= 5;
      }
    }
    
    // Ensure score doesn't go below 0
    score = Math.max(0, score);
    
    return { score, issues, recommendations };
  },
};
