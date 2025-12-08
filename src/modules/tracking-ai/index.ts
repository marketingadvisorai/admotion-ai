/**
 * Tracking AI Module
 * 
 * Comprehensive tracking automation for Google Ads MCP, Google Analytics MCP, GTM, and Facebook
 * 
 * Features:
 * - Google Ads MCP integration for conversion tracking
 * - Google Analytics MCP integration for event tracking
 * - Facebook Pixel and Conversions API integration
 * - AI-powered tracking plan generation
 * - Automated plan execution
 * - Health monitoring and auto-fix
 * - Audit logging
 */

// Types
export * from './types';

// Google Providers
export { googleAdsMcpService } from './providers/google-ads-mcp';
export { googleAnalyticsMcpService } from './providers/google-analytics-mcp';
export { googleTagManagerService } from './providers/google-tag-manager';

// Facebook Providers
export * from './providers/facebook';

// Services
export { trackingAiPlannerService } from './services/ai-planner';
export { trackingExecutorService } from './services/executor';
export { trackingHealthService } from './services/health-monitor';
