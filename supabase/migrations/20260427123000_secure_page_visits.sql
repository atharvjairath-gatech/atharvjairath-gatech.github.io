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
