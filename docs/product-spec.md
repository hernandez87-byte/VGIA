# Especificación de producto: VIGÍA

## Visión

VIGÍA es una infraestructura digital para ayudar a personas, familias, comercios y autoridades a tomar decisiones cuando los sistemas normales dejan de funcionar.

No es un simple directorio de emergencias. Debe responder:

1. ¿Qué está ocurriendo?
2. ¿Cómo me afecta aquí?
3. ¿Debo evacuar, resguardarme, subir, alejarme o esperar?
4. ¿Qué ruta continúa siendo segura?
5. ¿Dónde están mi familia y los recursos operativos?
6. ¿Qué información es oficial, verificada o incierta?

## Principios

- La ruta se optimiza por exposición al peligro, no únicamente por distancia.
- Toda recomendación muestra fuente, hora, confianza y caducidad.
- Una orden oficial tiene prioridad sobre cualquier recomendación automática.
- La aplicación sigue siendo útil con conectividad degradada.
- Los recursos privados o sensibles no se publican sin autorización.
- La IA resume y prioriza; no certifica seguridad estructural, potabilidad ni diagnósticos.

## Motores de amenaza

### Núcleo inicial

- Inundaciones urbanas y fluviales.
- Incendios urbanos, forestales e industriales.
- Sismos y daños posteriores.
- Huracanes, lluvia extrema y marejada.
- Sequía y fallas de suministro de agua.
- Fugas químicas y nubes tóxicas.
- Apagones y fallas de infraestructura.
- Cierres viales, protestas y movilidad.

### Extensiones

- Tornados, granizo, rayos, nieve, heladas y calor extremo.
- Deslizamientos, socavones, tsunamis y actividad volcánica.
- Epidemias, contaminación, saturación hospitalaria y desabasto.
- Incidentes violentos y evacuaciones policiales.
- Tormentas solares, fallas de GPS y comunicaciones.
- Impactos cósmicos y riesgos encadenados como tsunami o ruptura de presas.

## Acciones universales

Cada motor traduce el evento a una de estas acciones:

- Monitorear.
- Prepararse.
- Evacuar.
- Resguardarse.
- Subir a una zona elevada.
- Alejarse del perímetro.
- Evitar una zona.
- Sellar el inmueble.
- Buscar atención.
- Reunificarse.

## Módulos de producto

### Panel ciudadano

- Acción inmediata.
- Tiempo disponible.
- Ruta segura y rutas descartadas.
- Refugio recomendado.
- Riesgos secundarios.
- Recursos disponibles.
- Estado familiar.

### Mapa de recursos

- Refugios.
- Agua potable, tratable, no potable e industrial.
- Alimentos.
- Farmacias y atención médica.
- Combustible y energía.
- Ferreterías y herramientas.
- Puntos de comunicación.

### Plan familiar

- Hogar, escuela y trabajo.
- Personas vulnerables.
- Medicamentos y mascotas.
- Puntos de reunión.
- Contactos autorizados.
- Estados: a salvo, evacuando, necesita ayuda, sin confirmar.

### Panel de negocios

Actualización rápida de estado: abierto, cerrado, acceso bloqueado, solo efectivo, inventario limitado o agotado.

### Panel de autoridad

- Incidentes y solicitudes de rescate.
- Capacidad de refugios.
- Rutas y perímetros.
- Recursos públicos y privados autorizados.
- Priorización de inspecciones.
- Difusión de alertas firmadas.

## Agua

Las fuentes se clasifican por uso:

- Azul: potable confirmada.
- Verde: potencialmente tratable.
- Amarillo: higiene, limpieza o sanitarios.
- Naranja: industrial o contra incendios.
- Rojo: contaminada o prohibida.
- Gris: condición desconocida.

Albercas, pozos, cisternas, ríos, tanques industriales y depósitos contra incendios pueden registrarse, pero jamás deben presentarse como equivalentes.

## Sismos

La plataforma estima vulnerabilidad y prioriza inspecciones. No afirma que un edificio caerá. Solo una revisión autorizada puede marcar un inmueble como habilitado.

## Impacto cósmico

El módulo debe separar:

- Probabilidad de impacto terrestre.
- Corredor posible.
- Escenarios de impacto.
- Probabilidad condicionada de tsunami, ruptura de presas, bloqueo de ríos o inundación local.

Los resultados deben mostrar rangos e incertidumbre, nunca porcentajes ornamentales.

## Exclusiones

VIGÍA no mostrará inventarios o ubicaciones de armas. El módulo de seguridad mostrará autoridades, refugios vigilados, zonas que evitar y canales de emergencia.

## MVP geográfico

La primera implementación debe limitarse a Monterrey y su zona metropolitana para validar calidad de datos, rutas, refugios y alianzas operativas.
