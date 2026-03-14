alter table public.profiles
  add column if not exists phone text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := 'user';
begin
  if not exists (select 1 from public.profiles where role = 'admin') then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(regexp_replace(coalesce(new.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g'), ''),
    v_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    phone = coalesce(excluded.phone, public.profiles.phone);

  return new;
end;
$$;

update public.profiles p
set phone = nullif(regexp_replace(coalesce(u.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g'), '')
from auth.users u
where p.id = u.id
  and (p.phone is null or p.phone = '');
