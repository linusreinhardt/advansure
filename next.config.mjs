import withSerwistInit from "@serwist/next";

// Serwist generiert beim Production-Build den Service Worker aus src/app/sw.ts
// und legt ihn als public/sw.js ab. Im Dev-Modus ist die PWA bewusst deaktiviert,
// damit Caching die Entwicklung nicht stört ("Cache-Hölle").
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default withSerwist(nextConfig);
