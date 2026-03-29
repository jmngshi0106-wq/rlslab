create table if not exists public.waitlist_signups (
  id bigserial primary key,
  email text not null,
  source text not null default 'unknown',
  created_at timestamptz not null default now()
);

create unique index if not exists waitlist_signups_email_key
  on public.waitlist_signups (email);

alter table public.waitlist_signups enable row level security;

drop policy if exists "deny_all_waitlist_signups" on public.waitlist_signups;

create policy "deny_all_waitlist_signups"
on public.waitlist_signups
for all
to public
using (false)
with check (false);