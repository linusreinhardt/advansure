import { NextResponse } from "next/server";

// Minimaler Endpunkt der Backend-Schicht (Schicht 2). Dient als Lebenszeichen
// und als Vorlage für die kommenden Route Handler TU-01 bis TU-06.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "advansure-api",
    timestamp: new Date().toISOString(),
  });
}
