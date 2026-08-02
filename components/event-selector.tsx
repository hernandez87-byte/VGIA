"use client";

import { useState } from "react";
import type { HazardType } from "@/lib/domain/emergency";

interface EventSelectorProps {
  activeHazard: HazardType;
  isSimulation: boolean;
}

const events: Array<{ id: HazardType; icon: string; label: string }> = [
  { id: "flood", icon: "≋", label: "Inundación" },
  { id: "fire", icon: "△", label: "Incendio" },
  { id: "earthquake", icon: "⌁", label: "Sismo" },
  { id: "hurricane", icon: "◉", label: "Huracán" },
  { id: "chemical", icon: "⬡", label: "Químico" },
  { id: "drought", icon: "◌", label: "Sequía" },
  { id: "cosmic_impact", icon: "✦", label: "Impacto" },
];

export function EventSelector({ activeHazard, isSimulation }: EventSelectorProps) {
  const [selected, setSelected] = useState<HazardType>(activeHazard);

  return (
    <section className="event-selector" aria-label="Tipos de emergencia">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Monitoreo multirriesgo</span>
          <h2>Estado de los escenarios</h2>
        </div>
        <span className="demo-label">{isSimulation ? "Demostración" : "En vivo"}</span>
      </div>
      <div className="event-grid">
        {events.map((event) => {
          const isActive = event.id === activeHazard;
          return (
            <button
              className={selected === event.id ? "event-button active" : "event-button"}
              key={event.id}
              type="button"
              onClick={() => setSelected(event.id)}
              aria-pressed={selected === event.id}
            >
              <span className="event-icon" aria-hidden="true">{event.icon}</span>
              <span className="event-label">{event.label}</span>
              <small className={isActive ? "event-state event-state-active" : "event-state"}>
                {isActive
                  ? isSimulation
                    ? "Simulación activa"
                    : "1 evento activo"
                  : "Sin incidentes"}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
