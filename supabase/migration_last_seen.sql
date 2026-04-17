-- Adiciona last_seen_at para rastrear presença do usuário
alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Permite que cada usuário atualize seu próprio perfil (para o heartbeat de presença)
create policy "Users can update own last_seen_at" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);
