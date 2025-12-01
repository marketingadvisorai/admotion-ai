-- RPC: Get invitation by token
create or replace function get_invitation_by_token(lookup_token text)
returns table (
  id uuid,
  org_id uuid,
  email text,
  role text,
  token text,
  status text,
  created_at timestamptz,
  expires_at timestamptz,
  org_name text
)
security definer
as $$
begin
  return query
  select 
    i.id,
    i.org_id,
    i.email,
    i.role,
    i.token,
    i.status,
    i.created_at,
    i.expires_at,
    o.name as org_name
  from invitations i
  join organizations o on i.org_id = o.id
  where i.token = lookup_token
  and i.status = 'pending'
  and i.expires_at > now();
end;
$$ language plpgsql;

-- RPC: Accept invitation
create or replace function accept_invitation(lookup_token text, target_user_id uuid)
returns uuid
security definer
as $$
declare
  invite_record record;
  existing_member uuid;
begin
  -- 1. Get the invitation
  select * into invite_record
  from invitations
  where token = lookup_token
  and status = 'pending'
  and expires_at > now();

  if invite_record.id is null then
    raise exception 'Invalid or expired invitation';
  end if;

  -- 2. Check if user is already a member
  select id into existing_member
  from organization_memberships
  where org_id = invite_record.org_id
  and user_id = target_user_id;

  if existing_member is not null then
    -- Already a member, just mark invite as accepted
    update invitations set status = 'accepted' where id = invite_record.id;
    return invite_record.org_id;
  end if;

  -- 3. Add to organization_memberships
  insert into organization_memberships (org_id, user_id, role)
  values (invite_record.org_id, target_user_id, invite_record.role);

  -- 4. Mark invitation as accepted
  update invitations set status = 'accepted' where id = invite_record.id;

  return invite_record.org_id;
end;
$$ language plpgsql;
