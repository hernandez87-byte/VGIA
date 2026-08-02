# VIGÍA

VIGÍA es una plataforma de prevención, respuesta y recuperación ante emergencias. Convierte alertas, mapas de riesgo, rutas, refugios y recursos disponibles en una instrucción clara para cada persona.

> Estado: MVP en desarrollo. La sección de actividad observada ya consume fuentes externas reales; el escenario principal, las rutas y la disponibilidad operativa continúan siendo demostrativos.

## Qué incluye

- Panel ciudadano responsive en Next.js.
- Escenario demostrativo de inundación con acción recomendada.
- Selector de amenazas: inundación, incendio, sismo, huracán, fuga química, sequía e impacto cósmico.
- Vista de ruta segura, refugio recomendado, recursos y estado familiar.
- Motor de puntuación de riesgo desacoplado.
- Esquema inicial de Supabase/PostGIS.
- Manifiesto PWA y endpoints de salud y actividad en vivo.
- Integración continua para lint, tipos y build.

## Fuentes reales conectadas

- **USGS Earthquake Hazards Program:** sismos M2.5+ de las últimas 24 horas mediante GeoJSON.
- **NASA EONET v3:** incendios, inundaciones, tormentas, volcanes, deslaves y otros eventos naturales abiertos.
- **OpenStreetMap Overpass:** hospitales, clínicas, farmacias, bomberos, refugios, infraestructura de agua y ferreterías alrededor de Monterrey.

Los recursos provenientes de OpenStreetMap son datos comunitarios. Su presencia en el mapa no confirma que estén abiertos, tengan inventario o sean seguros durante una emergencia.

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

## Endpoints

```text
GET /api/health
GET /api/live
```

`/api/live` devuelve un snapshot tolerante a fallos. Si una fuente externa no responde, las demás siguen disponibles y el endpoint marca la conexión degradada.

## Comandos

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Estructura

```text
app/                    Aplicación y API
components/             Interfaz reutilizable
lib/data-sources/       Conectores y agregador de fuentes externas
lib/domain/             Tipos del dominio
lib/risk/               Motor de riesgo demostrativo
supabase/migrations/    Esquema geoespacial inicial
docs/                   Producto, arquitectura y fuentes
```

## Principio de seguridad

VIGÍA debe mostrar siempre fuente, hora y confianza. La IA puede resumir y priorizar, pero no declarar un edificio seguro, inventar una evacuación, certificar agua potable ni sustituir autoridades o especialistas.

## Próximo incremento

1. Crear y enlazar el proyecto real de Supabase.
2. Persistir snapshots externos con deduplicación y auditoría.
3. Integrar mapa real con MapLibre.
4. Cargar capas oficiales de Monterrey y Protección Civil.
5. Implementar autenticación y plan familiar.
6. Añadir modo sin conexión funcional.
