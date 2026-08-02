"use client";

import { useState } from "react";

const events = [
  { id: "flood", icon: "≋", label: "Inundación" },
  { id: "fire", icon: "△", label: "Incendio" },
  { id: "earthquake", icon: "⌁", label: "Sismo" },
  { id: "hurricane", icon: "◉", label: "Huracán" },
  { id: "chemical", icon: "⬡", label: "Químico" },
  { id: "drought", icon: "◌", label: "Sequía" },
  { id: "cosmic", icon: "✦", label: "Impacto" },
];

export function EventSelector() {
  const [selected, setSelected] = useState("flood");

  return (
    <section className="event-selector" aria-label="Tipos de emergencia">
      <div className="section-heading compact-heading">
        <div>
          <span className="eyebrow">Motores de riesgo</span>
          <h2>Escenarios integrados</h2>
        </div>
        <span className="demo-label">Demo</span>
      </div>
      <div className="event-grid">
        {events.map((event) => (
          <button
            className={selected === event.id ? "event-button active" : "event-button"}
            key={event.id}
            type="button"
            onClick={() => setSelected(event.id)}
            aria-pressed={selected === event.id}
          >
            <span className="event-icon" aria-hidden="true">{event.icon}</span>
            <span>{event.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
