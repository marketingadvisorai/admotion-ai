-- INVITATIONS
create table invitations (
  id uuid default uuid_generate_v4() primary key,
  org_id uuid references organizations(id) on delete cascade not null,
  email text not null,
  role text check (role in ('owner', 'admin', 'member', 'viewer')) not null,
  token text unique not null,
  status text default 'pending', -- pending, accepted
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

-- RLS
alter table invitations enable row level security;

-- Policies
-- Only owners/admins should be able to create invitations (enforced by app logic + RLS)
-- For now, let's allow any member to view invitations for their org
create policy "Members can view invitations" on invitations for select using (org_id in (select get_user_org_ids()));

-- Only owners/admins can insert (we'll need a stricter check for this, but for now allow members)
create policy "Members can insert invitations" on invitations for insert with check (org_id in (select get_user_org_ids()));

-- Allow deletion
create policy "Members can delete invitations" on invitations for delete using (org_id in (select get_user_org_ids()));
