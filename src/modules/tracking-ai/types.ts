/**
 * Tracking AI Module Types
 * Comprehensive types for Google Ads MCP, Google Analytics MCP, and GTM integration
 */

// ============================================
// PROVIDER TYPES
// ============================================

export type TrackingProvider = 
  | 'google_ads_mcp' 
  | 'google_analytics_mcp' 
  | 'google_tag_manager'
  | 'facebook_pixel'
  | 'meta_capi'
  | 'tiktok_pixel'
  | 'linkedin_insight';

export type IntegrationStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'error' 
  | 'expired';

export type SyncStatus = 'pending' | 'synced' | 'error' | 'outdated';

// ============================================
// OAUTH & AUTHENTICATION
// ============================================

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  scopes: string[];
}

export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  developerToken: string;
  refreshToken: string;
  loginCustomerId?: string;
}

export interface GoogleAnalyticsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

// ============================================
// TRACKING INTEGRATION
// ============================================

export interface TrackingIntegration {
  id: string;
  orgId: string;
  provider: TrackingProvider;
  status: IntegrationStatus;
  
  // OAuth
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  scopes?: string[];
  
  // Account info
  accountId?: string;
  accountName?: string;
  metadata?: Record<string, unknown>;
  
  // Health
  lastSyncAt?: Date;
  lastError?: string;
  errorCount: number;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// GOOGLE ADS MCP TYPES
// ============================================

export interface GoogleAdsCustomer {
  customerId: string;
  descriptiveName: string;
  currencyCode: string;
  timeZone: string;
  isManager: boolean;
  canManageClients: boolean;
}

export interface GoogleAdsConversionAction {
  id: string;
  resourceName: string;
  customerId: string;
  name: string;
  category: ConversionCategory;
  countingType: 'ONE_PER_CLICK' | 'MANY_PER_CLICK';
  valueSettings: ConversionValueSettings;
  attributionModel: string;
  status: 'ENABLED' | 'REMOVED' | 'HIDDEN';
  
  // Stats
  conversionsLast30d?: number;
  conversionValueLast30d?: number;
  lastConversionAt?: Date;
  
