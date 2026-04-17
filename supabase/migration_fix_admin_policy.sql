-- Corrige política de UPDATE em profiles
-- auth.users não é acessível pelo client; usar auth.email() no lugar

drop policy if exists "Admin can update profiles" on public.profiles;

create policy "Admin can update profiles" on public.profiles
  for update using (
    auth.email() = 'willianluiszuqui@gmail.com'
  );
