/**
 * Facebook Tracking Module
 * 
 * Complete Facebook Pixel and Conversions API integration for tracking
 * 
 * Features:
 * - Facebook OAuth authentication
 * - Pixel management and installation
 * - Conversions API (CAPI) for server-side events
 * - Event mapping and automation
 * - Event testing and validation
 * - Pixel health monitoring
 * - SHA-256 hashing for user data
 * - Event deduplication
 */

// Types
export * from './types';

// Utilities
export * from './utils';

// Services
export { facebookAuthService } from './auth-service';
export { facebookPixelService } from './pixel-service';
export { facebookCapiService } from './capi-service';
export { facebookEventMappingService } from './event-mapping-service';
export { facebookEventTesterService } from './event-tester-service';
