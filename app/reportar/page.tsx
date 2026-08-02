"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";

const categories = [
  ["flood", "Calle inundada"],
  ["road_blocked", "Calle bloqueada"],
  ["fire", "Fuego o humo"],
  ["structural_damage", "Daño estructural"],
  ["water_shortage", "Falta de agua"],
  ["medical_help", "Ayuda médica"],
  ["other", "Otro incidente"],
] as const;

interface Coordinates {
  latitude: number;
  longitude: number;
}

function getLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Este dispositivo no permite obtener ubicación."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => reject(new Error("No se pudo obtener la ubicación.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 15000 },
    );
  });
}

export default function ReportPage() {
  const [category, setCategory] = useState("flood");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function locate() {
    setMessage(null);
    try {
      const nextCoordinates = await getLocation();
      setCoordinates(nextCoordinates);
      setMessage({ type: "success", text: "Ubicación obtenida." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo ubicar el reporte.",
      });
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!coordinates) {
      setMessage({ type: "error", text: "Obtén la ubicación antes de enviar." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Debes iniciar sesión para enviar un reporte.");
      }

      const { data, error } = await supabase.rpc("submit_citizen_report", {
        report_category: category,
        report_description: description,
        report_latitude: coordinates.latitude,
        report_longitude: coordinates.longitude,
        report_event_id: null,
        report_expires_at: null,
      });

      if (error) throw error;

      setDescription("");
      setMessage({
        type: "success",
        text: `Reporte recibido con folio ${String(data).slice(0, 8)}. Permanecerá sin verificar hasta su revisión.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo enviar el reporte.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workflow-shell">
      <section className="workflow-card">
        <BrandMark />
        <span className="eyebrow">Reporte ciudadano</span>
        <h1>¿Qué está ocurriendo?</h1>
        <p>
          Informa una condición observable. No declares evacuaciones ni certifiques daños; para eso existen autoridades y profesionales, aunque a internet le encante graduarse solo.
        </p>

        <form className="workflow-form" onSubmit={submit}>
          <label>
            Tipo de incidente
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            Describe lo que observas
            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows={6}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Ejemplo: el agua cubre toda la avenida y los vehículos ya no pueden pasar."
            />
          </label>

          <div className="location-box">
            <div>
              <strong>{coordinates ? "Ubicación lista" : "Ubicación necesaria"}</strong>
              <span>
                {coordinates
                  ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)}`
                  : "Solo se usa para colocar el incidente en el mapa."}
              </span>
            </div>
            <button className="secondary-button" type="button" onClick={locate}>
              Obtener ubicación
            </button>
          </div>

          {message ? (
            <p className={`auth-message auth-message-${message.type}`} role="status">
              {message.text}
            </p>
          ) : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Enviando…" : "Enviar reporte"}
          </button>
        </form>

        <nav className="workflow-nav">
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/">Volver al tablero</Link>
        </nav>
      </section>
    </main>
  );
}
