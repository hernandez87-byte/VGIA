import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VIGÍA",
    short_name: "VIGÍA",
    description: "Decisiones seguras ante emergencias.",
    start_url: "/",
    display: "standalone",
    background_color: "#08131f",
    theme_color: "#08131f",
    icons: [
      {
        src: "/vigia-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
