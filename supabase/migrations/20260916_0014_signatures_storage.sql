-- Bucket de firmas (idempotente)
-- Garantiza que el bucket 'signatures' exista y que los usuarios autenticados
-- puedan subir firmas. No modifica buckets existentes.

insert into storage.buckets (id, name, public)
values ('signatures', 'signatures', false)
on conflict (id) do nothing;

do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'storage' and tablename = 'objects'
          and policyname = 'signatures_upload_authenticated'
    ) then
        create policy signatures_upload_authenticated
            on storage.objects for insert
            to authenticated
            with check (bucket_id = 'signatures');
    end if;
end $$;

-- Nota sobre lectura: la app usa getPublicUrl() para mostrar firmas. Si el
-- bucket es privado, hay que migrar el front a URLs firmadas (ver
-- docs/DECISIONES_TECNICAS.md D09).