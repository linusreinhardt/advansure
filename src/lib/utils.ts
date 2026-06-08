import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Führt bedingte Klassen zusammen und löst Tailwind-Konflikte sauber auf. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
