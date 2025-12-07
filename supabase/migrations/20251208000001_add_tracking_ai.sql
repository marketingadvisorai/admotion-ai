-- ============================================
-- TRACKING AI MODULE - Database Schema
-- Supports Google Ads MCP, Google Analytics MCP, GTM integration
-- ============================================

-- TRACKING INTEGRATIONS (OAuth connections to Google Ads, Analytics, GTM)
create table tracking_integrations (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  provider text not null check (provider in ('google_ads_mcp', 'google_analytics_mcp', 'google_tag_manager', 'facebook_pixel', 'meta_capi', 'tiktok_pixel', 'linkedin_insight')),
  status text default 'disconnected' check (status in ('disconnected', 'connecting', 'connected', 'error', 'expired')),
  
  -- OAuth tokens (encrypted in production)
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  
  -- Provider-specific metadata
  account_id text,  -- e.g., Google Ads customer ID, GA4 property ID
  account_name text,
  metadata jsonb default '{}',  -- Additional provider data
  
  -- Scopes granted
  scopes text[],
  
  -- Connection health
  last_sync_at timestamptz,
  last_error text,
  error_count int default 0,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(org_id, provider, account_id)
);

-- TRACKED WEBSITES
create table tracked_websites (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  domain text not null,
  name text,
  
  -- Detection settings
  auto_detect_conversions boolean default true,
  detected_pages jsonb default '[]',  -- URLs detected for tracking
  detected_forms jsonb default '[]',  -- Form elements detected
  detected_events jsonb default '[]', -- Custom events detected
  
  -- Verification
  verification_method text check (verification_method in ('dns', 'meta_tag', 'file', 'gtm', 'manual')),
  verification_status text default 'pending' check (verification_status in ('pending', 'verified', 'failed')),
  verified_at timestamptz,
  
  -- GTM container (if applicable)
  gtm_container_id text,
  gtm_workspace_id text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(org_id, domain)
);

