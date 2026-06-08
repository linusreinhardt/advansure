/*
  Demo-Personas für den PoC (FA-01 / TU-01).

  Im fertigen System lädt das Backend die Police über eine Mock-User-ID aus
  Supabase (Tabelle `policies`). Solange das Backend (TU-01) noch nicht steht,
  liefern diese Seed-Daten dieselbe Struktur clientseitig, damit der Startscreen
  und der Avery-Dialog bereits personalisiert funktionieren.

  Leon entspricht dem Startscreen-Mockup aus dem Pitch-Deck
  (Weinheimer Straße 14 · 48 m² · 55 Gegenstände · versichert bis 21.500 €).
*/

export type PersonaId = "leon" | "robert" | "julia";

export interface Persona {
  id: PersonaId;
  /** Anrede im Du-Format, wie Avery sie nutzt. */
  firstName: string;
  /** Versicherte Adresse (Hausrat ist objektgebunden). */
  address: string;
  /** Wohnfläche in m² – Basis der Pauschalmethode (TU-05). */
  livingSpaceSqm: number;
  /** Anzahl im Inventar erfasster Gegenstände (rein illustrativ). */
  itemsInsured: number;
  /** Versicherungssumme in Euro. */
  sumInsuredEur: number;
  /** Monatsbeitrag in Euro. */
  monthlyPremiumEur: number;
  /** Vertragsnummer (Anzeige). */
  policyNumber: string;
  /** Typisches Schadenszenario der Persona (für Demo-Vorbelegung). */
  scenarioHint: string;
}

export const PERSONAS: Record<PersonaId, Persona> = {
  leon: {
    id: "leon",
    firstName: "Leon",
    address: "Weinheimer Straße 14",
    livingSpaceSqm: 48,
    itemsInsured: 55,
    sumInsuredEur: 21_500,
    monthlyPremiumEur: 8.2,
    policyNumber: "HR-2024-0098-LE",
    scenarioHint: "Leitungswasserschaden im Wohnzimmer",
  },
  robert: {
    id: "robert",
    firstName: "Robert",
    address: "Am Wingertsberg 7",
    livingSpaceSqm: 112,
    itemsInsured: 134,
    sumInsuredEur: 68_000,
    monthlyPremiumEur: 21.9,
    policyNumber: "HR-2021-0457-RO",
    scenarioHint: "Brandschaden in der Küche",
  },
  julia: {
    id: "julia",
    firstName: "Julia",
    address: "Q6 18, 3. OG",
    livingSpaceSqm: 63,
    itemsInsured: 78,
    sumInsuredEur: 34_200,
    monthlyPremiumEur: 12.4,
    policyNumber: "HR-2023-0231-JU",
    scenarioHint: "Einbruchdiebstahl im Schlafzimmer",
  },
};

/** Persona, die ohne explizite Auswahl geladen wird (vgl. Pitch-Deck: Leon). */
export const DEFAULT_PERSONA_ID: PersonaId = "leon";

export function getPersona(id: PersonaId = DEFAULT_PERSONA_ID): Persona {
  return PERSONAS[id];
}

/** Euro-Betrag im deutschen Format ohne Nachkommastellen, z. B. „21.500 €". */
export function formatEur(value: number, withCents = false): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(value);
}
