import type { MetadataRoute } from "next";

// Wird von Next unter /manifest.webmanifest ausgeliefert und macht Advansure
// als PWA auf dem Homescreen installierbar (ohne App-Store).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Advansure – Schadenmeldung",
    short_name: "Advansure",
    description:
      "Dialoggeführte, KI-gestützte Schadenmeldung für die Hausratversicherung.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0c0e",
    theme_color: "#0c0c0e",
    lang: "de",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
