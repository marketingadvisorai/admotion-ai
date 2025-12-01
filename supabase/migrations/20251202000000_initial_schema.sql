-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public profile for users, extends auth.users)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  avatar_url text,
  updated_at timestamptz
);

-- ORGANIZATIONS
create table organizations (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  slug text unique not null,
  billing_plan text default 'free',
  credits_balance int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- MEMBERSHIPS
create table organization_memberships (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'member', 'viewer')) not null,
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- BRAND KITS
create table brand_kits (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  logo_url text,
  colors jsonb, -- { primary: string, secondary: string }
  fonts jsonb, -- { heading: string, body: string }
  created_at timestamptz default now()
);

-- CAMPAIGNS
create table campaigns (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  name text not null,
  brief text,
  platform text,
  status text default 'draft', -- draft, generating, completed
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- VIDEO GENERATIONS
create table video_generations (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  org_id uuid references organizations(id) on delete cascade not null,
  provider text not null,
  external_job_id text,
  prompt_used text,
  status text default 'queued', -- queued, processing, completed, failed
  result_url text,
  thumbnail_url text,
  cost_credits int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- USAGE EVENTS
create table usage_events (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  event_type text not null,
  provider text,
  credits_deducted int default 0,
  created_at timestamptz default now()
);

-- RLS POLICIES (Basic)
alter table profiles enable row level security;
alter table organizations enable row level security;
alter table organization_memberships enable row level security;
alter table brand_kits enable row level security;
alter table campaigns enable row level security;
alter table video_generations enable row level security;
alter table usage_events enable row level security;

-- Helper function to check membership
create or replace function get_user_org_ids()
returns setof uuid as $$
  select org_id from organization_memberships where user_id = auth.uid()
$$ language sql security definer;

-- Policies
-- Profiles: Users can read their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Organizations: Members can view
create policy "Members can view organizations" on organizations for select using (id in (select get_user_org_ids()));

-- Memberships: Members can view memberships of their orgs
create policy "Members can view memberships" on organization_memberships for select using (org_id in (select get_user_org_ids()));

-- Brand Kits: Members can view/edit
create policy "Members can view brand kits" on brand_kits for select using (org_id in (select get_user_org_ids()));
create policy "Members can insert brand kits" on brand_kits for insert with check (org_id in (select get_user_org_ids()));
create policy "Members can update brand kits" on brand_kits for update using (org_id in (select get_user_org_ids()));

-- Campaigns: Members can view/edit
create policy "Members can view campaigns" on campaigns for select using (org_id in (select get_user_org_ids()));
create policy "Members can insert campaigns" on campaigns for insert with check (org_id in (select get_user_org_ids()));
create policy "Members can update campaigns" on campaigns for update using (org_id in (select get_user_org_ids()));

-- Video Generations: Members can view
create policy "Members can view generations" on video_generations for select using (org_id in (select get_user_org_ids()));
