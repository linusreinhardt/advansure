import { z } from "zod";

/*
  Zentrale, Zod-validierte Konfiguration der Umgebungsvariablen.
  Wird erst bei Bedarf (getServerEnv) ausgewertet, damit der reine
  Grundgerüst-Build auch ohne gesetzte Keys durchläuft. Sobald die
  Backend-Services (TU-01 ff.) angebunden werden, liefert die Validierung
  früh eine klare Fehlermeldung bei fehlender Konfiguration.
*/
const serverEnvSchema = z.object({
  // Supabase (Schicht 3 – Datenbank, Storage, Auth)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  // Google AI Studio (Schicht 3 – Gemini, multimodal)
  GOOGLE_AI_STUDIO_API_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

/** Liest und validiert die Server-Umgebungsvariablen (nur serverseitig aufrufen). */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Ungültige Server-Umgebungsvariablen:\n" +
        JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
    );
  }
  cached = parsed.data;
  return cached;
}
