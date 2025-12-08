-- ============================================
-- FACEBOOK TRACKING SYSTEM
-- Complete schema for Facebook Pixel, CAPI, and event tracking
-- ============================================

-- ============================================
-- FACEBOOK INTEGRATIONS
-- Stores Facebook OAuth connections and pixel configurations
-- ============================================

CREATE TABLE IF NOT EXISTS facebook_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- OAuth tokens
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  
  -- Facebook IDs
  pixel_id TEXT,
  ad_account_id TEXT,
  business_id TEXT,
  
  -- Status
  connected BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  validation_error TEXT,
  
  -- Metadata
  facebook_user_id TEXT,
  facebook_user_name TEXT,
  scopes TEXT[] DEFAULT ARRAY['ads_management', 'business_management', 'public_profile'],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, pixel_id)
);

-- ============================================
-- FACEBOOK CAPI SETTINGS
-- Conversions API configuration per pixel
-- ============================================

CREATE TABLE IF NOT EXISTS facebook_capi_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES facebook_integrations(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  
  -- CAPI settings
  capi_enabled BOOLEAN DEFAULT false,
  test_event_code TEXT,
  access_token TEXT,
  
  -- Configuration
  hash_user_data BOOLEAN DEFAULT true,
  send_test_events BOOLEAN DEFAULT false,
  include_fbc_fbp BOOLEAN DEFAULT true,
  
  -- Stats
  last_event_sent_at TIMESTAMPTZ,
  events_sent_24h INTEGER DEFAULT 0,
  events_failed_24h INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, pixel_id)
);

-- ============================================
-- FACEBOOK EVENT MAPPINGS
-- Maps website actions to Facebook events
-- ============================================

CREATE TYPE facebook_trigger_type AS ENUM (
  'url_match',
  'css_selector',
  'js_callback',
  'form_submit',
  'click',
  'scroll_depth',
  'time_on_page',
  'custom_event'
);

CREATE TABLE IF NOT EXISTS facebook_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES facebook_integrations(id) ON DELETE CASCADE,
  
  -- Event configuration
  event_name TEXT NOT NULL, -- Facebook standard events: Purchase, Lead, AddToCart, etc.
  custom_event_name TEXT, -- For custom events
  is_standard_event BOOLEAN DEFAULT true,
  
  -- Trigger configuration
  trigger_type facebook_trigger_type NOT NULL,
  trigger_value TEXT NOT NULL, -- URL pattern, CSS selector, callback name, etc.
  trigger_operator TEXT DEFAULT 'contains', -- equals, contains, regex, starts_with, ends_with
  
  -- Value mapping
  value_mapping JSONB DEFAULT '{}', -- Maps to value, currency, content_name, etc.
  user_data_mapping JSONB DEFAULT '{}', -- Maps to email, phone, etc.
  custom_data_mapping JSONB DEFAULT '{}', -- Custom parameters
  
  -- Deduplication
  dedupe_enabled BOOLEAN DEFAULT true,
  dedupe_window_seconds INTEGER DEFAULT 3600, -- 1 hour default
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  
  -- Stats
  fires_24h INTEGER DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FACEBOOK SERVER EVENTS
-- Log of CAPI events sent to Facebook
-- ============================================

CREATE TYPE facebook_event_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'duplicate',
  'test'
);

CREATE TABLE IF NOT EXISTS facebook_server_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES facebook_integrations(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  
  -- Event data
  event_name TEXT NOT NULL,
  event_id TEXT NOT NULL, -- For deduplication with browser events
  event_time BIGINT NOT NULL, -- Unix timestamp
  event_source_url TEXT,
  action_source TEXT DEFAULT 'website',
  
  -- User data (hashed)
  user_data JSONB DEFAULT '{}',
  
  -- Custom data
  custom_data JSONB DEFAULT '{}',
  
  -- Full payload
  payload JSONB NOT NULL,
  
  -- Response
  status facebook_event_status DEFAULT 'pending',
  response_data JSONB,
  error_message TEXT,
  
  -- Deduplication tracking
  browser_event_id TEXT, -- If this was also sent from browser
  is_deduplicated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FACEBOOK PIXEL HEALTH
-- Stores pixel health check results
-- ============================================

CREATE TYPE facebook_health_status AS ENUM (
  'green',
  'yellow', 
  'red',
  'unknown'
);

CREATE TABLE IF NOT EXISTS facebook_pixel_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES facebook_integrations(id) ON DELETE CASCADE,
  pixel_id TEXT NOT NULL,
  
  -- Health status
  health_status facebook_health_status DEFAULT 'unknown',
  health_score INTEGER DEFAULT 0, -- 0-100
  
  -- Check results
  pixel_active BOOLEAN DEFAULT false,
  capi_active BOOLEAN DEFAULT false,
  events_received_24h INTEGER DEFAULT 0,
  match_rate DECIMAL(5,2), -- Percentage
  data_quality_score DECIMAL(5,2),
  
  -- Diagnostics
  diagnostics JSONB DEFAULT '{}',
  issues JSONB DEFAULT '[]', -- Array of issues
  recommendations JSONB DEFAULT '[]',
  
  -- Timestamps
  last_checked_at TIMESTAMPTZ,
  last_event_received_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(org_id, pixel_id)
);

