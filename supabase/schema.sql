-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

create table public.posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(post_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;

-- Profiles
create policy "Profiles viewable by all" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Posts
create policy "Posts viewable by all" on public.posts for select using (true);
create policy "Auth users can create posts" on public.posts for insert with check (auth.uid() = user_id);
create policy "Authors can update posts" on public.posts for update using (auth.uid() = user_id);
create policy "Authors can delete posts" on public.posts for delete using (auth.uid() = user_id);

-- Comments
create policy "Comments viewable by all" on public.comments for select using (true);
create policy "Auth users can comment" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Likes
create policy "Likes viewable by all" on public.likes for select using (true);
create policy "Auth users can like" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at on posts
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_updated_at
  before update on public.posts
  for each row execute function update_updated_at_column();

-- Auto-create profile when user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- STORAGE
-- Run these in Supabase Dashboard > Storage > New bucket
-- Or via SQL Editor:
-- ============================================================

-- insert into storage.buckets (id, name, public)
-- values ('post-images', 'post-images', true);

-- create policy "Public read images" on storage.objects
--   for select using (bucket_id = 'post-images');

-- create policy "Auth users upload images" on storage.objects
--   for insert with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

-- create policy "Users delete own images" on storage.objects
--   for delete using (bucket_id = 'post-images' and auth.uid() = owner);
