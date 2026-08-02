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

const socialCategories = [
  ["clima", "Clima severo"],
  ["inundacion", "Inundación"],
  ["incendio", "Incendio"],
  ["movilidad", "Cierre o accidente vial"],
  ["rescate", "Rescate o evacuación"],
  ["sismo", "Sismo"],
  ["huracan", "Huracán o ciclón"],
  ["quimico", "Riesgo químico"],
  ["agua", "Agua o drenaje"],
  ["infraestructura", "Infraestructura"],
  ["otro", "Otro evento de Protección Civil"],
] as const;

function isTikTokUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return [
      "tiktok.com",
      "www.tiktok.com",
      "vm.tiktok.com",
      "vt.tiktok.com",
    ].includes(url.hostname.toLocaleLowerCase("en-US"));
  } catch {
    return false;
  }
}

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

  const [socialSourceName, setSocialSourceName] = useState(
    "Protección Civil Nuevo León",
  );
  const [socialAccountUrl, setSocialAccountUrl] = useState("");
  const [socialPostUrl, setSocialPostUrl] = useState("");
  const [socialTitle, setSocialTitle] = useState("");
  const [socialCategory, setSocialCategory] = useState("clima");
  const [socialPublishedAt, setSocialPublishedAt] = useState("");
  const [socialLoading, setSocialLoading] = useState(false);
  const [socialMessage, setSocialMessage] = useState<{
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

  async function submitSocialPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSocialLoading(true);
    setSocialMessage(null);

    try {
      if (!isTikTokUrl(socialPostUrl)) {
        throw new Error("La publicación debe ser una URL válida de TikTok");
      }
      if (!socialAccountUrl || !isTikTokUrl(socialAccountUrl)) {
        throw new Error("La cuenta de origen debe ser una URL oficial de TikTok");
      }

      const supabase = createClient();
      const { error } = await supabase.from("official_social_posts").insert({
        platform: "tiktok",
        source_name: socialSourceName.trim(),
        source_account_url: socialAccountUrl.trim(),
        post_url: socialPostUrl.trim(),
        title: socialTitle.trim(),
        category: socialCategory,
        published_at: socialPublishedAt
          ? new Date(socialPublishedAt).toISOString()
          : new Date().toISOString(),
        is_verified: true,
        is_active: true,
      });

      if (error) throw error;

      setSocialMessage({
        type: "success",
        text: "Video oficial registrado. La portada se obtiene mediante TikTok oEmbed y aparecerá en el tablero.",
      });
      setSocialPostUrl("");
      setSocialTitle("");
      setSocialPublishedAt("");
    } catch (error) {
      setSocialMessage({
        type: "error",
        text:
          error instanceof Error
            ? `${error.message}. La cuenta necesita rol operator o admin.`
            : "No se pudo registrar el video oficial.",
      });
    } finally {
      setSocialLoading(false);
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
      </section>

      <section className="workflow-card workflow-card-wide">
        <span className="eyebrow">Video oficial</span>
        <h2>Agregar incidente desde TikTok</h2>
        <p>
          Registra únicamente videos publicados por cuentas oficiales de Protección Civil,
          bomberos, seguridad municipal o Gobierno. El título debe describir un evento real;
          política, promoción institucional y entretenimiento no aparecerán en el tablero.
        </p>

        <form className="workflow-form workflow-grid-form" onSubmit={submitSocialPost}>
          <label>
            Dependencia
            <input
              required
              maxLength={160}
              value={socialSourceName}
              onChange={(event) => setSocialSourceName(event.target.value)}
              placeholder="Protección Civil Monterrey"
            />
          </label>

          <label>
            Categoría
            <select
              value={socialCategory}
              onChange={(event) => setSocialCategory(event.target.value)}
            >
              {socialCategories.map(([value, label]) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>

          <label className="workflow-span-two">
            Cuenta oficial de TikTok
            <input
              required
              type="url"
              maxLength={500}
              value={socialAccountUrl}
              onChange={(event) => setSocialAccountUrl(event.target.value)}
              placeholder="https://www.tiktok.com/@cuentaoficial"
            />
          </label>

          <label className="workflow-span-two">
            URL del video
            <input
              required
              type="url"
              maxLength={700}
              value={socialPostUrl}
              onChange={(event) => setSocialPostUrl(event.target.value)}
              placeholder="https://www.tiktok.com/@cuentaoficial/video/..."
            />
          </label>

          <label className="workflow-span-two">
            Descripción del incidente
            <textarea
              required
              rows={4}
              minLength={8}
              maxLength={280}
              value={socialTitle}
              onChange={(event) => setSocialTitle(event.target.value)}
              placeholder="Incendio activo en... Protección Civil solicita evitar la zona."
            />
          </label>

          <label>
            Fecha y hora de publicación
            <input
              type="datetime-local"
              value={socialPublishedAt}
              onChange={(event) => setSocialPublishedAt(event.target.value)}
            />
          </label>

          <div className="workflow-info-box">
            VIGÍA solo muestra publicaciones de los últimos 21 días y vuelve a filtrar el texto
            para excluir política, espectáculos, deportes, cursos y ceremonias.
          </div>

          {socialMessage ? (
            <p
              className={`auth-message auth-message-${socialMessage.type} workflow-span-two`}
              role="status"
            >
              {socialMessage.text}
            </p>
          ) : null}

          <button
            className="primary-button workflow-span-two"
            type="submit"
            disabled={socialLoading}
          >
            {socialLoading ? "Registrando…" : "Agregar video oficial"}
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