  // Linking
  linkedGa4PropertyId?: string;
}

export type ConversionCategory = 
  | 'DEFAULT'
  | 'PAGE_VIEW'
  | 'PURCHASE'
  | 'SIGNUP'
  | 'LEAD'
  | 'DOWNLOAD'
  | 'ADD_TO_CART'
  | 'BEGIN_CHECKOUT'
  | 'SUBSCRIBE_PAID'
  | 'PHONE_CALL_LEAD'
  | 'IMPORTED_LEAD'
  | 'SUBMIT_LEAD_FORM'
  | 'BOOK_APPOINTMENT'
  | 'REQUEST_QUOTE'
  | 'GET_DIRECTIONS'
  | 'OUTBOUND_CLICK'
  | 'CONTACT'
  | 'ENGAGEMENT'
  | 'STORE_VISIT'
  | 'STORE_SALE';

export interface ConversionValueSettings {
  defaultValue?: number;
  defaultCurrencyCode?: string;
  alwaysUseDefaultValue?: boolean;
}

export interface CreateConversionActionInput {
  customerId: string;
  name: string;
  category: ConversionCategory;
  countingType?: 'ONE_PER_CLICK' | 'MANY_PER_CLICK';
  defaultValue?: number;
  currencyCode?: string;
}

// ============================================
// GOOGLE ANALYTICS MCP TYPES
// ============================================

export interface GA4Account {
  name: string;  // accounts/123456
  displayName: string;
  createTime: string;
  updateTime: string;
}

export interface GA4Property {
  name: string;  // properties/123456
  displayName: string;
  propertyType: 'PROPERTY_TYPE_ORDINARY' | 'PROPERTY_TYPE_SUBPROPERTY' | 'PROPERTY_TYPE_ROLLUP';
  createTime: string;
  updateTime: string;
  parent?: string;
  timeZone: string;
  currencyCode: string;
  industryCategory?: string;
}

export interface GA4DataStream {
  name: string;  // properties/123456/dataStreams/789
  type: 'WEB_DATA_STREAM' | 'ANDROID_APP_DATA_STREAM' | 'IOS_APP_DATA_STREAM';
  displayName: string;
  webStreamData?: {
    measurementId: string;
    firebaseAppId?: string;
    defaultUri: string;
  };
  createTime: string;
  updateTime: string;
}

export interface GA4Event {
  id: string;
  propertyId: string;
  eventName: string;
  eventType: 'recommended' | 'custom' | 'automatically_collected';
  parameters?: GA4EventParameter[];
  isConversion: boolean;
  countingMethod: string;
  eventCountLast7d?: number;
  lastReceivedAt?: Date;
}

export interface GA4EventParameter {
  name: string;
  type: 'string' | 'number' | 'currency';
  scope: 'event' | 'user';
  description?: string;
}

export interface CreateGA4EventInput {
  propertyId: string;
  eventName: string;
  parameters?: GA4EventParameter[];
  markAsConversion?: boolean;
}

export interface GA4GoogleAdsLink {
  name: string;  // properties/123456/googleAdsLinks/789
  customerId: string;
  canManageClients: boolean;
  adsPersonalizationEnabled: boolean;
  createTime: string;
  updateTime: string;
}

// ============================================
// GOOGLE TAG MANAGER TYPES
// ============================================

export interface GTMContainer {
  containerId: string;
  name: string;
  publicId: string;
  usageContext: ('web' | 'android' | 'ios' | 'amp')[];
  domainName?: string[];
  notes?: string;
}

export interface GTMWorkspace {
  workspaceId: string;
  containerId: string;
  name: string;
  description?: string;
}

export interface GTMTag {
  tagId: string;
  name: string;
  type: string;
  parameter?: GTMParameter[];
  firingTriggerId?: string[];
  blockingTriggerId?: string[];
  liveOnly?: boolean;
  priority?: number;
  notes?: string;
  paused?: boolean;
}

export interface GTMTrigger {
  triggerId: string;
  name: string;
  type: GTMTriggerType;
  filter?: GTMCondition[];
  autoEventFilter?: GTMCondition[];
  customEventFilter?: GTMCondition[];
  waitForTags?: boolean;
  checkValidation?: boolean;
  waitForTagsTimeout?: number;
  uniqueTriggerId?: string;
  notes?: string;
}

export type GTMTriggerType = 
  | 'pageview'
  | 'domReady'
  | 'windowLoaded'
  | 'click'
  | 'linkClick'
  | 'formSubmission'
  | 'historyChange'
  | 'jsError'
  | 'scrollDepth'
  | 'elementVisibility'
  | 'customEvent'
  | 'timer'
  | 'youTubeVideo';

export interface GTMParameter {
  type: string;
  key: string;
  value: string;
  list?: GTMParameter[];
  map?: GTMParameter[];
}

export interface GTMCondition {
  type: string;
  parameter: GTMParameter[];
}

// ============================================
// TRACKED WEBSITE
// ============================================

export interface TrackedWebsite {
  id: string;
  orgId: string;
  domain: string;
  name?: string;
  
  // Detection
  autoDetectConversions: boolean;
  detectedPages: DetectedPage[];
  detectedForms: DetectedForm[];
  detectedEvents: DetectedEvent[];
  
  // Verification
  verificationMethod?: 'dns' | 'meta_tag' | 'file' | 'gtm' | 'manual';
  verificationStatus: 'pending' | 'verified' | 'failed';
  verifiedAt?: Date;
  
  // GTM
  gtmContainerId?: string;
  gtmWorkspaceId?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DetectedPage {
  url: string;
  title?: string;
  type: 'thank_you' | 'checkout' | 'contact' | 'pricing' | 'landing' | 'other';
  confidence: number;
}

export interface DetectedForm {
  selector: string;
  action?: string;
  method?: string;
  fields: string[];
  type: 'contact' | 'signup' | 'booking' | 'quote' | 'other';
  confidence: number;
}

export interface DetectedEvent {
  name: string;
  type: 'click' | 'scroll' | 'video' | 'download' | 'outbound' | 'custom';
  selector?: string;
  confidence: number;
}

// ============================================
// TRACKING GOALS
// ============================================

export type GoalType = 
  | 'purchase'
  | 'lead'
  | 'booking'
  | 'signup'
  | 'call'
  | 'add_to_cart'
  | 'page_view'
  | 'form_submit'
  | 'click'
  | 'custom';

export interface TrackingGoal {
  id: string;
  orgId: string;
  websiteId?: string;
  name: string;
  goalType: GoalType;
  
  // Value
  valueType: 'fixed' | 'dynamic' | 'none';
  defaultValue?: number;
  currency: string;
  
  // Detection
  detectionRules: DetectionRules;
  
