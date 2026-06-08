import { WifiOff } from "lucide-react";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-8 text-center">
      <div className="grid size-16 place-items-center rounded-2xl bg-secondary">
        <WifiOff className="size-7 text-muted-foreground" />
      </div>
      <h1 className="font-display text-2xl font-medium">Du bist offline</h1>
      <p className="max-w-[32ch] text-sm leading-relaxed text-muted-foreground">
        Für die Schadenmeldung wird eine Internetverbindung benötigt. Sobald du
        wieder online bist, kannst du fortfahren.
      </p>
    </main>
  );
}
