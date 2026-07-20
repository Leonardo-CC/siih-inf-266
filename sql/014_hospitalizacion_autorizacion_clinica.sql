-- 014_hospitalizacion_autorizacion_clinica.sql
-- Ejecutar en Supabase SQL Editor despues de los scripts anteriores.
-- Refuerza que la hospitalizacion sea un proceso clinico independiente
-- y compatible con el endpoint /api/hospitalizaciones/autorizar.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_hospitalizacion') then
    create type estado_hospitalizacion as enum ('activa', 'alta', 'cancelada');
  end if;
end $$;

create table if not exists public.hospitalizacion (
  id_hospitalizacion bigserial primary key,
  id_consulta bigint null references public.consulta(id_consulta) on delete set null,
  id_paciente bigint not null references public.paciente(id_paciente) on delete restrict,
  id_medico bigint not null references public.medico(id_medico) on delete restrict,
  motivo_ingreso text not null,
  fecha_ingreso timestamptz not null default now(),
  fecha_alta timestamptz null,
  estado estado_hospitalizacion not null default 'activa'
);

alter table public.hospitalizacion
  add column if not exists id_consulta bigint null references public.consulta(id_consulta) on delete set null,
  add column if not exists id_paciente bigint references public.paciente(id_paciente) on delete restrict,
  add column if not exists id_medico bigint references public.medico(id_medico) on delete restrict,
  add column if not exists motivo_ingreso text,
  add column if not exists fecha_ingreso timestamptz default now(),
  add column if not exists fecha_alta timestamptz null,
  add column if not exists estado estado_hospitalizacion default 'activa';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'hospitalizacion'
      and column_name = 'estado'
      and data_type = 'text'
  ) then
    alter table public.hospitalizacion
      add constraint hospitalizacion_estado_chk
      check (estado in ('activa', 'alta', 'cancelada')) not valid;
  end if;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'hospitalizacion'
      and indexname = 'hospitalizacion_id_consulta_unique_idx'
  ) then
    create unique index hospitalizacion_id_consulta_unique_idx
      on public.hospitalizacion(id_consulta)
      where id_consulta is not null;
  end if;
end $$;

create index if not exists hospitalizacion_id_paciente_idx
  on public.hospitalizacion(id_paciente);

create index if not exists hospitalizacion_id_medico_idx
  on public.hospitalizacion(id_medico);

create index if not exists hospitalizacion_estado_idx
  on public.hospitalizacion(estado);

comment on column public.hospitalizacion.motivo_ingreso is
  'Texto clinico estructurado: diagnostico de ingreso, observaciones, rol e ID del profesional autorizante.';
