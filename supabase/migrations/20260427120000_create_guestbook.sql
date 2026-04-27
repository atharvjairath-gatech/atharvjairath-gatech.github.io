create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text not null,
  message text not null,
  created_at timestamptz not null default now(),
  constraint guestbook_name_length check (char_length(trim(name)) between 1 and 40),
  constraint guestbook_message_length check (char_length(trim(message)) between 1 and 300)
);

create table if not exists public.page_visits (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  page text not null default 'home',
  created_at timestamptz not null default now()
);

alter table public.guestbook enable row level security;
alter table public.page_visits enable row level security;

drop policy if exists "Anyone can read guestbook" on public.guestbook;
create policy "Anyone can read guestbook"
on public.guestbook
for select
to anon
using (true);

drop policy if exists "Anyone can add guestbook message" on public.guestbook;
create policy "Anyone can add guestbook message"
on public.guestbook
for insert
to anon
with check (
  char_length(trim(name)) between 1 and 40
  and char_length(trim(message)) between 1 and 300
);

drop policy if exists "Anyone can count page visits" on public.page_visits;
drop policy if exists "Anyone can add a page visit" on public.page_visits;

create or replace function public.log_page_visit(
  input_visitor_id uuid,
  input_page text default 'home'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if input_page <> 'home' then
    raise exception 'Unsupported page';
  end if;

  insert into public.page_visits (visitor_id, page)
  values (input_visitor_id, input_page);
end;
$$;

create or replace function public.page_visit_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from public.page_visits;
$$;

revoke all on function public.log_page_visit(uuid, text) from public;
revoke all on function public.page_visit_count() from public;
grant execute on function public.log_page_visit(uuid, text) to anon;
grant execute on function public.page_visit_count() to anon;
