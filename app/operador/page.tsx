"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";

const hazards = [
  ["flood", "Inundación"],
  ["fire", "Incendio"],
  ["earthquake", "Sismo"],
  ["hurricane", "Huracán"],
  ["chemical", "Fuga química"],
  ["drought", "Sequía"],
  ["cosmic_impact", "Impacto cósmico"],
  ["infrastructure", "Falla de infraestructura"],
  ["public_safety", "Seguridad y movilidad"],
] as const;

export default function OperatorPage() {
  const [hazard, setHazard] = useState("flood");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [severity, setSeverity] = useState(50);
  const [sourceName, setSourceName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [instructions, setInstructions] = useState("");
  const [simulation, setSimulation] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const instructionList = instructions
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

      const { data, error } = await supabase.functions.invoke("ingest-alert", {
        body: {
          hazard,
          title,
          summary,
          severity,
          source_name: sourceName,
          source_url: sourceUrl || undefined,
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
          instructions: instructionList,
          is_simulation: simulation,
        },
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: `Evento publicado con folio ${String(data?.alert?.id ?? "desconocido").slice(0, 8)}.`,
      });
      setTitle("");
      setSummary("");
      setInstructions("");
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? `${error.message}. La cuenta necesita rol operator o admin.`
            : "No se pudo publicar la alerta.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workflow-shell">
      <section className="workflow-card workflow-card-wide">
        <BrandMark />
        <span className="eyebrow">Panel restringido</span>
        <h1>Publicar alerta operativa</h1>
        <p>
          La función exige sesión y rol administrativo. Marcar una simulación como real no es “probar rápido”; es fabricar pánico con formularios.
        </p>

        <form className="workflow-form workflow-grid-form" onSubmit={submit}>
          <label>
            Amenaza
            <select value={hazard} onChange={(event) => setHazard(event.target.value)}>
              {hazards.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            Severidad: {severity}/100
            <input
              type="range"
              min="0"
              max="100"
              value={severity}
              onChange={(event) => setSeverity(Number(event.target.value))}
            />
          </label>

          <label className="workflow-span-two">
            Título
            <input
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="workflow-span-two">
            Resumen
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>

          <label>
            Fuente
            <input
              required
              maxLength={160}
              value={sourceName}
              onChange={(event) => setSourceName(event.target.value)}
              placeholder="Dependencia o sistema"
            />
          </label>

          <label>
            URL de la fuente
            <input
              type="url"
              maxLength={500}
              value={sourceUrl}
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </label>

          <label>
            Expira
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
            />
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={simulation}
              onChange={(event) => setSimulation(event.target.checked)}
            />
            Publicar como simulación
          </label>

          <label className="workflow-span-two">
            Instrucciones, una por línea
            <textarea
              rows={5}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              placeholder="Evita pasos deprimidos.\nEspera una orden oficial antes de evacuar."
            />
          </label>

          {message ? (
            <p
              className={`auth-message auth-message-${message.type} workflow-span-two`}
              role="status"
            >
              {message.text}
            </p>
          ) : null}

          <button
            className="primary-button workflow-span-two"
            type="submit"
            disabled={loading}
          >
            {loading ? "Publicando…" : "Publicar evento"}
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
