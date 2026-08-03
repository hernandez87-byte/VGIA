"use client";

import { useState } from "react";
import type { HazardType } from "@/lib/domain/emergency";

interface EventSelectorProps {
  activeHazard: HazardType;
  isSimulation: boolean;
}

const events: Array<{
  id: HazardType;
  icon: string;
  label: string;
  idleStatus: string;
  description: string;
}> = [
  { id: "flood", icon: "≋", label: "Inundación", idleStatus: "Sin alertas", description: "Arroyos, vados y zonas bajas" },
  { id: "fire", icon: "△", label: "Incendio", idleStatus: "0 activos", description: "Urbano, forestal e industrial" },
  { id: "earthquake", icon: "⌁", label: "Sismo", idleStatus: "Sin actividad", description: "Sacudida y daño estructural" },
  { id: "hurricane", icon: "◉", label: "Huracán", idleStatus: "Sin sistemas cercanos", description: "Viento, lluvia y marejada" },
  { id: "chemical", icon: "⬡", label: "Químico", idleStatus: "Sin incidentes", description: "Fugas, humo y materiales" },
  { id: "drought", icon: "◌", label: "Sequía", idleStatus: "Vigilancia", description: "Agua y abastecimiento" },
  { id: "cosmic_impact", icon: "✦", label: "Impacto", idleStatus: "Sin amenaza", description: "Escenario extraordinario" },
];

export function EventSelector({ activeHazard, isSimulation }: EventSelectorProps) {
  const [selected, setSelected] = useState<HazardType>(activeHazard);

  return (
    <section className="event-selector event-selector-command" aria-label="Tipos de emergencia">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Monitoreo multirriesgo</span>
          <h2>Estado de los escenarios</h2>
          <p className="section-description">
            Cada motor utiliza reglas y colores propios. Seleccionar una tarjeta muestra su alcance operativo.
          </p>
        </div>
        <span className="demo-label">{isSimulation ? "Demostración" : "En vivo"}</span>
      </div>
      <div className="event-grid event-grid-command">
        {events.map((event) => {
          const isActive = event.id === activeHazard;
          return (
            <button
              className={`event-button event-${event.id} ${selected === event.id ? "active" : ""}`}
              key={event.id}
              type="button"
              onClick={() => setSelected(event.id)}
              aria-pressed={selected === event.id}
            >
              <span className="event-icon" aria-hidden="true">{event.icon}</span>
              <span className="event-card-copy">
                <strong>{event.label}</strong>
                <small>{event.description}</small>
              </span>
              <span className={isActive ? "event-state event-state-active" : "event-state"}>
                {isActive
                  ? isSimulation
                    ? "Simulación 72/100"
                    : "1 evento activo"
                  : event.id === selected
                    ? event.idleStatus
                    : event.idleStatus}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
