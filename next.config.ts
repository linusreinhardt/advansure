import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Routen-Typprüfung deaktiviert, damit dynamische String-Hrefs
  // (z. B. /apps/<slug>) ohne Casting funktionieren.
  typedRoutes: false,
}

export default nextConfig
