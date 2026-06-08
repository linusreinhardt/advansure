"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Zeigt einen dezenten Hinweis, sobald die Verbindung verloren geht
 * (vgl. FA-01 Alternativablauf 2 "Offline-Start"). Reicht im PoC als
 * Sichtbarmachung des Offline-Zustands; die eigentliche Offline-Seite
 * übernimmt der Service Worker via /~offline.
 */
export function OnlineStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground"
    >
      <WifiOff className="size-4" />
      Keine Internetverbindung – einige Funktionen sind nicht verfügbar.
    </div>
  );
}