  // Priority
  priority: number;
  isPrimary: boolean;
  status: 'active' | 'paused' | 'archived';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DetectionRules {
  urlPatterns?: string[];
  cssSelectors?: string[];
  eventNames?: string[];
  formSelectors?: string[];
  valueSelector?: string;
  currencySelector?: string;
}

// ============================================
// TRACKING MAPPINGS
// ============================================

export type MappingType = 
  | 'ads_conversion'
  | 'ga4_event'
  | 'gtm_tag'
  | 'pixel_event'
  | 'capi_event';

export interface TrackingMapping {
  id: string;
  orgId: string;
  goalId: string;
  integrationId: string;
  
  platformActionId?: string;
  platformActionName?: string;
  mappingType: MappingType;
  configuration: Record<string, unknown>;
  
  syncStatus: SyncStatus;
  lastSyncedAt?: Date;
  syncError?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// TRACKING HEALTH
// ============================================

export type HealthCheckType = 
  | 'conversion_receiving'
  | 'event_firing'
  | 'tag_loading'
  | 'pixel_active'
  | 'linking_valid'
  | 'enhanced_conversions'
  | 'consent_mode';

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

export interface TrackingHealthStatus {
  id: string;
  orgId: string;
  websiteId?: string;
  integrationId?: string;
  
  checkType: HealthCheckType;
  status: HealthStatus;
  message?: string;
  details: Record<string, unknown>;
  
  autoFixAvailable: boolean;
  fixAction?: string;
  
  lastCheckedAt: Date;
  issueStartedAt?: Date;
  resolvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AI PLANNER TYPES
// ============================================

export interface TrackingAIPlanInput {
  orgId: string;
  websiteId?: string;
  
  // Business context
  businessGoals: GoalType[];
  industry?: string;
  
  // Website analysis
  websiteAnalysis: {
    detectedPages: DetectedPage[];
    detectedForms: DetectedForm[];
    detectedEvents: DetectedEvent[];
  };
  
  // Existing tracking
  existingTracking: {
    adsConversions: GoogleAdsConversionAction[];
    ga4Events: GA4Event[];
    gtmTags: GTMTag[];
  };
  
  // Connected integrations
  integrations: {
    googleAds?: TrackingIntegration;
    googleAnalytics?: TrackingIntegration;
    gtm?: TrackingIntegration;
  };
}

export interface TrackingAIPlan {
  id: string;
  orgId: string;
  websiteId?: string;
  name: string;
  description?: string;
  
  // Plan data
  planData: TrackingPlanData;
  
  // Status
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'partial';
  executionProgress: number;
  executionLog: ExecutionLogEntry[];
  
  // AI metadata
  aiModel?: string;
  aiReasoning?: string;
  confidenceScore?: number;
  
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
  completedAt?: Date;
}

export interface TrackingPlanData {
  adsConversions: PlannedConversion[];
  ga4Events: PlannedGA4Event[];
  gtmTags: PlannedGTMTag[];
  gtmTriggers: PlannedGTMTrigger[];
  linkAdsToGa4: boolean;
  recommendations: PlanRecommendation[];
}

export interface PlannedConversion {
  name: string;
  category: ConversionCategory;
  countingType: 'ONE_PER_CLICK' | 'MANY_PER_CLICK';
  defaultValue?: number;
  currencyCode?: string;
  linkedGoalId?: string;
  reason: string;
}

export interface PlannedGA4Event {
  eventName: string;
  parameters: GA4EventParameter[];
  markAsConversion: boolean;
  linkedGoalId?: string;
  reason: string;
}

export interface PlannedGTMTag {
  name: string;
  type: string;
  config: Record<string, unknown>;
  triggerNames: string[];
  reason: string;
}

export interface PlannedGTMTrigger {
  name: string;
  type: GTMTriggerType;
  conditions: Record<string, unknown>;
  reason: string;
}

export interface PlanRecommendation {
  type: 'info' | 'warning' | 'action';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ExecutionLogEntry {
  timestamp: Date;
  action: string;
  status: 'pending' | 'success' | 'error' | 'skipped';
  message: string;
  details?: Record<string, unknown>;
}

// ============================================
// AUDIT LOG
// ============================================

export interface TrackingAuditLog {
  id: string;
  orgId: string;
  userId?: string;
  actorType: 'user' | 'system' | 'ai' | 'webhook';
  
