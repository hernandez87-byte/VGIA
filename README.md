# VIGÍA

VIGÍA es una plataforma de prevención, respuesta y recuperación ante emergencias. Convierte alertas, mapas de riesgo, rutas, refugios y recursos disponibles en una instrucción clara para cada persona.

> Estado: base inicial del MVP. Los datos mostrados son demostrativos y no deben usarse para tomar decisiones reales de emergencia.

## Qué incluye esta primera entrega

- Panel ciudadano responsive en Next.js.
- Escenario demostrativo de inundación con acción recomendada.
- Selector de amenazas: inundación, incendio, sismo, huracán, fuga química, sequía e impacto cósmico.
- Vista de ruta segura, refugio recomendado, recursos y estado familiar.
- Motor de puntuación de riesgo desacoplado.
- Esquema inicial de Supabase/PostGIS.
- Manifiesto PWA y endpoint de salud.
- Documentación de producto y arquitectura.
- Flujo de integración continua para lint, tipos y build.

## Inicio local

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:3000`.

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
lib/domain/             Tipos del dominio
lib/risk/               Motor de riesgo demostrativo
supabase/migrations/    Esquema geoespacial inicial
docs/                   Producto y arquitectura
```

## Principio de seguridad

VIGÍA debe mostrar siempre fuente, hora y confianza. La IA puede resumir y priorizar, pero no declarar un edificio seguro, inventar una evacuación, certificar agua potable ni sustituir autoridades o especialistas.

## Próximo incremento

1. Conectar Supabase.
2. Integrar mapa real con MapLibre.
3. Cargar capas geográficas de Monterrey.
4. Implementar autenticación y plan familiar.
5. Integrar alertas oficiales y verificación de refugios.
6. Añadir modo sin conexión.
