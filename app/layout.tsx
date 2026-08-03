import type { Metadata, Viewport } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";
import "./integrations.css";
import "./map.css";
import "./workflows.css";
import "./news.css";
import "./news-official.css";
import "./social-feeds.css";
import "./redesign.css";
import "./command-center.css";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";

export const metadata: Metadata = {
  title: "VIGÍA | Decisiones seguras ante emergencias",
  description:
    "Plataforma de prevención, respuesta y recuperación ante emergencias.",
  applicationName: "VIGÍA",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08131f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
