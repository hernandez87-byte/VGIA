"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { createClient } from "@/lib/supabase/client";

interface FamilyGroup {
  id: string;
  name: string;
}

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

export default function FamilyPage() {
  const [groups, setGroups] = useState<FamilyGroup[]>([]);
  const [groupName, setGroupName] = useState("Mi familia");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [status, setStatus] = useState("safe");
  const [locationLabel, setLocationLabel] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        if (active) {
          setMessage({
            type: "error",
            text: "Inicia sesión para administrar tu grupo familiar.",
          });
        }
        return;
      }

      const { data, error } = await supabase
        .from("family_groups")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (!active) return;

      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }

      const nextGroups = (data ?? []) as FamilyGroup[];
      setGroups(nextGroups);
      setSelectedGroup(nextGroups[0]?.id ?? "");
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function createGroup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_family_group", {
        group_name: groupName,
      });
      if (error) throw error;

      const group = { id: String(data), name: groupName.trim() };
      setGroups((current) => [...current, group]);
      setSelectedGroup(group.id);
      setMessage({ type: "success", text: "Grupo familiar creado." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo crear el grupo.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function locate() {
    setMessage(null);
    try {
      const nextCoordinates = await getLocation();
      setCoordinates(nextCoordinates);
      setMessage({ type: "success", text: "Ubicación lista para la confirmación." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo obtener la ubicación.",
      });
    }
  }

  async function checkIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!selectedGroup) {
      setMessage({ type: "error", text: "Primero crea o selecciona un grupo." });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.rpc("create_safety_checkin", {
        checkin_group_id: selectedGroup,
        checkin_status: status,
        checkin_location_label: locationLabel || null,
        checkin_latitude: coordinates?.latitude ?? null,
        checkin_longitude: coordinates?.longitude ?? null,
        checkin_event_id: null,
      });
      if (error) throw error;

      setMessage({
        type: "success",
        text: "Tu estado quedó registrado durante 24 horas.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "No se pudo registrar tu estado.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="workflow-shell">
      <section className="workflow-card workflow-card-wide">
        <BrandMark />
        <span className="eyebrow">Coordinación familiar</span>
        <h1>Confirma dónde estás y cómo te encuentras</h1>
        <p>
          Las confirmaciones duran 24 horas. Compartir ubicación eternamente sería menos un plan familiar y más una película inquietante.
        </p>

        <div className="workflow-columns">
          <form className="workflow-form" onSubmit={createGroup}>
            <h2>Crear grupo</h2>
            <label>
              Nombre del grupo
              <input
                required
                minLength={2}
                maxLength={120}
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
              />
            </label>
            <button className="secondary-button" type="submit" disabled={loading}>
              Crear grupo familiar
            </button>
          </form>

          <form className="workflow-form" onSubmit={checkIn}>
            <h2>Registrar mi estado</h2>
            <label>
              Grupo
              <select
                value={selectedGroup}
                onChange={(event) => setSelectedGroup(event.target.value)}
              >
                <option value="">Selecciona un grupo</option>
                {groups.map((group) => (
                  <option value={group.id} key={group.id}>{group.name}</option>
                ))}
              </select>
            </label>

            <label>
              Estado
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="safe">Estoy a salvo</option>
                <option value="moving">Estoy trasladándome</option>
                <option value="needs_help">Necesito ayuda</option>
                <option value="unknown">Estado incierto</option>
              </select>
            </label>

            <label>
              Lugar o referencia
              <input
                maxLength={180}
                value={locationLabel}
                onChange={(event) => setLocationLabel(event.target.value)}
                placeholder="Ejemplo: refugio municipal"
              />
            </label>

            <button className="secondary-button" type="button" onClick={locate}>
              {coordinates ? "Actualizar ubicación" : "Agregar ubicación"}
            </button>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Guardando…" : "Confirmar mi estado"}
            </button>
          </form>
        </div>

        {message ? (
          <p className={`auth-message auth-message-${message.type}`} role="status">
            {message.text}
          </p>
        ) : null}

        <nav className="workflow-nav">
          <Link href="/login">Iniciar sesión</Link>
          <Link href="/">Volver al tablero</Link>
        </nav>
      </section>
    </main>
  );
}
