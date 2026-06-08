import type { Metadata, Viewport } from "next";
import "./globals.css";
import { OnlineStatus } from "@/components/pwa/online-status";

const APP_NAME = "Advansure";
const APP_DESCRIPTION =
  "Dialoggeführte, KI-gestützte Schadenmeldung für die Hausratversicherung.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: "Advansure – Schaden melden in Minuten",
    template: "%s · Advansure",
  },
  description: APP_DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0c0e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body>
        <OnlineStatus />
        {children}
      </body>
    </html>
  );
}
