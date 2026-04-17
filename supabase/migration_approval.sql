-- Migration: sistema de aprovação de usuários
-- Execute no Supabase → SQL Editor

-- 1. Adiciona colunas em profiles
alter table public.profiles
  add column if not exists is_approved boolean not null default false,
  add column if not exists email text;

-- 2. Atualiza trigger para salvar email e auto-aprovar admin
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, avatar_url, email, is_approved)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    (new.email = 'willianluiszuqui@gmail.com')
  );
  return new;
end;
$$;

-- 3. Aprova o admin se já existir na tabela (e preenche o email)
update public.profiles
set
  is_approved = true,
  email = (select email from auth.users where id = profiles.id)
where id = (select id from auth.users where email = 'willianluiszuqui@gmail.com');

-- Preenche email dos usuários existentes que já têm profile
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 4. RLS: posts/comments/likes só visíveis para usuários aprovados
drop policy if exists "Posts viewable by all" on public.posts;
create policy "Posts viewable by approved users" on public.posts
  for select using (
    (select is_approved from public.profiles where id = auth.uid())
  );

drop policy if exists "Comments viewable by all" on public.comments;
create policy "Comments viewable by approved users" on public.comments
  for select using (
    (select is_approved from public.profiles where id = auth.uid())
  );

drop policy if exists "Likes viewable by all" on public.likes;
create policy "Likes viewable by approved users" on public.likes
  for select using (
    (select is_approved from public.profiles where id = auth.uid())
  );

-- 5. Remove política de update próprio; apenas admin atualiza profiles
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Admin can update profiles" on public.profiles
  for update using (
    (select email from auth.users where id = auth.uid()) = 'willianluiszuqui@gmail.com'
  );
