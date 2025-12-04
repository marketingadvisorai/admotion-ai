-- LLM PROFILES
create table if not exists llm_profiles (
  id uuid default uuid_generate_v4() primary key,
  slug text not null unique,
  provider text not null, -- e.g. 'openai', 'gemini'
  model text not null,
  system_prompt text not null,
  user_template text,
  temperature numeric default 0.2,
  max_tokens integer default 512,
  response_format text,
  is_active boolean default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table llm_profiles enable row level security;

-- Super-admin flag on profiles (managed outside the app UI for now)
alter table profiles add column if not exists is_super_admin boolean default false;

-- Helper function to check if current user is a super admin
create or replace function is_super_admin()
returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and coalesce(is_super_admin, false) = true
  );
$$ language sql security definer;

-- Super admins can manage all profiles
create policy "Super admins manage llm_profiles"
  on llm_profiles
  for all
  using (is_super_admin())
  with check (is_super_admin());

-- Any authenticated user can read active profiles
create policy "Anyone can read active LLM profiles"
  on llm_profiles
  for select
  using (is_active = true);

