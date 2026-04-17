alter table public.posts     add column if not exists sentiment text check (sentiment in ('positive','neutral','negative'));
alter table public.comments  add column if not exists sentiment text check (sentiment in ('positive','neutral','negative'));
