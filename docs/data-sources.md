# Fuentes de datos reales

## Principio

VIGÍA no debe mezclar una ubicación cartográfica, una observación científica y una orden oficial como si tuvieran el mismo valor operativo. Cada registro conserva fuente, fecha, tipo de fuente y estado de conexión.

## USGS Earthquake Hazards Program

- Endpoint: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson`
- Uso: sismos M2.5+ de las últimas 24 horas.
- Actualización de VIGÍA: caché de 60 segundos.
- Clasificación: oficial.
- Limitación: no es una predicción sísmica ni confirma daño local.

## NASA EONET v3

- Endpoint: `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=40&days=30`
- Uso: eventos naturales abiertos, como incendios, inundaciones, tormentas, volcanes y deslaves.
- Actualización de VIGÍA: caché de 5 minutos.
- Clasificación: científica.
- Limitación: un evento abierto no equivale a una orden local de evacuación.

## OpenStreetMap Overpass

- Endpoint: `https://overpass-api.de/api/interpreter`
- Área inicial: radio de 12 km alrededor del centro de Monterrey.
- Uso: hospitales, clínicas, farmacias, estaciones de bomberos, refugios, torres de agua, puntos de agua y ferreterías.
- Actualización de VIGÍA: caché de una hora.
- Clasificación: comunitaria.
- Limitación crítica: confirma que un elemento fue cartografiado, no que esté abierto, tenga inventario o sea seguro.

## Comportamiento ante fallos

Cada conector se ejecuta de forma aislada. El agregador devuelve:

- `online` cuando una fuente respondió.
- `degraded` cuando falló, agotó el tiempo o devolvió un error HTTP.
- Conteo de registros por fuente.
- Hora de comprobación.
- Mensaje técnico del fallo.

Una fuente degradada no impide mostrar las demás.

## API interna

`GET /api/live` entrega:

```json
{
  "generatedAt": "ISO-8601",
  "hazards": [],
  "resources": [],
  "sources": []
}
```

El endpoint responde `200` cuando todas las fuentes funcionan y `206` cuando al menos una está degradada.

## Próximas fuentes prioritarias

1. Servicio Sismológico Nacional para contraste y cobertura mexicana.
2. Servicio Meteorológico Nacional y CONAGUA para ciclones, lluvias y agua.
3. Protección Civil de Nuevo León para alertas, refugios y cierres confirmados.
4. National Hurricane Center para ciclones del Atlántico y Pacífico oriental.
5. Capas oficiales de Atlas Nacional de Riesgos.

Ninguna fuente deberá activar automáticamente una evacuación sin reglas explícitas, autoridad identificada y vigencia comprobada.
