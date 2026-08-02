do $$
declare
  demo_event_id uuid;
begin
  if exists (
    select 1
    from public.emergency_events
    where is_simulation = true
      and title = 'Simulación de inundación urbana en Monterrey'
  ) then
    return;
  end if;

  insert into public.emergency_events (
    hazard,
    title,
    summary,
    severity,
    verification,
    source_name,
    affected_area,
    starts_at,
    expires_at,
    is_simulation,
    instructions
  ) values (
    'flood',
    'Simulación de inundación urbana en Monterrey',
    'Escenario de demostración para validar mapas, rutas, refugios y recursos. No representa una emergencia real.',
    72,
    'verified',
    'VIGÍA · Datos de demostración',
    public.st_geomfromtext(
      'MULTIPOLYGON(((-100.352 25.676,-100.337 25.676,-100.337 25.687,-100.352 25.687,-100.352 25.676)))',
      4326
    ),
    now(),
    now() + interval '365 days',
    true,
    '["Evita pasos deprimidos y corrientes de agua.","Dirígete al punto seguro únicamente por rutas verificadas."]'::jsonb
  )
  returning id into demo_event_id;

  insert into public.hazard_zones (
    event_id,
    risk_score,
    expected_depth_m,
    expected_arrival_at,
    geometry,
    properties
  ) values (
    demo_event_id,
    78,
    0.8,
    now() + interval '35 minutes',
    public.st_geomfromtext(
      'MULTIPOLYGON(((-100.352 25.676,-100.337 25.676,-100.337 25.687,-100.352 25.687,-100.352 25.676)))',
      4326
    ),
    '{"label":"Zona inundable simulada","confidence":"medium"}'::jsonb
  );

  insert into public.road_closures (
    event_id,
    reason,
    verification,
    geometry,
    starts_at,
    expires_at,
    is_simulation
  ) values (
    demo_event_id,
    'Paso deprimido cerrado por acumulación de agua · simulación',
    'verified',
    public.st_geomfromtext(
      'MULTILINESTRING((-100.346 25.678,-100.341 25.684))',
      4326
    ),
    now(),
    now() + interval '365 days',
    true
  );
end $$;

insert into public.resources (
  category,
  name,
  description,
  location,
  address,
  status,
  verification,
  capacity,
  capacity_unit,
  is_public,
  last_verified_at,
  is_simulation,
  metadata
)
select *
from (
  values
    (
      'shelter'::public.resource_category,
      'Centro de apoyo VIGÍA',
      'Refugio demostrativo para validar la experiencia del MVP.',
      public.st_setsrid(public.st_makepoint(-100.316, 25.686), 4326)::public.geography,
      'Monterrey, Nuevo León',
      'available',
      'verified'::public.verification_level,
      120::numeric,
      'personas',
      true,
      now(),
      true,
      '{"pets":true,"power":true,"medical":true}'::jsonb
    ),
    (
      'water'::public.resource_category,
      'Punto de agua potable VIGÍA',
      'Punto demostrativo. La potabilidad real siempre requiere verificación sanitaria.',
      public.st_setsrid(public.st_makepoint(-100.327, 25.681), 4326)::public.geography,
      'Monterrey, Nuevo León',
      'available',
      'verified'::public.verification_level,
      5000::numeric,
      'litros',
      true,
      now(),
      true,
      '{"water_class":"potable_verified","distribution":"scheduled"}'::jsonb
    ),
    (
      'medical'::public.resource_category,
      'Módulo médico VIGÍA',
      'Atención básica demostrativa y clasificación inicial.',
      public.st_setsrid(public.st_makepoint(-100.333, 25.690), 4326)::public.geography,
      'Monterrey, Nuevo León',
      'limited',
      'verified'::public.verification_level,
      20::numeric,
      'pacientes por hora',
      true,
      now(),
      true,
      '{"services":["triage","first_aid"]}'::jsonb
    ),
    (
      'hardware'::public.resource_category,
      'Suministros de emergencia VIGÍA',
      'Bombas, lonas, linternas y equipo demostrativo.',
      public.st_setsrid(public.st_makepoint(-100.322, 25.676), 4326)::public.geography,
      'Monterrey, Nuevo León',
      'limited',
      'verified'::public.verification_level,
      null::numeric,
      null::text,
      true,
      now(),
      true,
      '{"items":["water_pump","tarps","flashlights"]}'::jsonb
    )
) as source(
  category,
  name,
  description,
  location,
  address,
  status,
  verification,
  capacity,
  capacity_unit,
  is_public,
  last_verified_at,
  is_simulation,
  metadata
)
where not exists (
  select 1
  from public.resources existing
  where existing.name = source.name
    and existing.is_simulation = true
);
