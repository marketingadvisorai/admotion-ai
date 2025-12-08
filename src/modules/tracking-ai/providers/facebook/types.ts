/**
 * Facebook Tracking Module Types
 * Types for Facebook Pixel, Conversions API, and event tracking
 */

// ============================================
// FACEBOOK STANDARD EVENTS
// ============================================

export type FacebookStandardEvent =
  | 'AddPaymentInfo'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'InitiateCheckout'
  | 'Lead'
  | 'PageView'
  | 'Purchase'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'
  | 'ViewContent';

export type FacebookActionSource =
  | 'website'
  | 'app'
  | 'phone_call'
  | 'chat'
  | 'physical_store'
  | 'system_generated'
  | 'other';

// ============================================
// FACEBOOK INTEGRATION
// ============================================

export interface FacebookIntegration {
  id: string;
  orgId: string;
  userId?: string;
  accessToken: string;
  tokenExpiresAt?: Date;
  pixelId?: string;
  adAccountId?: string;
  businessId?: string;
  connected: boolean;
  lastValidatedAt?: Date;
  validationError?: string;
  facebookUserId?: string;
  facebookUserName?: string;
  scopes: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FACEBOOK CAPI SETTINGS
// ============================================

export interface FacebookCapiSettings {
  id: string;
  orgId: string;
  integrationId: string;
  pixelId: string;
  capiEnabled: boolean;
  testEventCode?: string;
  accessToken?: string;
  hashUserData: boolean;
  sendTestEvents: boolean;
  includeFbcFbp: boolean;
  lastEventSentAt?: Date;
  eventsSent24h: number;
  eventsFailed24h: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// FACEBOOK EVENT MAPPING
// ============================================

export type FacebookTriggerType =
  | 'url_match'
  | 'css_selector'
  | 'js_callback'
  | 'form_submit'
  | 'click'
  | 'scroll_depth'
  | 'time_on_page'
  | 'custom_event';

export type TriggerOperator =
  | 'equals'
  | 'contains'
  | 'regex'
  | 'starts_with'
  | 'ends_with';

export interface FacebookEventMapping {
  id: string;
  orgId: string;
  integrationId: string;
  eventName: FacebookStandardEvent | string;
  customEventName?: string;
  isStandardEvent: boolean;
  triggerType: FacebookTriggerType;
  triggerValue: string;
  triggerOperator: TriggerOperator;
  valueMapping: ValueMapping;
  userDataMapping: UserDataMapping;
  customDataMapping: Record<string, string>;
  dedupeEnabled: boolean;
  dedupeWindowSeconds: number;
  isActive: boolean;
  priority: number;
  fires24h: number;
  lastFiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ValueMapping {
  valueField?: string;
  currencyField?: string;
  contentNameField?: string;
  contentIdField?: string;
  contentTypeField?: string;
  numItemsField?: string;
  staticValue?: number;
  staticCurrency?: string;
}

export interface UserDataMapping {
  emailField?: string;
  phoneField?: string;
  firstNameField?: string;
  lastNameField?: string;
  cityField?: string;
  stateField?: string;
  zipField?: string;
  countryField?: string;
  externalIdField?: string;
}

// ============================================
// FACEBOOK SERVER EVENT
// ============================================

export type FacebookEventStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'duplicate'
  | 'test';

export interface FacebookServerEvent {
  id: string;
  orgId: string;
  integrationId: string;
  pixelId: string;
  eventName: string;
  eventId: string;
  eventTime: number;
  eventSourceUrl?: string;
  actionSource: FacebookActionSource;
  userData: FacebookUserData;
  customData: FacebookCustomData;
  payload: FacebookEventPayload;
  status: FacebookEventStatus;
  responseData?: Record<string, unknown>;
  errorMessage?: string;
  browserEventId?: string;
  isDeduplicated: boolean;
  createdAt: Date;
}

// ============================================
// FACEBOOK PIXEL HEALTH
// ============================================

export type FacebookHealthStatus = 'green' | 'yellow' | 'red' | 'unknown';

export interface FacebookPixelHealth {
  id: string;
  orgId: string;
  integrationId: string;
  pixelId: string;
  healthStatus: FacebookHealthStatus;
  healthScore: number;
  pixelActive: boolean;
  capiActive: boolean;
  eventsReceived24h: number;
  matchRate?: number;
  dataQualityScore?: number;
  diagnostics: PixelDiagnostics;
  issues: PixelIssue[];
  recommendations: PixelRecommendation[];
  lastCheckedAt?: Date;
  lastEventReceivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PixelDiagnostics {
  browserEventsCount?: number;
  serverEventsCount?: number;
  matchedEventsCount?: number;
  unmatchedEventsCount?: number;
  eventBreakdown?: Record<string, number>;
  topErrorCodes?: string[];
}

export interface PixelIssue {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedEvents?: string[];
  howToFix?: string;
}

export interface PixelRecommendation {
  type: 'info' | 'action' | 'optimization';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

// ============================================
// FACEBOOK API PAYLOADS
// ============================================

export interface FacebookUserData {
  em?: string[];  // Hashed emails
  ph?: string[];  // Hashed phones
  fn?: string[];  // Hashed first names
  ln?: string[];  // Hashed last names
  ct?: string[];  // Hashed cities
  st?: string[];  // Hashed states
  zp?: string[];  // Hashed zip codes
  country?: string[];  // Hashed country codes
  external_id?: string[];  // Hashed external IDs
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;  // Facebook click ID
  fbp?: string;  // Facebook browser ID
}

export interface FacebookCustomData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  contents?: FacebookContentItem[];
  num_items?: number;
  order_id?: string;
  predicted_ltv?: number;
  search_string?: string;
  status?: string;
  delivery_category?: string;
}

export interface FacebookContentItem {
  id: string;
  quantity: number;
  price?: number;
  item_price?: number;
  title?: string;
  description?: string;
  brand?: string;
  category?: string;
}

export interface FacebookEventPayload {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url?: string;
  action_source: FacebookActionSource;
  user_data: FacebookUserData;
  custom_data?: FacebookCustomData;
  opt_out?: boolean;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface FacebookCapiRequest {
  data: FacebookEventPayload[];
  test_event_code?: string;
  partner_agent?: string;
}

export interface FacebookCapiResponse {
  events_received: number;
  messages?: string[];
  fbtrace_id?: string;
}

// ============================================
// PIXEL INFO
// ============================================

export interface FacebookPixel {
  id: string;
  name: string;
  lastFiredTime?: Date;
  creationTime: Date;
  isUnavailable: boolean;
  firstPartyCookieStatus?: string;
  dataUseSetting?: string;
  code?: string;
}

export interface FacebookAdAccount {
  id: string;
  accountId: string;
  name: string;
  accountStatus: number;
  currency: string;
  timezone: string;
  businessName?: string;
}

export interface FacebookBusiness {
  id: string;
  name: string;
  verificationStatus?: string;
  createdTime: Date;
}

// ============================================
// SERVICE INPUTS
// ============================================

export interface CreateEventMappingInput {
  orgId: string;
  integrationId: string;
  eventName: FacebookStandardEvent | string;
  customEventName?: string;
  isStandardEvent?: boolean;
  triggerType: FacebookTriggerType;
  triggerValue: string;
  triggerOperator?: TriggerOperator;
  valueMapping?: ValueMapping;
  userDataMapping?: UserDataMapping;
  customDataMapping?: Record<string, string>;
  dedupeEnabled?: boolean;
  dedupeWindowSeconds?: number;
}

export interface SendCapiEventInput {
  pixelId: string;
  eventName: string;
  eventId?: string;
  eventTime?: number;
  eventSourceUrl?: string;
  actionSource?: FacebookActionSource;
  userData?: Partial<FacebookUserData>;
  customData?: Partial<FacebookCustomData>;
  testEventCode?: string;
}

export interface PixelDiagnosticsInput {
  pixelId: string;
  startDate?: Date;
  endDate?: Date;
}

// ============================================
// SERVICE INTERFACES
// ============================================

export interface FacebookAuthService {
  getAuthUrl(orgId: string, redirectUri: string): Promise<string>;
  handleCallback(orgId: string, code: string): Promise<FacebookIntegration>;
  refreshToken(integrationId: string): Promise<void>;
  validateToken(integrationId: string): Promise<boolean>;
  disconnect(integrationId: string): Promise<void>;
}

export interface FacebookPixelService {
  listPixels(integrationId: string): Promise<FacebookPixel[]>;
  getPixel(integrationId: string, pixelId: string): Promise<FacebookPixel>;
  getPixelCode(integrationId: string, pixelId: string): Promise<string>;
  selectPixel(integrationId: string, pixelId: string): Promise<void>;
  getPixelDiagnostics(integrationId: string, input: PixelDiagnosticsInput): Promise<PixelDiagnostics>;
  checkPixelHealth(integrationId: string): Promise<FacebookPixelHealth>;
}

export interface FacebookCapiService {
  sendEvent(integrationId: string, input: SendCapiEventInput): Promise<FacebookCapiResponse>;
  sendBatchEvents(integrationId: string, events: SendCapiEventInput[]): Promise<FacebookCapiResponse>;
  getCapiSettings(orgId: string, pixelId: string): Promise<FacebookCapiSettings>;
  updateCapiSettings(settingsId: string, updates: Partial<FacebookCapiSettings>): Promise<FacebookCapiSettings>;
  enableCapi(integrationId: string, pixelId: string): Promise<void>;
  disableCapi(integrationId: string, pixelId: string): Promise<void>;
}

export interface FacebookEventMappingService {
  listMappings(orgId: string): Promise<FacebookEventMapping[]>;
  getMapping(mappingId: string): Promise<FacebookEventMapping>;
  createMapping(input: CreateEventMappingInput): Promise<FacebookEventMapping>;
  updateMapping(mappingId: string, updates: Partial<CreateEventMappingInput>): Promise<FacebookEventMapping>;
  deleteMapping(mappingId: string): Promise<void>;
  toggleMapping(mappingId: string, isActive: boolean): Promise<void>;
}

export interface FacebookEventTesterService {
  testEvent(integrationId: string, input: SendCapiEventInput): Promise<{
    success: boolean;
    eventId: string;
    response: FacebookCapiResponse;
  }>;
  getTestResults(integrationId: string, testEventCode: string): Promise<{
    eventsReceived: number;
    eventDetails: Array<{
      eventName: string;
      eventTime: number;
      matched: boolean;
      errors?: string[];
    }>;
  }>;
}
