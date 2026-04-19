create table public.mentions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  mentioned_user_id uuid references public.profiles(id) on delete cascade not null,
  mentioned_by_user_id uuid references public.profiles(id) on delete cascade not null,
  read_at timestamptz,
  created_at timestamptz default now()
);
alter table public.mentions enable row level security;
create policy "ver próprias menções" on public.mentions for select using (auth.uid() = mentioned_user_id);
create policy "inserir menções" on public.mentions for insert with check (auth.uid() = mentioned_by_user_id);
create policy "marcar como lida" on public.mentions for update using (auth.uid() = mentioned_user_id);
