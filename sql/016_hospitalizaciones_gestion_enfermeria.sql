-- 016_hospitalizaciones_gestion_enfermeria.sql
-- Completa el flujo de hospitalizaciones:
-- autorizacion clinica, tiempo de internacion, ubicacion, seguimiento y alta.

do $$
begin
  if not exists (select 1 from pg_type where typname = 'estado_hospitalizacion') then
    create type estado_hospitalizacion as enum ('activa', 'alta', 'cancelada');
  end if;
end $$;

create table if not exists public.hospitalizacion (
  id_hospitalizacion bigserial primary key,
  id_consulta bigint references public.consulta(id_consulta) on delete set null,
  id_paciente bigint references public.paciente(id_paciente) on delete cascade,
  id_medico bigint references public.medico(id_medico) on delete set null,
  motivo_ingreso text not null,
  fecha_ingreso timestamptz not null default now(),
  estado estado_hospitalizacion not null default 'activa'
);

alter table public.hospitalizacion
  add column if not exists id_consulta bigint,
  add column if not exists id_paciente bigint,
  add column if not exists id_medico bigint,
  add column if not exists motivo_ingreso text,
  add column if not exists fecha_ingreso timestamptz default now(),
  add column if not exists estado estado_hospitalizacion default 'activa',
  add column if not exists tiempo_internacion_dias integer,
  add column if not exists fecha_estimada_alta date,
  add column if not exists sala text,
  add column if not exists cama text,
  add column if not exists fecha_alta timestamptz,
  add column if not exists motivo_alta text,
  add column if not exists indicaciones_alta text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'hospitalizacion_tiempo_internacion_chk'
  ) then
    alter table public.hospitalizacion
      add constraint hospitalizacion_tiempo_internacion_chk
      check (tiempo_internacion_dias is null or tiempo_internacion_dias > 0);
  end if;
end $$;

create unique index if not exists hospitalizacion_id_consulta_unique_idx
  on public.hospitalizacion(id_consulta)
  where id_consulta is not null;

create index if not exists hospitalizacion_id_paciente_idx
  on public.hospitalizacion(id_paciente);

create index if not exists hospitalizacion_id_medico_idx
  on public.hospitalizacion(id_medico);

create index if not exists hospitalizacion_estado_idx
  on public.hospitalizacion(estado);

comment on column public.hospitalizacion.tiempo_internacion_dias is 'Tiempo estimado de internacion indicado al autorizar la hospitalizacion.';
comment on column public.hospitalizacion.fecha_estimada_alta is 'Fecha probable de alta clinica.';
comment on column public.hospitalizacion.motivo_alta is 'Motivo clinico o administrativo por el que se da de alta.';
comment on column public.hospitalizacion.indicaciones_alta is 'Indicaciones, cuidados y seguimiento posterior al alta.';
