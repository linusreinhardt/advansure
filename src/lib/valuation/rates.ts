/*
  lib/valuation — Pauschalmethode (TU-05), reiner Berechnungskern.

  Hinweis zum Scope: Die finale serverseitige Bewertung (Valuation-Service) ist
  ein eigenes Arbeitspaket (TU-05). Diese Datei hält die Pauschalsätze als
  zentrale Quelle, damit Avery-Chat, Foto-Walk-Ergebnis und die
  Zusammenfassung dieselben Werte und denselben Schadensgrad-Maßstab verwenden.

  Die €/m²-Sätze entsprechen dem Schadensgrad-Maßstab des Design-Systems
  (severity-Tokens). Im Pitch-Deck wurde beispielhaft mit einer dreistufigen
  Skala (200/450/800) gerechnet; maßgeblich ist hier die vierstufige Skala.
*/

import type { RoomType, SeverityLevel } from "@/lib/claim/types";

/** Pauschalsatz in Euro pro m² je Schadensgrad. */
export const SEVERITY_RATES_EUR_PER_SQM: Record<SeverityLevel, number> = {
  leicht: 80,
  mittel: 200,
  schwer: 450,
  total: 800,
};

/**
 * Default-Raumgrößen in m², falls die Police keine raumscharfe Fläche liefert
 * (FA/TU-05 Alternativablauf „kein Raummaß hinterlegt").
 */
export const DEFAULT_ROOM_SIZES_SQM: Record<RoomType, number> = {
  wohnzimmer: 22,
  kueche: 8,
  schlafzimmer: 14,
  bad: 6,
  flur: 5,
  kinderzimmer: 12,
  arbeitszimmer: 10,
  keller: 10,
  sonstiger: 12,
};

export function rateForSeverity(level: SeverityLevel): number {
  return SEVERITY_RATES_EUR_PER_SQM[level];
}

export function defaultRoomSize(roomType: RoomType): number {
  return DEFAULT_ROOM_SIZES_SQM[roomType];
}

/**
 * Vorläufige Schadenshöhe eines Raums: Fläche × Pauschalsatz je Schadensgrad.
 * @param sizeSqm überschreibt die Default-Raumgröße, falls bekannt.
 */
export function estimateRoomAmount(
  roomType: RoomType,
  severity: SeverityLevel,
  sizeSqm: number = defaultRoomSize(roomType),
): number {
  return Math.round(sizeSqm * rateForSeverity(severity));
}
