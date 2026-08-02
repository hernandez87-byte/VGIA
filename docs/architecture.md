# Arquitectura inicial

## Objetivo

Separar la interfaz, el dominio de emergencias, el motor geoespacial y las integraciones oficiales. Una alerta mal acoplada a la pantalla termina convertida en deuda técnica con sirena, que es exactamente lo que no necesitamos.

## Componentes

```text
PWA Next.js
  ├─ Panel ciudadano
  ├─ Plan familiar
  ├─ Panel de negocios
  └─ Modo sin conexión

API de aplicación
  ├─ Alertas y eventos
  ├─ Refugios y recursos
  ├─ Reportes y verificación
  ├─ Check-ins familiares
  └─ Rutas recomendadas

Supabase/PostGIS
  ├─ Datos operativos
  ├─ Geometrías y zonas
  ├─ RLS y auditoría
  └─ Realtime

Procesamiento especializado
  ├─ Enrutamiento por riesgo
  ├─ Propagación de amenazas
  ├─ Simulaciones
  └─ Priorización
```

## Capas de datos

1. **Oficial:** alertas firmadas, cierres, refugios y órdenes.
2. **Operativa:** estado reportado por negocios, hospitales y refugios.
3. **Ciudadana:** reportes con evidencia y ubicación.
4. **Modelada:** estimaciones derivadas de amenaza, relieve y vulnerabilidad.

Cada registro debe incluir fuente, confianza, tiempo de observación y fecha de caducidad.

## Motor de riesgo

El prototipo contiene un cálculo genérico en `lib/risk/calculate-risk.ts`. En producción, cada amenaza tendrá un adaptador propio que entregue una salida normalizada:

```ts
interface HazardAssessment {
  score: number;
  action: RecommendedAction;
  affectedArea: GeoJSON;
  expiresAt: string;
  confidence: ConfidenceLevel;
  reasons: string[];
}
```

## Enrutamiento

La función de costo de una vía debe considerar:

- Distancia y tiempo.
- Intersección con zonas de peligro.
- Agua y velocidad de corriente.
- Puentes, túneles y pasos deprimidos.
- Humo, viento o nube química.
- Edificios dañados y perímetros.
- Cierres oficiales.
- Accesibilidad del usuario.
- Caducidad del dato.

## Sin conexión

El paquete local debe contener:

- Mapa base de la región.
- Puntos altos y refugios.
- Hospitales y contactos.
- Protocolos por amenaza.
- Plan familiar cifrado.
- Últimas rutas precalculadas.

Las actualizaciones pueden llegar por internet, SMS u otros canales de baja conectividad. El GPS no requiere datos móviles, pero los cambios operativos sí necesitan alguna fuente.

## Seguridad

- RLS en toda tabla con información personal.
- Roles separados para ciudadano, comercio, operador y autoridad.
- Alertas oficiales con firma verificable.
- Ubicaciones familiares con caducidad.
- Recursos privados visibles solo para operadores autorizados.
- Registro inmutable de acciones críticas.
- Protección contra spam, brigading y reportes duplicados.

## Siguientes decisiones técnicas

- Proveedor de mapas y estilo base.
- Motor de rutas geoespaciales.
- Estrategia de tiles sin conexión.
- Fuentes oficiales disponibles para Nuevo León.
- Modelo de autenticación de autoridades y comercios.
- Infraestructura separada para simulaciones pesadas.
