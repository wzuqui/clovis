-- Adiciona coluna title na tabela posts
-- Execute isso no SQL Editor do Supabase se já rodou o schema original

alter table public.posts add column if not exists title text not null default '';
