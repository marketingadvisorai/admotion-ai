-- CREATIVE CHAT SESSIONS
-- Stores chat history for image ad creation with 10-day retention
create table creative_chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  session_name text default 'Untitled Session',
  messages jsonb default '[]'::jsonb, -- Array of {role, content, timestamp}
  proposed_copy jsonb, -- {headline, ctaText, imageDirection, overlayElements}
  brand_kit_id uuid references brand_kits(id) on delete set null,
  selected_models jsonb, -- {chatModel, imageModel, variantModels}
  expires_at timestamptz default (now() + interval '10 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index for efficient cleanup and queries
create index idx_creative_chat_sessions_org on creative_chat_sessions(org_id);
create index idx_creative_chat_sessions_user on creative_chat_sessions(user_id);
create index idx_creative_chat_sessions_expires on creative_chat_sessions(expires_at);

-- Enable RLS
alter table creative_chat_sessions enable row level security;

-- Policies
create policy "Users can view own chat sessions"
  on creative_chat_sessions
  for select
  using (user_id = auth.uid() and org_id in (select get_user_org_ids()));

create policy "Users can insert chat sessions"
  on creative_chat_sessions
  for insert
  with check (user_id = auth.uid() and org_id in (select get_user_org_ids()));

create policy "Users can update own chat sessions"
  on creative_chat_sessions
  for update
  using (user_id = auth.uid() and org_id in (select get_user_org_ids()));

create policy "Users can delete own chat sessions"
  on creative_chat_sessions
  for delete
  using (user_id = auth.uid() and org_id in (select get_user_org_ids()));

-- Function to auto-cleanup expired sessions (run via cron or scheduled job)
create or replace function cleanup_expired_chat_sessions()
returns void as $$
begin
  delete from creative_chat_sessions where expires_at < now();
end;
$$ language plpgsql security definer;

-- Trigger to update updated_at on changes
create or replace function update_chat_session_timestamp()
returns trigger as $$
begin
  NEW.updated_at = now();
  -- Extend expiration on activity
  NEW.expires_at = now() + interval '10 days';
  return NEW;
end;
$$ language plpgsql;

create trigger chat_session_updated
  before update on creative_chat_sessions
  for each row
  execute function update_chat_session_timestamp();
