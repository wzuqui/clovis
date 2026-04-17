-- Adiciona coluna type às reações (default 'like' para registros existentes)
alter table public.likes
  add column if not exists type text not null default 'like';

-- Substitui unique(post_id, user_id) por unique(post_id, user_id, type)
-- para permitir um usuário reagir com tipos diferentes no mesmo post
alter table public.likes
  drop constraint if exists likes_post_id_user_id_key;

alter table public.likes
  add constraint if not exists likes_post_id_user_id_type_key
  unique (post_id, user_id, type);
