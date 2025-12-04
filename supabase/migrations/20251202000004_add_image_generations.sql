-- IMAGE GENERATIONS
create table image_generations (
  id uuid default uuid_generate_v4() primary key,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  org_id uuid references organizations(id) on delete cascade not null,
  provider text not null,
  prompt_used text,
  status text default 'completed', -- images are generated synchronously
  result_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table image_generations enable row level security;

create policy "Members can view image generations"
  on image_generations
  for select
  using (org_id in (select get_user_org_ids()));

create policy "Members can insert image generations"
  on image_generations
  for insert
  with check (org_id in (select get_user_org_ids()));

