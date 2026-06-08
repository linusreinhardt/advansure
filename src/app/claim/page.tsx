import type { Metadata } from "next";

import { getPersona } from "@/lib/personas";
import { ClaimFlow } from "@/components/claim/claim-flow";

export const metadata: Metadata = {
  title: "Schaden melden",
};

export default function ClaimPage() {
  // PoC: Persona über Mock-User-ID (FA-01). Später aus der Session (TU-01).
  return <ClaimFlow persona={getPersona()} />;
}
