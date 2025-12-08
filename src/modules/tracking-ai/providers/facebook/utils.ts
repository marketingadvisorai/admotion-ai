/**
 * Facebook Tracking Utility Functions
 * Hashing, validation, and helper functions
 */

import { createHash } from 'crypto';
import type {
  FacebookUserData,
  FacebookEventPayload,
  FacebookStandardEvent,
} from './types';

// ============================================
// HASHING UTILITIES
// ============================================

/**
 * SHA-256 hash a value after normalizing it
 */
export function hashValue(value: string | undefined | null): string | undefined {
  if (!value || typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  
  // Normalize: trim, lowercase
  const normalized = value.trim().toLowerCase();
  
  // SHA-256 hash
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash an email address
 */
export function hashEmail(email: string | undefined | null): string | undefined {
  if (!email) return undefined;
  
  // Remove whitespace, lowercase
  const normalized = email.trim().toLowerCase();
  
  // Validate email format
  if (!isValidEmail(normalized)) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a phone number
 */
export function hashPhone(phone: string | undefined | null, countryCode?: string): string | undefined {
  if (!phone) return undefined;
  
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, '');
  
  // Ensure it starts with country code
  if (!normalized.startsWith('+') && countryCode) {
    normalized = countryCode + normalized;
  }
  
  // Remove + if present
  normalized = normalized.replace('+', '');
  
  if (normalized.length < 10) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a name (first or last)
 */
export function hashName(name: string | undefined | null): string | undefined {
  if (!name) return undefined;
  
  // Normalize: trim, lowercase, remove non-alpha characters
  const normalized = name.trim().toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.length === 0) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a city name
 */
export function hashCity(city: string | undefined | null): string | undefined {
  if (!city) return undefined;
  
  // Normalize: trim, lowercase, remove non-alpha and spaces
  const normalized = city.trim().toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '');
  
  if (normalized.length === 0) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a state/province code
 */
export function hashState(state: string | undefined | null): string | undefined {
  if (!state) return undefined;
  
  // Normalize: trim, lowercase, keep only letters
  const normalized = state.trim().toLowerCase().replace(/[^a-z]/g, '');
  
  if (normalized.length === 0) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a zip/postal code
 */
export function hashZip(zip: string | undefined | null): string | undefined {
  if (!zip) return undefined;
  
  // Normalize: trim, lowercase, remove non-alphanumeric
  const normalized = zip.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (normalized.length === 0) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash a country code
 */
export function hashCountry(country: string | undefined | null): string | undefined {
  if (!country) return undefined;
  
  // Normalize to 2-letter ISO code, lowercase
  const normalized = country.trim().toLowerCase().slice(0, 2);
  
  if (normalized.length !== 2) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Hash an external ID
 */
export function hashExternalId(externalId: string | undefined | null): string | undefined {
  if (!externalId) return undefined;
  
  const normalized = externalId.trim();
  
  if (normalized.length === 0) {
    return undefined;
  }
  
  return createHash('sha256').update(normalized).digest('hex');
}

// ============================================
// USER DATA BUILDER
// ============================================

export interface RawUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string;
  fbp?: string;
}

/**
 * Build hashed user data from raw input
 */
export function buildHashedUserData(raw: RawUserData): FacebookUserData {
  const userData: FacebookUserData = {};
  
  // Hash PII fields
  const hashedEmail = hashEmail(raw.email);
  if (hashedEmail) userData.em = [hashedEmail];
  
  const hashedPhone = hashPhone(raw.phone, raw.country);
  if (hashedPhone) userData.ph = [hashedPhone];
  
  const hashedFirstName = hashName(raw.firstName);
  if (hashedFirstName) userData.fn = [hashedFirstName];
  
  const hashedLastName = hashName(raw.lastName);
  if (hashedLastName) userData.ln = [hashedLastName];
  
  const hashedCity = hashCity(raw.city);
  if (hashedCity) userData.ct = [hashedCity];
  
  const hashedState = hashState(raw.state);
  if (hashedState) userData.st = [hashedState];
  
  const hashedZip = hashZip(raw.zip);
  if (hashedZip) userData.zp = [hashedZip];
  
  const hashedCountry = hashCountry(raw.country);
  if (hashedCountry) userData.country = [hashedCountry];
  
  const hashedExternalId = hashExternalId(raw.externalId);
  if (hashedExternalId) userData.external_id = [hashedExternalId];
  
  // Non-hashed fields
  if (raw.clientIpAddress) userData.client_ip_address = raw.clientIpAddress;
  if (raw.clientUserAgent) userData.client_user_agent = raw.clientUserAgent;
  if (raw.fbc) userData.fbc = raw.fbc;
  if (raw.fbp) userData.fbp = raw.fbp;
  
  return userData;
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Check if email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Validate Facebook event name
 */
export function isValidEventName(eventName: string): boolean {
  if (!eventName || typeof eventName !== 'string') {
    return false;
  }
  
  // Must be alphanumeric with underscores, max 40 chars
  const validPattern = /^[a-zA-Z_][a-zA-Z0-9_]{0,39}$/;
  return validPattern.test(eventName);
}

/**
 * Check if event is a standard Facebook event
 */
export function isStandardEvent(eventName: string): eventName is FacebookStandardEvent {
  const standardEvents: FacebookStandardEvent[] = [
    'AddPaymentInfo',
    'AddToCart',
    'AddToWishlist',
    'CompleteRegistration',
    'Contact',
    'CustomizeProduct',
    'Donate',
    'FindLocation',
    'InitiateCheckout',
    'Lead',
    'PageView',
    'Purchase',
    'Schedule',
    'Search',
    'StartTrial',
    'SubmitApplication',
    'Subscribe',
    'ViewContent',
  ];
  
  return standardEvents.includes(eventName as FacebookStandardEvent);
}

/**
 * Validate event payload before sending
 */
export function validateEventPayload(payload: FacebookEventPayload): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Required fields
  if (!payload.event_name) {
    errors.push('event_name is required');
  } else if (!isValidEventName(payload.event_name)) {
    errors.push('event_name must be alphanumeric with underscores, max 40 chars');
  }
  
  if (!payload.event_time) {
    errors.push('event_time is required');
  } else if (typeof payload.event_time !== 'number') {
    errors.push('event_time must be a Unix timestamp');
  }
  
  if (!payload.event_id) {
    errors.push('event_id is required for deduplication');
  }
  
  if (!payload.action_source) {
    errors.push('action_source is required');
  }
  
  // User data validation
  if (payload.user_data) {
    const ud = payload.user_data;
    
    // At least one identifier should be present
    const hasIdentifier = ud.em || ud.ph || ud.external_id || ud.fbc || ud.fbp;
    if (!hasIdentifier) {
      errors.push('At least one user identifier (email, phone, external_id, fbc, or fbp) is recommended');
    }
    
    // Validate hash format (64 hex chars for SHA-256)
    const hexPattern = /^[a-f0-9]{64}$/;
    
    if (ud.em) {
      for (const hash of ud.em) {
        if (!hexPattern.test(hash)) {
          errors.push('email hashes must be 64-character hex strings');
        }
      }
    }
    
    if (ud.ph) {
      for (const hash of ud.ph) {
        if (!hexPattern.test(hash)) {
          errors.push('phone hashes must be 64-character hex strings');
        }
      }
    }
  }
  
  // Custom data validation for Purchase events
  if (payload.event_name === 'Purchase' && payload.custom_data) {
    if (payload.custom_data.value === undefined) {
      errors.push('value is required for Purchase events');
    }
    if (!payload.custom_data.currency) {
      errors.push('currency is required for Purchase events');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// EVENT ID GENERATION
// ============================================

/**
 * Generate a unique event ID for deduplication
 */
export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * Generate event ID from predictable inputs (for matching browser/server)
 */
export function generateDeterministicEventId(
  eventName: string,
  timestamp: number,
  userIdentifier: string
): string {
  const input = `${eventName}_${timestamp}_${userIdentifier}`;
  return createHash('sha256').update(input).digest('hex').substring(0, 36);
}

// ============================================
// PIXEL CODE GENERATION
// ============================================

/**
 * Generate Facebook Pixel base code
 */
export function generatePixelCode(pixelId: string): string {
  return `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;
}

/**
 * Generate GTM custom HTML tag for pixel
 */
export function generateGtmPixelTag(pixelId: string): string {
  return `<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');
</script>`;
}

/**
 * Generate event tracking code snippet
 */
export function generateEventCode(
  eventName: string,
  customData?: Record<string, unknown>
): string {
  const dataStr = customData ? JSON.stringify(customData, null, 2) : '';
  
  if (dataStr) {
    return `fbq('track', '${eventName}', ${dataStr});`;
  }
  
  return `fbq('track', '${eventName}');`;
}

// ============================================
// URL MATCHING UTILITIES
// ============================================

/**
 * Check if URL matches a pattern
 */
export function urlMatchesPattern(
  url: string,
  pattern: string,
  operator: 'equals' | 'contains' | 'regex' | 'starts_with' | 'ends_with'
): boolean {
  try {
    switch (operator) {
      case 'equals':
        return url === pattern;
      case 'contains':
        return url.includes(pattern);
      case 'starts_with':
        return url.startsWith(pattern);
      case 'ends_with':
        return url.endsWith(pattern);
      case 'regex':
        return new RegExp(pattern).test(url);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

// ============================================
// DATA TRANSFORMATION
// ============================================

/**
 * Convert database row to FacebookIntegration
 */
export function dbRowToIntegration(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    orgId: row.org_id,
    userId: row.user_id,
    accessToken: row.access_token,
    tokenExpiresAt: row.token_expires_at ? new Date(row.token_expires_at as string) : undefined,
    pixelId: row.pixel_id,
    adAccountId: row.ad_account_id,
    businessId: row.business_id,
    connected: row.connected,
    lastValidatedAt: row.last_validated_at ? new Date(row.last_validated_at as string) : undefined,
    validationError: row.validation_error,
    facebookUserId: row.facebook_user_id,
    facebookUserName: row.facebook_user_name,
    scopes: row.scopes || [],
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}