-- ============================================
-- TRACKING HEALTH (Generic - extends existing)
-- Add Facebook as a provider if not exists
-- ============================================

-- Update tracking_health table to support Facebook if it exists
DO $$
BEGIN
  -- Add facebook provider support to existing tracking tables if needed
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tracking_health') THEN
    -- Table exists, can add Facebook entries
    NULL;
  END IF;
END $$;

-- ============================================
-- FACEBOOK AUDIT LOGS
-- Tracks all Facebook-related actions
-- ============================================

CREATE TABLE IF NOT EXISTS facebook_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Action details
  action TEXT NOT NULL, -- connect_pixel, send_capi_event, create_mapping, etc.
  resource_type TEXT, -- integration, pixel, event, mapping
  resource_id TEXT,
  
  -- State
  before_state JSONB,
  after_state JSONB,
  metadata JSONB DEFAULT '{}',
  
  -- Result
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Facebook integrations
CREATE INDEX IF NOT EXISTS idx_facebook_integrations_org 
  ON facebook_integrations(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_integrations_pixel 
  ON facebook_integrations(pixel_id);

-- CAPI settings
CREATE INDEX IF NOT EXISTS idx_facebook_capi_settings_org 
  ON facebook_capi_settings(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_capi_settings_pixel 
  ON facebook_capi_settings(pixel_id);

-- Event mappings
CREATE INDEX IF NOT EXISTS idx_facebook_event_mappings_org 
  ON facebook_event_mappings(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_event_mappings_active 
  ON facebook_event_mappings(is_active) WHERE is_active = true;

-- Server events
CREATE INDEX IF NOT EXISTS idx_facebook_server_events_org 
  ON facebook_server_events(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_server_events_pixel 
  ON facebook_server_events(pixel_id);
CREATE INDEX IF NOT EXISTS idx_facebook_server_events_event_id 
  ON facebook_server_events(event_id);
CREATE INDEX IF NOT EXISTS idx_facebook_server_events_status 
  ON facebook_server_events(status);
CREATE INDEX IF NOT EXISTS idx_facebook_server_events_created 
  ON facebook_server_events(created_at DESC);

-- Pixel health
CREATE INDEX IF NOT EXISTS idx_facebook_pixel_health_org 
  ON facebook_pixel_health(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_pixel_health_status 
  ON facebook_pixel_health(health_status);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_facebook_audit_logs_org 
  ON facebook_audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_facebook_audit_logs_action 
  ON facebook_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_facebook_audit_logs_created 
  ON facebook_audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE facebook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_capi_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_event_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_server_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_pixel_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for facebook_integrations
CREATE POLICY "Users can view own org Facebook integrations" 
  ON facebook_integrations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org Facebook integrations"
  ON facebook_integrations FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for facebook_capi_settings
CREATE POLICY "Users can view own org CAPI settings"
  ON facebook_capi_settings FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org CAPI settings"
  ON facebook_capi_settings FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for facebook_event_mappings
CREATE POLICY "Users can view own org event mappings"
  ON facebook_event_mappings FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own org event mappings"
  ON facebook_event_mappings FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Policies for facebook_server_events
CREATE POLICY "Users can view own org server events"
  ON facebook_server_events FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert server events"
  ON facebook_server_events FOR INSERT
  WITH CHECK (true);

-- Policies for facebook_pixel_health
CREATE POLICY "Users can view own org pixel health"
  ON facebook_pixel_health FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage pixel health"
  ON facebook_pixel_health FOR ALL
  USING (true);

-- Policies for facebook_audit_logs
CREATE POLICY "Users can view own org audit logs"
  ON facebook_audit_logs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM organization_memberships 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert audit logs"
  ON facebook_audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate event_id for deduplication
CREATE OR REPLACE FUNCTION generate_facebook_event_id()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_facebook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_facebook_integrations_updated_at
  BEFORE UPDATE ON facebook_integrations
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_facebook_capi_settings_updated_at
  BEFORE UPDATE ON facebook_capi_settings
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_facebook_event_mappings_updated_at
  BEFORE UPDATE ON facebook_event_mappings
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

CREATE TRIGGER update_facebook_pixel_health_updated_at
  BEFORE UPDATE ON facebook_pixel_health
  FOR EACH ROW EXECUTE FUNCTION update_facebook_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE facebook_integrations IS 'Facebook OAuth connections and pixel configurations';
COMMENT ON TABLE facebook_capi_settings IS 'Conversions API configuration per pixel';
COMMENT ON TABLE facebook_event_mappings IS 'Maps website actions to Facebook events';
COMMENT ON TABLE facebook_server_events IS 'Log of CAPI events sent to Facebook';
COMMENT ON TABLE facebook_pixel_health IS 'Pixel health check results and diagnostics';
COMMENT ON TABLE facebook_audit_logs IS 'Audit trail for Facebook tracking actions';
