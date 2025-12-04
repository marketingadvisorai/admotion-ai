-- Helper function to check membership (ensure it exists)
create or replace function get_user_org_ids()
returns setof uuid as $$
  select org_id from organization_memberships where user_id = auth.uid()
$$ language sql security definer;

-- Create llm_usage_events table if it doesn't exist
create table if not exists llm_usage_events (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  campaign_id uuid references campaigns(id) on delete cascade,
  provider text not null,
  model text not null,
  kind text not null, -- e.g. 'chat', 'brand_analysis', 'image', 'video'
  input_tokens integer default 0,
  output_tokens integer default 0,
  total_tokens integer default 0,
  unit_count integer default 1,
  cost numeric default 0,
  created_at timestamptz default now()
);

alter table llm_usage_events enable row level security;

-- Drop existing policies if they exist to avoid errors
drop policy if exists "Members can view llm usage" on llm_usage_events;
drop policy if exists "Members can insert llm usage" on llm_usage_events;

create policy "Members can view llm usage"
  on llm_usage_events
  for select
  using (org_id in (select get_user_org_ids()));

create policy "Members can insert llm usage"
  on llm_usage_events
  for insert
  with check (org_id in (select get_user_org_ids()));
