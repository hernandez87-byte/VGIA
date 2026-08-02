# VIGÍA

VIGÍA es una plataforma de prevención, respuesta y recuperación ante emergencias. Convierte eventos, mapas de riesgo, cierres y recursos disponibles en instrucciones claras para cada persona.

> Estado: MVP conectado. El proyecto contiene datos de simulación claramente identificados y todavía no debe usarse como sustituto de Protección Civil, servicios de emergencia o evaluación profesional.

## Integraciones activas

- Next.js 16, React 19 y TypeScript estricto.
- Supabase Auth con sesiones SSR.
- PostgreSQL + PostGIS para zonas, cierres y recursos.
- Supabase Realtime para actualizar el tablero.
- Storage privado para evidencias de reportes.
- Edge Function `ingest-alert` protegida por JWT y rol de operador.
- MapLibre para visualizar geometrías y recursos.
- PWA con caché conservador de la carcasa pública.
- GitHub Actions para lint, tipos y build.
- `pg_net` restringido para futuros conectores y trabajos HTTP de servidor.

## Funciones disponibles

- Lectura pública de eventos verificados y no vencidos.
- Mapa de zonas de riesgo, cierres y recursos.
- Búsqueda geoespacial de recursos cercanos.
- Inicio de sesión y registro por correo.
- Actualización automática mediante Realtime.
- Reportes ciudadanos geolocalizados con estado inicial no verificado.
- Creación de grupos familiares y confirmaciones de seguridad por 24 horas.
- Panel restringido para publicar alertas operativas o simulaciones.
- Endpoint de salud con comprobación real de base de datos.
- Fallback local que nunca se presenta como información oficial.

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Completa `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_MAP_STYLE_URL=https://demotiles.maplibre.org/style.json
NEXT_PUBLIC_DEFAULT_LATITUDE=25.6866
NEXT_PUBLIC_DEFAULT_LONGITUDE=-100.3161
```

El repositorio incluye como respaldo la URL y la clave publicable del proyecto de desarrollo. La clave publicable es visible por diseño y su alcance está limitado por RLS. Nunca coloques una clave `service_role` o secreta en variables `NEXT_PUBLIC_*` ni en el repositorio.

## Base de datos

Las migraciones se encuentran en `supabase/migrations` y los datos demostrativos en `supabase/seed.sql`.

```bash
supabase link --project-ref TU_PROJECT_REF
supabase db push
supabase db reset --linked
```

`db reset --linked` destruye datos; úsalo únicamente en un proyecto de desarrollo. La vida ya trae suficientes accidentes sin añadir uno manualmente.

## Rutas de aplicación

```text
/             Tablero público
/login        Registro e inicio de sesión
/reportar     Reporte ciudadano geolocalizado
/familia      Grupos y confirmaciones de seguridad
/operador     Publicación restringida de alertas
```

## API

### Tablero

```http
GET /api/dashboard
```

### Recursos cercanos

```http
GET /api/nearby-resources?lat=25.6866&lng=-100.3161&radius=15000
```

### Salud

```http
GET /api/health
```

Responde `503` cuando la base no está configurada o no puede alcanzarse.

## Publicación de alertas

La Edge Function `ingest-alert` exige:

1. JWT válido.
2. `app_metadata.role` con valor `operator` o `admin`.
3. Carga útil validada con tipo, fuente, severidad, fechas e instrucciones.

Una cuenta normal no puede publicar eventos.

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run check
```

## Estructura

```text
app/                         Aplicación, autenticación y API
components/                  Interfaz y mapa
lib/data/                    Consultas del tablero
lib/domain/                  Tipos del dominio
lib/supabase/                Clientes de navegador, servidor y proxy
supabase/functions/          Funciones protegidas
supabase/migrations/         Esquema, RLS, vistas y RPC
supabase/seed.sql            Datos de simulación
public/sw.js                 Modo degradado sin conexión
docs/                        Producto y arquitectura
```

## Reglas de seguridad

- Mostrar siempre fuente, hora, vigencia y confianza.
- No declarar edificios seguros mediante IA.
- No certificar potabilidad sin verificación sanitaria.
- No inventar órdenes de evacuación.
- No publicar recursos privados o infraestructura sensible.
- No calcular rutas “seguras” sin cierres, riesgo por segmento y datos vigentes.
- No guardar sesión, API ni datos personalizados en el service worker.
- No conceder RPC de escritura a usuarios anónimos.

## Límites actuales

- Los datos cargados inicialmente son simulaciones.
- Todavía no hay navegación vial ni motor de evacuación.
- No existen conectores oficiales con Protección Civil, CONAGUA, SSN o SMN.
- El modo sin conexión guarda la interfaz pública, no garantiza datos operativos recientes.
- Los grupos familiares todavía no incluyen invitaciones por correo o teléfono.
- El proyecto aún no está desplegado en Vercel.
