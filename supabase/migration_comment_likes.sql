create table public.comment_likes (
  id uuid default gen_random_uuid() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null default 'like',
  created_at timestamptz default now(),
  unique (comment_id, user_id, type)
);
alter table public.comment_likes enable row level security;
create policy "read comment_likes" on public.comment_likes for select using (true);
create policy "insert comment_likes" on public.comment_likes for insert with check (auth.uid() = user_id);
create policy "delete comment_likes" on public.comment_likes for delete using (auth.uid() = user_id);
