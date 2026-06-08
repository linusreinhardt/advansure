/*
  Lokale Vorgangsnummer (FA-07) im Format ADV-JJJJ-XXXX.

  Im PoC clientseitig erzeugt, damit der Nutzer sofort eine Bestätigung erhält.
  Im fertigen System vergibt das Backend die Nummer atomar über eine
  Postgres-Sequenz (TU-06) – diese Funktion wird dann durch die Server-Antwort
  ersetzt.
*/
export function generateCaseNumber(date: Date = new Date()): string {
  const year = date.getFullYear();
  const suffix = String(Math.floor(1000 + Math.random() * 9000));
  return `ADV-${year}-${suffix}`;
}