-- TRACKING GOALS (What the user wants to track)
create table tracking_goals (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  website_id uuid references tracked_websites(id) on delete cascade,
  
  name text not null,
  goal_type text not null check (goal_type in ('purchase', 'lead', 'booking', 'signup', 'call', 'add_to_cart', 'page_view', 'form_submit', 'click', 'custom')),
  
  -- Goal configuration
  value_type text default 'fixed' check (value_type in ('fixed', 'dynamic', 'none')),
  default_value decimal(10,2),
  currency text default 'USD',
  
  -- Detection rules
  detection_rules jsonb default '{}',  -- URL patterns, CSS selectors, etc.
  
  -- Priority for AI planning
  priority int default 1,
  is_primary boolean default false,
  
  status text default 'active' check (status in ('active', 'paused', 'archived')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRACKING MAPPINGS (Links goals to platform-specific implementations)
create table tracking_mappings (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  goal_id uuid references tracking_goals(id) on delete cascade not null,
  integration_id uuid references tracking_integrations(id) on delete cascade not null,
  
  -- Platform-specific IDs
  platform_action_id text,  -- e.g., Google Ads conversion action ID
  platform_action_name text,
  
  -- Mapping configuration
  mapping_type text not null check (mapping_type in ('ads_conversion', 'ga4_event', 'gtm_tag', 'pixel_event', 'capi_event')),
  configuration jsonb default '{}',
  
  -- Sync status
  sync_status text default 'pending' check (sync_status in ('pending', 'synced', 'error', 'outdated')),
  last_synced_at timestamptz,
  sync_error text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(goal_id, integration_id, mapping_type)
);

-- GOOGLE ADS CONVERSION ACTIONS
create table ads_conversion_actions (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  integration_id uuid references tracking_integrations(id) on delete cascade not null,
  mapping_id uuid references tracking_mappings(id) on delete set null,
  
  -- Google Ads API fields
  google_ads_id text not null,  -- Conversion action resource name
  customer_id text not null,    -- Google Ads customer ID
  name text not null,
  category text check (category in ('DEFAULT', 'PAGE_VIEW', 'PURCHASE', 'SIGNUP', 'LEAD', 'DOWNLOAD', 'ADD_TO_CART', 'BEGIN_CHECKOUT', 'SUBSCRIBE_PAID', 'PHONE_CALL_LEAD', 'IMPORTED_LEAD', 'SUBMIT_LEAD_FORM', 'BOOK_APPOINTMENT', 'REQUEST_QUOTE', 'GET_DIRECTIONS', 'OUTBOUND_CLICK', 'CONTACT', 'ENGAGEMENT', 'STORE_VISIT', 'STORE_SALE')),
  
  -- Configuration
  counting_type text default 'ONE_PER_CLICK' check (counting_type in ('ONE_PER_CLICK', 'MANY_PER_CLICK')),
  value_settings jsonb default '{}',
  attribution_model text default 'GOOGLE_SEARCH_ATTRIBUTION_DATA_DRIVEN',
  
  -- Status
  status text default 'ENABLED' check (status in ('ENABLED', 'REMOVED', 'HIDDEN')),
  
  -- Stats (cached from API)
  conversions_last_30d int default 0,
  conversion_value_last_30d decimal(12,2) default 0,
  last_conversion_at timestamptz,
  
  -- Linking
  linked_ga4_property_id text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(integration_id, google_ads_id)
);

-- GA4 EVENTS
create table ga4_events (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  integration_id uuid references tracking_integrations(id) on delete cascade not null,
  mapping_id uuid references tracking_mappings(id) on delete set null,
  
  -- GA4 fields
  property_id text not null,
  event_name text not null,
  event_type text default 'custom' check (event_type in ('recommended', 'custom', 'automatically_collected')),
  
  -- Parameters
  parameters jsonb default '[]',  -- Array of {name, type, scope}
  
  -- Configuration
  is_conversion boolean default false,
  counting_method text default 'ONCE_PER_EVENT',
  
  -- Stats (cached)
  event_count_last_7d int default 0,
  last_received_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  unique(integration_id, property_id, event_name)
);

-- GTM TAG CONFIGURATIONS
create table gtm_tag_configs (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  website_id uuid references tracked_websites(id) on delete cascade not null,
  mapping_id uuid references tracking_mappings(id) on delete set null,
  
  -- GTM fields
  container_id text not null,
  workspace_id text,
  tag_id text,  -- After creation
  
  -- Tag configuration
  tag_name text not null,
  tag_type text not null,  -- e.g., 'gaawc', 'awct', 'html', 'img'
  tag_config jsonb not null,  -- Full tag configuration
  
  -- Firing triggers
  trigger_ids text[],
  
  -- Status
  status text default 'draft' check (status in ('draft', 'published', 'paused', 'deleted')),
  published_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- GTM TRIGGER CONFIGURATIONS
create table gtm_trigger_configs (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  website_id uuid references tracked_websites(id) on delete cascade not null,
  
  -- GTM fields
  container_id text not null,
  workspace_id text,
  trigger_id text,  -- After creation
  
  -- Trigger configuration
  trigger_name text not null,
  trigger_type text not null,  -- e.g., 'pageview', 'click', 'formSubmission', 'customEvent'
  trigger_config jsonb not null,  -- Full trigger configuration
  
  -- Conditions
  conditions jsonb default '[]',  -- Filter conditions
  
  status text default 'draft' check (status in ('draft', 'published', 'deleted')),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRACKING HEALTH STATUS
create table tracking_health_status (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  website_id uuid references tracked_websites(id) on delete cascade,
  integration_id uuid references tracking_integrations(id) on delete cascade,
  
  -- Health check type
  check_type text not null check (check_type in ('conversion_receiving', 'event_firing', 'tag_loading', 'pixel_active', 'linking_valid', 'enhanced_conversions', 'consent_mode')),
  
  -- Status
  status text not null check (status in ('healthy', 'warning', 'critical', 'unknown')),
  
  -- Details
  message text,
  details jsonb default '{}',
  
  -- Recommendations
  auto_fix_available boolean default false,
  fix_action text,  -- Action to take for auto-fix
  
  -- Timing
  last_checked_at timestamptz default now(),
  issue_started_at timestamptz,
  resolved_at timestamptz,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TRACKING AI PLANS (AI-generated tracking plans)
create table tracking_ai_plans (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  website_id uuid references tracked_websites(id) on delete cascade,
  
  -- Plan metadata
  name text not null,
  description text,
  
  -- Input context
  business_goals jsonb default '[]',  -- User-selected goals
  website_analysis jsonb default '{}',  -- Detected pages, forms, etc.
  existing_tracking jsonb default '{}',  -- Current setup
  
  -- AI-generated plan
  plan_data jsonb not null,  -- Full plan with conversions, events, tags
  
  -- Execution status
  status text default 'draft' check (status in ('draft', 'approved', 'executing', 'completed', 'failed', 'partial')),
  execution_progress int default 0,  -- 0-100
  execution_log jsonb default '[]',
  
  -- AI metadata
  ai_model text,
  ai_reasoning text,
  confidence_score decimal(3,2),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  executed_at timestamptz,
  completed_at timestamptz
);

-- TRACKING AUDIT LOG
create table tracking_audit_log (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  
  -- Actor
  user_id uuid references profiles(id) on delete set null,
  actor_type text default 'user' check (actor_type in ('user', 'system', 'ai', 'webhook')),
  
  -- Action
  action text not null,  -- e.g., 'create_conversion', 'link_ga4', 'execute_plan'
  resource_type text not null,  -- e.g., 'conversion_action', 'ga4_event', 'tracking_plan'
  resource_id uuid,
  
  -- Details
  before_state jsonb,
  after_state jsonb,
  metadata jsonb default '{}',
  
  -- Result
  success boolean default true,
  error_message text,
  
  created_at timestamptz default now()
);

-- ============================================
-- INDEXES
-- ============================================

create index idx_tracking_integrations_org on tracking_integrations(org_id);
create index idx_tracking_integrations_provider on tracking_integrations(provider);
create index idx_tracking_integrations_status on tracking_integrations(status);

create index idx_tracked_websites_org on tracked_websites(org_id);
create index idx_tracked_websites_domain on tracked_websites(domain);

create index idx_tracking_goals_org on tracking_goals(org_id);
create index idx_tracking_goals_website on tracking_goals(website_id);
create index idx_tracking_goals_type on tracking_goals(goal_type);

create index idx_tracking_mappings_goal on tracking_mappings(goal_id);
create index idx_tracking_mappings_integration on tracking_mappings(integration_id);

create index idx_ads_conversion_actions_org on ads_conversion_actions(org_id);
create index idx_ads_conversion_actions_integration on ads_conversion_actions(integration_id);
create index idx_ads_conversion_actions_customer on ads_conversion_actions(customer_id);

create index idx_ga4_events_org on ga4_events(org_id);
create index idx_ga4_events_integration on ga4_events(integration_id);
create index idx_ga4_events_property on ga4_events(property_id);

create index idx_tracking_health_org on tracking_health_status(org_id);
create index idx_tracking_health_status on tracking_health_status(status);

create index idx_tracking_ai_plans_org on tracking_ai_plans(org_id);
create index idx_tracking_ai_plans_status on tracking_ai_plans(status);

create index idx_tracking_audit_log_org on tracking_audit_log(org_id);
create index idx_tracking_audit_log_action on tracking_audit_log(action);
create index idx_tracking_audit_log_created on tracking_audit_log(created_at);

-- ============================================
-- RLS POLICIES
-- ============================================

alter table tracking_integrations enable row level security;
alter table tracked_websites enable row level security;
alter table tracking_goals enable row level security;
alter table tracking_mappings enable row level security;
alter table ads_conversion_actions enable row level security;
alter table ga4_events enable row level security;
alter table gtm_tag_configs enable row level security;
alter table gtm_trigger_configs enable row level security;
alter table tracking_health_status enable row level security;
alter table tracking_ai_plans enable row level security;
alter table tracking_audit_log enable row level security;

-- Tracking Integrations
create policy "Members can view tracking integrations" on tracking_integrations 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage tracking integrations" on tracking_integrations 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Tracked Websites
create policy "Members can view tracked websites" on tracked_websites 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage tracked websites" on tracked_websites 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Tracking Goals
create policy "Members can view tracking goals" on tracking_goals 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage tracking goals" on tracking_goals 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Tracking Mappings
create policy "Members can view tracking mappings" on tracking_mappings 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage tracking mappings" on tracking_mappings 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Ads Conversion Actions
create policy "Members can view ads conversion actions" on ads_conversion_actions 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage ads conversion actions" on ads_conversion_actions 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- GA4 Events
create policy "Members can view ga4 events" on ga4_events 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage ga4 events" on ga4_events 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- GTM Tag Configs
create policy "Members can view gtm tag configs" on gtm_tag_configs 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage gtm tag configs" on gtm_tag_configs 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- GTM Trigger Configs
create policy "Members can view gtm trigger configs" on gtm_trigger_configs 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage gtm trigger configs" on gtm_trigger_configs 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Tracking Health Status
create policy "Members can view tracking health" on tracking_health_status 
  for select using (org_id in (select get_user_org_ids()));
create policy "System can manage tracking health" on tracking_health_status 
  for all using (org_id in (select get_user_org_ids()));

-- Tracking AI Plans
create policy "Members can view tracking plans" on tracking_ai_plans 
  for select using (org_id in (select get_user_org_ids()));
create policy "Admins can manage tracking plans" on tracking_ai_plans 
  for all using (org_id in (select org_id from organization_memberships where user_id = auth.uid() and role in ('owner', 'admin')));

-- Tracking Audit Log
create policy "Members can view audit log" on tracking_audit_log 
  for select using (org_id in (select get_user_org_ids()));
create policy "System can insert audit log" on tracking_audit_log 
  for insert with check (org_id in (select get_user_org_ids()));

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
create or replace function update_tracking_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger tracking_integrations_updated_at before update on tracking_integrations
  for each row execute function update_tracking_updated_at();

create trigger tracked_websites_updated_at before update on tracked_websites
  for each row execute function update_tracking_updated_at();

create trigger tracking_goals_updated_at before update on tracking_goals
  for each row execute function update_tracking_updated_at();

create trigger tracking_mappings_updated_at before update on tracking_mappings
  for each row execute function update_tracking_updated_at();

create trigger ads_conversion_actions_updated_at before update on ads_conversion_actions
  for each row execute function update_tracking_updated_at();

create trigger ga4_events_updated_at before update on ga4_events
  for each row execute function update_tracking_updated_at();

create trigger tracking_health_status_updated_at before update on tracking_health_status
  for each row execute function update_tracking_updated_at();

create trigger tracking_ai_plans_updated_at before update on tracking_ai_plans
  for each row execute function update_tracking_updated_at();
