-- Registro por invitación (allowlist)
-- Si la tabla public.signup_allowlist contiene al menos un email, el registro
-- queda restringido a esos emails. Si está vacía, el registro sigue abierto.

create table if not exists public.signup_allowlist (
    email      text primary key,
    invited_at timestamptz not null default now()
);

-- Función de guard: permite el registro si la lista está vacía o el email está invitado.
create or replace function public.is_signup_allowed(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select not exists (select 1 from public.signup_allowlist)
        or exists (select 1 from public.signup_allowlist where email = lower(trim(p_email)));
$$;

-- Trigger que se ejecuta antes de crear cualquier usuario en auth.users.
create or replace function public.check_signup_allowlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_signup_allowed(new.email) then
        raise exception 'Registro restringido: se requiere un email invitado por el administrador.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_restrict_signup on auth.users;

create trigger trg_restrict_signup
before insert on auth.users
for each row execute function public.check_signup_allowlist();

-- Instrucciones de uso (ver docs/DECISIONES_TECNICAS.md D08):
--   insert into public.signup_allowlist (email) values ('tesorero@congregacion.com');
-- Para volver a abrir el registro: truncate public.signup_allowlist;