  action: string;
  resourceType: string;
  resourceId?: string;
  
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  
  success: boolean;
  errorMessage?: string;
  
  createdAt: Date;
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface AdsMcpService {
  // OAuth
  getAuthUrl(orgId: string, redirectUri: string): Promise<string>;
  handleCallback(orgId: string, code: string): Promise<TrackingIntegration>;
  refreshToken(integrationId: string): Promise<void>;
  
  // Accounts
  listCustomers(integrationId: string): Promise<GoogleAdsCustomer[]>;
  getCustomer(integrationId: string, customerId: string): Promise<GoogleAdsCustomer>;
  
  // Conversion Actions
  listConversionActions(integrationId: string, customerId: string): Promise<GoogleAdsConversionAction[]>;
  getConversionAction(integrationId: string, customerId: string, conversionId: string): Promise<GoogleAdsConversionAction>;
  createConversionAction(integrationId: string, input: CreateConversionActionInput): Promise<GoogleAdsConversionAction>;
  updateConversionAction(integrationId: string, customerId: string, conversionId: string, updates: Partial<CreateConversionActionInput>): Promise<GoogleAdsConversionAction>;
  
  // Linking
  linkGa4Property(integrationId: string, customerId: string, ga4PropertyId: string): Promise<void>;
  getConversionStats(integrationId: string, customerId: string, conversionId: string): Promise<{ conversions: number; value: number }>;
  
  // Validation
  validatePermissions(integrationId: string, customerId: string): Promise<{ valid: boolean; missingPermissions: string[] }>;
}

export interface AnalyticsMcpService {
  // OAuth
  getAuthUrl(orgId: string, redirectUri: string): Promise<string>;
  handleCallback(orgId: string, code: string): Promise<TrackingIntegration>;
  refreshToken(integrationId: string): Promise<void>;
  
  // Accounts & Properties
  listAccountSummaries(integrationId: string): Promise<{ accounts: GA4Account[]; properties: GA4Property[] }>;
  getPropertyDetails(integrationId: string, propertyId: string): Promise<GA4Property>;
  listDataStreams(integrationId: string, propertyId: string): Promise<GA4DataStream[]>;
  
  // Events
  listEvents(integrationId: string, propertyId: string): Promise<GA4Event[]>;
  createCustomEvent(integrationId: string, input: CreateGA4EventInput): Promise<GA4Event>;
  markEventAsConversion(integrationId: string, propertyId: string, eventName: string, isConversion: boolean): Promise<void>;
  
  // Custom Definitions
  listCustomDimensions(integrationId: string, propertyId: string): Promise<GA4EventParameter[]>;
  createCustomDimension(integrationId: string, propertyId: string, dimension: GA4EventParameter): Promise<void>;
  
  // Linking
  listGoogleAdsLinks(integrationId: string, propertyId: string): Promise<GA4GoogleAdsLink[]>;
  createGoogleAdsLink(integrationId: string, propertyId: string, customerId: string): Promise<GA4GoogleAdsLink>;
  
  // Reports
  runReport(integrationId: string, propertyId: string, config: Record<string, unknown>): Promise<Record<string, unknown>>;
  runRealtimeReport(integrationId: string, propertyId: string, config: Record<string, unknown>): Promise<Record<string, unknown>>;
  
  // Validation
  validateEventReceipt(integrationId: string, propertyId: string, eventName: string): Promise<{ received: boolean; lastReceivedAt?: Date }>;
}

export interface TrackingAiPlannerService {
  generatePlan(input: TrackingAIPlanInput): Promise<TrackingAIPlan>;
  refinePlan(planId: string, feedback: string): Promise<TrackingAIPlan>;
  validatePlan(plan: TrackingAIPlan): Promise<{ valid: boolean; issues: string[] }>;
}

export interface TrackingExecutorService {
  executePlan(planId: string): Promise<void>;
  executeStep(planId: string, stepIndex: number): Promise<ExecutionLogEntry>;
  rollbackPlan(planId: string): Promise<void>;
  verifyExecution(planId: string): Promise<{ success: boolean; issues: string[] }>;
}

export interface TrackingHealthService {
  runHealthCheck(orgId: string): Promise<TrackingHealthStatus[]>;
  runSpecificCheck(orgId: string, checkType: HealthCheckType): Promise<TrackingHealthStatus>;
  autoFix(healthStatusId: string): Promise<{ success: boolean; message: string }>;
  explainIssue(healthStatusId: string): Promise<string>;
}
