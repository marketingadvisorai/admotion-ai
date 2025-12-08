/**
 * Tracking AI Module
 * 
 * Comprehensive tracking automation for Google Ads MCP, Google Analytics MCP, and GTM
 * 
 * Features:
 * - Google Ads MCP integration for conversion tracking
 * - Google Analytics MCP integration for event tracking
 * - AI-powered tracking plan generation
 * - Automated plan execution
 * - Health monitoring and auto-fix
 * - Audit logging
 */

// Types
export * from './types';

// Providers
export { googleAdsMcpService } from './providers/google-ads-mcp';
export { googleAnalyticsMcpService } from './providers/google-analytics-mcp';
export { googleTagManagerService } from './providers/google-tag-manager';

// Services
export { trackingAiPlannerService } from './services/ai-planner';
export { trackingExecutorService } from './services/executor';
export { trackingHealthService } from './services/health-monitor';
