"use client";

import { useEffect, useState } from "react";

export function ServiceWorkerRegistration() {
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    void navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "idle") return null;

  return (
    <span className="service-worker-note" role="status">
      {status === "ready"
        ? "Modo sin conexión preparado"
        : "No se pudo preparar el modo sin conexión"}
    </span>
  );
}
