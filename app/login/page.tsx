"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import {
  createClient,
  hasSupabaseBrowserConfig,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!hasSupabaseBrowserConfig()) {
      setMessage({
        type: "error",
        text: "La autenticación todavía no está configurada en este entorno.",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName.trim() || email.split("@")[0] },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        setMessage({
          type: "success",
          text: "Cuenta creada. Revisa tu correo si la confirmación está activada.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "No se pudo completar la autenticación.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <BrandMark />
        <h1>{mode === "signin" ? "Entrar a VIGÍA" : "Crear cuenta"}</h1>
        <p>
          La cuenta permite configurar familia, reportes y confirmaciones de seguridad. No hace que las catástrofes pidan cita, lamentablemente.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <label>
              Nombre
              <input
                autoComplete="name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Nombre visible"
              />
            </label>
          ) : null}

          <label>
            Correo electrónico
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@ejemplo.com"
            />
          </label>

          <label>
            Contraseña
            <input
              required
              minLength={8}
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mínimo 8 caracteres"
            />
          </label>

          {message ? (
            <p className={`auth-message auth-message-${message.type}`} role="status">
              {message.text}
            </p>
          ) : null}

          <button className="primary-button" type="submit" disabled={loading}>
            {loading
              ? "Procesando…"
              : mode === "signin"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="auth-switch">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setMessage(null);
            }}
          >
            {mode === "signin"
              ? "No tengo cuenta"
              : "Ya tengo una cuenta"}
          </button>
        </div>

        <Link className="auth-home" href="/">
          Volver al tablero público
        </Link>
      </section>
    </main>
  );
}
