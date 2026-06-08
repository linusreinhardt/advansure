"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ONBOARDING_FLAG } from "@/components/onboarding/onboarding";

/**
 * Einstieg in den Schadenflow. Beim ersten Mal führt der Weg über das
 * Onboarding (Avery vorstellen), danach direkt in den Chat.
 */
export function StartClaimButton() {
  const router = useRouter();

  const start = () => {
    let onboarded = false;
    try {
      onboarded = window.localStorage.getItem(ONBOARDING_FLAG) === "1";
    } catch {
      /* localStorage nicht verfügbar */
    }
    router.push(onboarded ? "/claim" : "/onboarding");
  };

  return (
    <Button size="lg" className="w-full" onClick={start}>
      <ShieldCheck />
      Schaden melden
    </Button>
  );
}
