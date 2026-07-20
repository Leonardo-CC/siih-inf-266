-- 015_farmacia_facturacion_finanzas.sql
-- Ejecutar en Supabase SQL Editor despues del 014.
-- Habilita facturacion detallada de medicamentos y el modulo de finanzas.

alter table public.medicamento
  add column if not exists precio numeric(10,2) not null default 0;

alter table public.pago
  add column if not exists id_consulta integer references public.consulta(id_consulta) on delete set null,
  add column if not exists id_inscripcion integer,
  add column if not exists id_receta integer references public.receta(id_receta) on delete set null,
  add column if not exists id_paciente integer references public.paciente(id_paciente) on delete set null,
  add column if not exists estado_pago varchar(30) default 'aprobado',
  add column if not exists fecha_pago timestamp without time zone default current_timestamp;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pago' and column_name = 'id_cita' and is_nullable = 'NO'
  ) then
    alter table public.pago alter column id_cita drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'pago' and column_name = 'id_paciente' and is_nullable = 'NO'
  ) then
    alter table public.pago alter column id_paciente drop not null;
  end if;
end $$;

do $$
begin
  alter table public.pago drop constraint if exists check_metodo_pago_values;
  alter table public.pago drop constraint if exists pago_metodo_pago_check;
  execute 'alter table public.pago add constraint pago_metodo_pago_check check (metodo_pago in (''efectivo'', ''transferencia'', ''tarjeta''))';
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.pago drop constraint if exists pago_estado_pago_check;
  execute 'alter table public.pago add constraint pago_estado_pago_check check (estado_pago in (''pendiente'', ''pendiente_validacion'', ''aprobado'', ''rechazado'', ''cancelado''))';
exception
  when duplicate_object then null;
end $$;

create table if not exists public.factura_detalle (
  id_detalle_factura integer generated always as identity primary key,
  id_factura integer not null references public.factura(id_factura) on delete cascade,
  descripcion varchar(220) not null,
  cantidad numeric(10,2) not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null check (precio_unitario >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

create index if not exists idx_factura_detalle_factura
  on public.factura_detalle(id_factura);

create table if not exists public.movimiento_financiero (
  id_movimiento integer generated always as identity primary key,
  tipo varchar(20) not null check (tipo in ('ingreso', 'egreso')),
  categoria varchar(80) not null,
  concepto varchar(180) not null,
  monto numeric(12,2) not null check (monto > 0),
  metodo_pago varchar(30),
  referencia varchar(120),
  fecha_movimiento timestamp without time zone not null default current_timestamp,
  observaciones text,
  created_at timestamp without time zone not null default current_timestamp
);

create index if not exists idx_movimiento_financiero_fecha
  on public.movimiento_financiero(fecha_movimiento desc);

create index if not exists idx_movimiento_financiero_tipo
  on public.movimiento_financiero(tipo);

create index if not exists idx_pago_receta
  on public.pago(id_receta);
